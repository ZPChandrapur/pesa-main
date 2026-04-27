
/*
  # Create pesa.sync_aarakhada_all() Stored Procedure

  ## Summary
  Creates a stored procedure that fully rebuilds all 6 aarakhada aggregation tables
  from the `pesa.works` source of truth, joined with `pesa.villages` for location data.

  ## What It Does
  1. Normalizes year strings (trims whitespace, maps variants like '2024/25', '2024-2025' to canonical form)
  2. Truncates and rebuilds all 6 aarakhada tables:
     - `pesa.aarakhada_physical`     — GP-level physical progress (per village × work_category × year)
     - `pesa.aarakhada_financial`    — GP-level financial progress (per village × work_category × year)
     - `pesa.taluka_aarakhada_physical`  — Taluka-level physical aggregation
     - `pesa.taluka_aarakhada_financial` — Taluka-level financial aggregation
     - `pesa.district_aarakhada_physical`  — District-level physical aggregation
     - `pesa.district_aarakhada_financial` — District-level financial aggregation

  ## Tables Modified
  All 6 aarakhada tables are truncated then re-inserted from pesa.works source.

  ## Security
  - Procedure runs with SECURITY DEFINER so it can be called by cron
  - No RLS changes needed (internal procedure)

  ## Notes
  - Year normalization: trims whitespace, maps '2024/25' → '2024-25', '2024-2025' → '2024-25', etc.
  - Physical status mapping: 'completed' → completed_works, 'in_progress' → ongoing_works, 'pending' → pending_works
  - Financial amounts sourced from works.agreement_approval_amount (released_amount proxy)
  - Call with: SELECT pesa.sync_aarakhada_all();
*/

CREATE OR REPLACE FUNCTION pesa.normalize_year(raw_year text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  y text;
BEGIN
  IF raw_year IS NULL THEN RETURN NULL; END IF;
  -- Trim whitespace
  y := TRIM(raw_year);
  -- Map slash variants: 2024/25 → 2024-25
  y := REGEXP_REPLACE(y, '^(\d{4})/(\d{2})$', '\1-\2');
  -- Map long year: 2024-2025 → 2024-25
  y := REGEXP_REPLACE(y, '^(\d{4})-20(\d{2})$', '\1-\2');
  -- Map same-year typo: 2024-24 → 2024-25 (best guess: shift end by 1)
  -- Only do this if start and end are the same
  IF y ~ '^\d{4}-\d{2}$' THEN
    -- normalize end year to be start+1 if they're the same digit pair
    DECLARE
      start_y text := SUBSTRING(y, 1, 4);
      end_y text := SUBSTRING(y, 6, 2);
      expected_end text;
    BEGIN
      expected_end := LPAD(((start_y::int % 100) + 1)::text, 2, '0');
      IF end_y = LPAD((start_y::int % 100)::text, 2, '0') THEN
        y := start_y || '-' || expected_end;
      END IF;
    END;
  END IF;
  RETURN y;
END;
$$;

CREATE OR REPLACE FUNCTION pesa.sync_aarakhada_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

  -- ============================================================
  -- 1. GP-level PHYSICAL: aarakhada_physical
  --    Key: (village_name, work_category, year)
  --    One row per village × work_category × year
  --    Counts works by current_status
  -- ============================================================
  DELETE FROM pesa.aarakhada_physical
  WHERE year IN (
    SELECT DISTINCT pesa.normalize_year(year) FROM pesa.works WHERE year IS NOT NULL
  );

  INSERT INTO pesa.aarakhada_physical (
    village_id, village_name, work_category, year, added_month,
    gram_panchayat, taluka, district,
    sanctioned_works, completed_works, ongoing_works, pending_works,
    created_at, updated_at
  )
  SELECT
    w.village_id,
    v.village_name,
    w.work_category,
    pesa.normalize_year(w.year) AS year,
    MAX(w.added_month) AS added_month,
    v.gram_panchayat,
    v.block AS taluka,
    v.district,
    COUNT(*) AS sanctioned_works,
    COUNT(*) FILTER (WHERE w.current_status = 'completed') AS completed_works,
    COUNT(*) FILTER (WHERE w.current_status = 'in_progress') AS ongoing_works,
    COUNT(*) FILTER (WHERE w.current_status = 'pending') AS pending_works,
    now(),
    now()
  FROM pesa.works w
  JOIN pesa.villages v ON v.id = w.village_id
  WHERE w.year IS NOT NULL AND w.work_category IS NOT NULL
  GROUP BY w.village_id, v.village_name, w.work_category, pesa.normalize_year(w.year),
           v.gram_panchayat, v.block, v.district
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 2. GP-level FINANCIAL: aarakhada_financial
  --    Key: (village_name, work_category, year)
  --    Sums financial amounts from works
  -- ============================================================
  DELETE FROM pesa.aarakhada_financial
  WHERE year IN (
    SELECT DISTINCT pesa.normalize_year(year) FROM pesa.works WHERE year IS NOT NULL
  );

  INSERT INTO pesa.aarakhada_financial (
    village_id, village_name, work_category, year, added_month,
    gram_panchayat, taluka, district,
    sanctioned_amount, released_amount,
    previous_expenditure, current_expenditure, cumulative_expenditure, remaining_funds,
    created_at, updated_at
  )
  SELECT
    w.village_id,
    v.village_name,
    w.work_category,
    pesa.normalize_year(w.year) AS year,
    MAX(w.added_month) AS added_month,
    v.gram_panchayat,
    v.block AS taluka,
    v.district,
    SUM(COALESCE(w.agreement_approval_amount, 0)) AS sanctioned_amount,
    SUM(COALESCE(w.agreement_approval_amount, 0)) AS released_amount,
    0 AS previous_expenditure,
    0 AS current_expenditure,
    0 AS cumulative_expenditure,
    SUM(COALESCE(w.agreement_approval_amount, 0)) AS remaining_funds,
    now(),
    now()
  FROM pesa.works w
  JOIN pesa.villages v ON v.id = w.village_id
  WHERE w.year IS NOT NULL AND w.work_category IS NOT NULL
  GROUP BY w.village_id, v.village_name, w.work_category, pesa.normalize_year(w.year),
           v.gram_panchayat, v.block, v.district
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 3. Taluka-level PHYSICAL: taluka_aarakhada_physical
  --    Key: (taluka_name, gram_panchayat, work_category, year)
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
    pesa.normalize_year(w.year) AS year,
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
  --    Key: (taluka_name, gram_panchayat, work_category, year)
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
    pesa.normalize_year(w.year) AS year,
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
  --    Key: (district_name, taluka_name, work_category, year)
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
    v.district AS district_name,
    v.block AS taluka_name,
    w.work_category,
    pesa.normalize_year(w.year) AS year,
    COUNT(DISTINCT v.gram_panchayat) AS pesa_gram_panchayat_count,
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
  GROUP BY v.district, v.block, w.work_category, pesa.normalize_year(w.year)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 6. District-level FINANCIAL: district_aarakhada_financial
  --    Key: (district_name, taluka_name, work_category, year)
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
    v.district AS district_name,
    v.block AS taluka_name,
    w.work_category,
    pesa.normalize_year(w.year) AS year,
    COUNT(DISTINCT v.gram_panchayat) AS pesa_gram_panchayat_count,
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
  GROUP BY v.district, v.block, w.work_category, pesa.normalize_year(w.year)
  ON CONFLICT DO NOTHING;

END;
$$;
