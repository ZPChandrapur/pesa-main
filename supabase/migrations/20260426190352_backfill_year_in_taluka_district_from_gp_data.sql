/*
  # Backfill year in taluka and district aarakhada tables from GP-level data

  1. Purpose
    - Existing records in taluka_aarakhada_physical, taluka_aarakhada_financial,
      district_aarakhada_physical, district_aarakhada_financial have year = NULL
    - This migration populates year by looking up the year from the corresponding
      GP-level records in aarakhada_financial and aarakhada_physical tables
    - Uses the most common year for each (gram_panchayat, work_category) group
      when multiple years exist

  2. Strategy
    - For taluka tables: join on gram_panchayat + work_category to get year from GP data
    - For district tables: derive year by joining through taluka data or directly from GP data
      grouped by taluka + work_category
    - When a row has multiple GP years, use the most frequent year as a best-effort backfill
    - Rows with NULL year in GP tables remain NULL (no data to infer from)

  3. Important notes
    - This is a one-time backfill; going forward, year is set when works are created
    - Existing rows with null year will be updated with the most common year from GP data
    - No rows are deleted or split — this just populates the year column on existing rows
*/

-- Step 1: Update taluka_aarakhada_physical year from aarakhada_physical
UPDATE pesa.taluka_aarakhada_physical tap
SET year = subq.year
FROM (
  SELECT
    ap.gram_panchayat,
    ap.work_category,
    ap.year,
    COUNT(*) AS cnt
  FROM pesa.aarakhada_physical ap
  WHERE ap.year IS NOT NULL AND ap.year != ''
  GROUP BY ap.gram_panchayat, ap.work_category, ap.year
) subq
WHERE tap.gram_panchayat = subq.gram_panchayat
  AND tap.work_category = subq.work_category
  AND tap.year IS NULL
  AND subq.cnt = (
    SELECT MAX(cnt2) FROM (
      SELECT COUNT(*) AS cnt2
      FROM pesa.aarakhada_physical ap2
      WHERE ap2.gram_panchayat = subq.gram_panchayat
        AND ap2.work_category = subq.work_category
        AND ap2.year IS NOT NULL
      GROUP BY ap2.year
    ) maxq
  );

-- Step 2: Update taluka_aarakhada_financial year from aarakhada_financial
UPDATE pesa.taluka_aarakhada_financial taf
SET year = subq.year
FROM (
  SELECT
    af.gram_panchayat,
    af.work_category,
    af.year,
    COUNT(*) AS cnt
  FROM pesa.aarakhada_financial af
  WHERE af.year IS NOT NULL AND af.year != ''
  GROUP BY af.gram_panchayat, af.work_category, af.year
) subq
WHERE taf.gram_panchayat = subq.gram_panchayat
  AND taf.work_category = subq.work_category
  AND taf.year IS NULL
  AND subq.cnt = (
    SELECT MAX(cnt2) FROM (
      SELECT COUNT(*) AS cnt2
      FROM pesa.aarakhada_financial af2
      WHERE af2.gram_panchayat = subq.gram_panchayat
        AND af2.work_category = subq.work_category
        AND af2.year IS NOT NULL
      GROUP BY af2.year
    ) maxq
  );

-- Step 3: Update district_aarakhada_physical year from taluka_aarakhada_physical
-- (after taluka was backfilled above)
UPDATE pesa.district_aarakhada_physical dap
SET year = subq.year
FROM (
  SELECT
    tap.taluka_name,
    tap.work_category,
    tap.year,
    COUNT(*) AS cnt
  FROM pesa.taluka_aarakhada_physical tap
  WHERE tap.year IS NOT NULL AND tap.year != ''
  GROUP BY tap.taluka_name, tap.work_category, tap.year
) subq
WHERE dap.taluka_name = subq.taluka_name
  AND dap.work_category = subq.work_category
  AND dap.year IS NULL
  AND subq.cnt = (
    SELECT MAX(cnt2) FROM (
      SELECT COUNT(*) AS cnt2
      FROM pesa.taluka_aarakhada_physical tap2
      WHERE tap2.taluka_name = subq.taluka_name
        AND tap2.work_category = subq.work_category
        AND tap2.year IS NOT NULL
      GROUP BY tap2.year
    ) maxq
  );

-- Step 4: Update district_aarakhada_financial year from taluka_aarakhada_financial
UPDATE pesa.district_aarakhada_financial daf
SET year = subq.year
FROM (
  SELECT
    taf.taluka_name,
    taf.work_category,
    taf.year,
    COUNT(*) AS cnt
  FROM pesa.taluka_aarakhada_financial taf
  WHERE taf.year IS NOT NULL AND taf.year != ''
  GROUP BY taf.taluka_name, taf.work_category, taf.year
) subq
WHERE daf.taluka_name = subq.taluka_name
  AND daf.work_category = subq.work_category
  AND daf.year IS NULL
  AND subq.cnt = (
    SELECT MAX(cnt2) FROM (
      SELECT COUNT(*) AS cnt2
      FROM pesa.taluka_aarakhada_financial taf2
      WHERE taf2.taluka_name = subq.taluka_name
        AND taf2.work_category = subq.work_category
        AND taf2.year IS NOT NULL
      GROUP BY taf2.year
    ) maxq
  );
