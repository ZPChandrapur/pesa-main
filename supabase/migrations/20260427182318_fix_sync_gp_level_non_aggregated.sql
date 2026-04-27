
/*
  # Fix sync_aarakhada_all: GP-level tables must be work-level (non-aggregated)

  ## Problem
  The previous sync procedure aggregated aarakhada_physical and aarakhada_financial
  by (village, work_category, year), producing one row per group with work_name = NULL.

  ## Correct Design
  - aarakhada_physical: one row per work (work_name preserved), sanctioned_works=1,
    completed/ongoing/pending set from current_status
  - aarakhada_financial: one row per work (work_name preserved), amounts from pesa.works,
    monthly expenditure tracked via added_month
  - taluka/district tables: remain aggregated (correct as-is)

  ## Changes
  Rewrites the GP-level sections of pesa.sync_aarakhada_all() to insert one row per
  work record instead of one row per (village, category, year) group.
*/

CREATE OR REPLACE FUNCTION pesa.sync_aarakhada_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

  -- ============================================================
  -- 1. GP-level PHYSICAL: aarakhada_physical
  --    One row per work (preserves work_name)
  --    sanctioned_works=1, status counts from current_status
  -- ============================================================
  DELETE FROM pesa.aarakhada_physical
  WHERE year IN (
    SELECT DISTINCT pesa.normalize_year(year) FROM pesa.works WHERE year IS NOT NULL
  );

  INSERT INTO pesa.aarakhada_physical (
    village_id, village_name, work_category, work_name, work_type, year, added_month,
    gram_panchayat, taluka, district,
    sanctioned_works, completed_works, ongoing_works, pending_works,
    status, created_at, updated_at
  )
  SELECT
    w.village_id,
    v.village_name,
    w.work_category,
    w.work_name,
    'physical',
    pesa.normalize_year(w.year),
    w.added_month,
    v.gram_panchayat,
    v.block,
    v.district,
    1 AS sanctioned_works,
    CASE WHEN w.current_status = 'completed'  THEN 1 ELSE 0 END AS completed_works,
    CASE WHEN w.current_status = 'in_progress' THEN 1 ELSE 0 END AS ongoing_works,
    CASE WHEN w.current_status = 'pending'    THEN 1 ELSE 0 END AS pending_works,
    w.current_status,
    now(),
    now()
  FROM pesa.works w
  JOIN pesa.villages v ON v.id = w.village_id
  WHERE w.year IS NOT NULL AND w.work_category IS NOT NULL;

  -- ============================================================
  -- 2. GP-level FINANCIAL: aarakhada_financial
  --    One row per work (preserves work_name)
  --    Amounts from pesa.works fields
  -- ============================================================
  DELETE FROM pesa.aarakhada_financial
  WHERE year IN (
    SELECT DISTINCT pesa.normalize_year(year) FROM pesa.works WHERE year IS NOT NULL
  );

  INSERT INTO pesa.aarakhada_financial (
    village_id, village_name, work_category, work_name, work_type, year, added_month,
    gram_panchayat, taluka, district,
    sanctioned_amount, released_amount,
    previous_expenditure, current_expenditure, cumulative_expenditure, remaining_funds,
    status, created_at, updated_at
  )
  SELECT
    w.village_id,
    v.village_name,
    w.work_category,
    w.work_name,
    'financial',
    pesa.normalize_year(w.year),
    w.added_month,
    v.gram_panchayat,
    v.block,
    v.district,
    COALESCE(w.agreement_approval_amount, 0) AS sanctioned_amount,
    COALESCE(w.agreement_approval_amount, 0) AS released_amount,
    0 AS previous_expenditure,
    0 AS current_expenditure,
    0 AS cumulative_expenditure,
    COALESCE(w.agreement_approval_amount, 0) AS remaining_funds,
    w.current_status,
    now(),
    now()
  FROM pesa.works w
  JOIN pesa.villages v ON v.id = w.village_id
  WHERE w.year IS NOT NULL AND w.work_category IS NOT NULL;

  -- ============================================================
  -- 3. Taluka-level PHYSICAL: taluka_aarakhada_physical
  --    Aggregated by (taluka, gram_panchayat, work_category, year)
  -- ============================================================
  DELETE FROM pesa.taluka_aarakhada_physical
  WHERE year IN (
    SELECT DISTINCT pesa.normalize_year(year) FROM pesa.works WHERE year IS NOT NULL
  );

  INSERT INTO pesa.taluka_aarakhada_physical (
    taluka_name, gram_panchayat, work_category, year,
    pesa_village_count,
    sanctioned_works, completed_works, ongoing_works, pending_works,
    created_at, updated_at
  )
  SELECT
    v.block AS taluka_name,
    v.gram_panchayat,
    w.work_category,
    pesa.normalize_year(w.year),
    COUNT(DISTINCT v.id) AS pesa_village_count,
    COUNT(*) AS sanctioned_works,
    COUNT(*) FILTER (WHERE w.current_status = 'completed') AS completed_works,
    COUNT(*) FILTER (WHERE w.current_status = 'in_progress') AS ongoing_works,
    COUNT(*) FILTER (WHERE w.current_status = 'pending') AS pending_works,
    now(),
    now()
  FROM pesa.works w
  JOIN pesa.villages v ON v.id = w.village_id
  WHERE w.year IS NOT NULL AND w.work_category IS NOT NULL
  GROUP BY v.block, v.gram_panchayat, w.work_category, pesa.normalize_year(w.year)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 4. Taluka-level FINANCIAL: taluka_aarakhada_financial
  --    Aggregated by (taluka, gram_panchayat, work_category, year)
  -- ============================================================
  DELETE FROM pesa.taluka_aarakhada_financial
  WHERE year IN (
    SELECT DISTINCT pesa.normalize_year(year) FROM pesa.works WHERE year IS NOT NULL
  );

  INSERT INTO pesa.taluka_aarakhada_financial (
    taluka_name, gram_panchayat, work_category, year,
    pesa_village_count,
    annual_approved_fund, annual_received_fund,
    previous_expenditure, current_expenditure, cumulative_expenditure, remaining_funds,
    created_at, updated_at
  )
  SELECT
    v.block AS taluka_name,
    v.gram_panchayat,
    w.work_category,
    pesa.normalize_year(w.year),
    COUNT(DISTINCT v.id) AS pesa_village_count,
    SUM(COALESCE(w.agreement_approval_amount, 0)) AS annual_approved_fund,
    SUM(COALESCE(w.agreement_approval_amount, 0)) AS annual_received_fund,
    0 AS previous_expenditure,
    0 AS current_expenditure,
    0 AS cumulative_expenditure,
    SUM(COALESCE(w.agreement_approval_amount, 0)) AS remaining_funds,
    now(),
    now()
  FROM pesa.works w
  JOIN pesa.villages v ON v.id = w.village_id
  WHERE w.year IS NOT NULL AND w.work_category IS NOT NULL
  GROUP BY v.block, v.gram_panchayat, w.work_category, pesa.normalize_year(w.year)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 5. District-level PHYSICAL: district_aarakhada_physical
  --    Aggregated by (district, taluka, work_category, year)
  -- ============================================================
  DELETE FROM pesa.district_aarakhada_physical
  WHERE year IN (
    SELECT DISTINCT pesa.normalize_year(year) FROM pesa.works WHERE year IS NOT NULL
  );

  INSERT INTO pesa.district_aarakhada_physical (
    district_name, taluka_name, work_category, year,
    pesa_gram_panchayat_count, pesa_village_count,
    sanctioned_works, completed_works, ongoing_works, pending_works,
    created_at, updated_at
  )
  SELECT
    v.district,
    v.block,
    w.work_category,
    pesa.normalize_year(w.year),
    COUNT(DISTINCT v.gram_panchayat),
    COUNT(DISTINCT v.id),
    COUNT(*),
    COUNT(*) FILTER (WHERE w.current_status = 'completed'),
    COUNT(*) FILTER (WHERE w.current_status = 'in_progress'),
    COUNT(*) FILTER (WHERE w.current_status = 'pending'),
    now(),
    now()
  FROM pesa.works w
  JOIN pesa.villages v ON v.id = w.village_id
  WHERE w.year IS NOT NULL AND w.work_category IS NOT NULL
  GROUP BY v.district, v.block, w.work_category, pesa.normalize_year(w.year)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 6. District-level FINANCIAL: district_aarakhada_financial
  --    Aggregated by (district, taluka, work_category, year)
  -- ============================================================
  DELETE FROM pesa.district_aarakhada_financial
  WHERE year IN (
    SELECT DISTINCT pesa.normalize_year(year) FROM pesa.works WHERE year IS NOT NULL
  );

  INSERT INTO pesa.district_aarakhada_financial (
    district_name, taluka_name, work_category, year,
    pesa_gram_panchayat_count, pesa_village_count,
    annual_approved_fund, annual_received_fund,
    previous_expenditure, current_expenditure, cumulative_expenditure, remaining_funds,
    created_at, updated_at
  )
  SELECT
    v.district,
    v.block,
    w.work_category,
    pesa.normalize_year(w.year),
    COUNT(DISTINCT v.gram_panchayat),
    COUNT(DISTINCT v.id),
    SUM(COALESCE(w.agreement_approval_amount, 0)),
    SUM(COALESCE(w.agreement_approval_amount, 0)),
    0, 0, 0,
    SUM(COALESCE(w.agreement_approval_amount, 0)),
    now(),
    now()
  FROM pesa.works w
  JOIN pesa.villages v ON v.id = w.village_id
  WHERE w.year IS NOT NULL AND w.work_category IS NOT NULL
  GROUP BY v.district, v.block, w.work_category, pesa.normalize_year(w.year)
  ON CONFLICT DO NOTHING;

END;
$$;
