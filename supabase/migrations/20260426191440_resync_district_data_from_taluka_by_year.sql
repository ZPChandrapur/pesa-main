/*
  # Resync district aarakhada tables from taluka data, grouped by year

  1. Problem
    - district_aarakhada_physical and district_aarakhada_financial rows have
      stale/incorrect values because the backfill only updated the year field
      on existing single rows, but did not re-aggregate the work counts/financials
      per year from the taluka tables.

  2. Solution
    - UPDATE existing district rows using aggregated sums from taluka tables
      matched on (taluka_name, work_category, year)
    - INSERT new district rows for any (taluka_name, work_category, year) combo
      that exists in taluka tables but not yet in district tables

  3. Physical table: aggregate sanctioned/completed/ongoing/pending from taluka_aarakhada_physical
  4. Financial table: aggregate fund/expenditure columns from taluka_aarakhada_financial
*/

-- Step 1: Update existing district_aarakhada_physical rows with correct aggregated values
UPDATE pesa.district_aarakhada_physical dap
SET
  sanctioned_works   = agg.sanctioned,
  completed_works    = agg.completed,
  ongoing_works      = agg.ongoing,
  pending_works      = agg.pending,
  pesa_gram_panchayat_count = agg.gp_count,
  pesa_village_count = agg.village_count,
  updated_at         = now()
FROM (
  SELECT
    tap.taluka_name,
    tap.work_category,
    tap.year,
    SUM(tap.sanctioned_works) AS sanctioned,
    SUM(tap.completed_works)  AS completed,
    SUM(tap.ongoing_works)    AS ongoing,
    SUM(tap.pending_works)    AS pending,
    COUNT(DISTINCT tap.gram_panchayat) AS gp_count,
    SUM(tap.pesa_village_count) AS village_count
  FROM pesa.taluka_aarakhada_physical tap
  WHERE tap.year IS NOT NULL
  GROUP BY tap.taluka_name, tap.work_category, tap.year
) agg
WHERE dap.taluka_name = agg.taluka_name
  AND dap.work_category = agg.work_category
  AND dap.year = agg.year;

-- Step 2: Insert missing district_aarakhada_physical rows (year combos not yet present)
INSERT INTO pesa.district_aarakhada_physical (
  id, district_name, taluka_name, work_category, year,
  sanctioned_works, completed_works, ongoing_works, pending_works,
  approved_works, pesa_gram_panchayat_count, pesa_village_count,
  physical_progress_percentage, work_type, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  COALESCE(v.district, 'Chandrapur'),
  agg.taluka_name,
  agg.work_category,
  agg.year,
  agg.sanctioned,
  agg.completed,
  agg.ongoing,
  agg.pending,
  0,
  agg.gp_count,
  agg.village_count,
  0,
  'physical',
  now(),
  now()
FROM (
  SELECT
    tap.taluka_name,
    tap.work_category,
    tap.year,
    SUM(tap.sanctioned_works) AS sanctioned,
    SUM(tap.completed_works)  AS completed,
    SUM(tap.ongoing_works)    AS ongoing,
    SUM(tap.pending_works)    AS pending,
    COUNT(DISTINCT tap.gram_panchayat) AS gp_count,
    SUM(tap.pesa_village_count) AS village_count
  FROM pesa.taluka_aarakhada_physical tap
  WHERE tap.year IS NOT NULL
  GROUP BY tap.taluka_name, tap.work_category, tap.year
) agg
LEFT JOIN (
  SELECT DISTINCT block, district FROM pesa.villages
) v ON v.block = agg.taluka_name
WHERE NOT EXISTS (
  SELECT 1 FROM pesa.district_aarakhada_physical dap
  WHERE dap.taluka_name = agg.taluka_name
    AND dap.work_category = agg.work_category
    AND dap.year = agg.year
);

-- Step 3: Update existing district_aarakhada_financial rows with correct aggregated values
UPDATE pesa.district_aarakhada_financial daf
SET
  annual_approved_fund   = agg.approved,
  annual_received_fund   = agg.received,
  received_interest      = agg.interest,
  total_received_fund    = agg.total_received,
  previous_expenditure   = agg.prev_exp,
  current_expenditure    = agg.curr_exp,
  cumulative_expenditure = agg.cumulative,
  remaining_funds        = agg.remaining,
  pesa_gram_panchayat_count = agg.gp_count,
  pesa_village_count     = agg.village_count,
  updated_at             = now()
FROM (
  SELECT
    taf.taluka_name,
    taf.work_category,
    taf.year,
    SUM(taf.annual_approved_fund)   AS approved,
    SUM(taf.annual_received_fund)   AS received,
    SUM(taf.received_interest)      AS interest,
    SUM(taf.total_received_fund)    AS total_received,
    SUM(taf.previous_expenditure)   AS prev_exp,
    SUM(taf.current_expenditure)    AS curr_exp,
    SUM(taf.cumulative_expenditure) AS cumulative,
    SUM(taf.remaining_funds)        AS remaining,
    COUNT(DISTINCT taf.gram_panchayat) AS gp_count,
    SUM(taf.pesa_village_count)     AS village_count
  FROM pesa.taluka_aarakhada_financial taf
  WHERE taf.year IS NOT NULL
  GROUP BY taf.taluka_name, taf.work_category, taf.year
) agg
WHERE daf.taluka_name = agg.taluka_name
  AND daf.work_category = agg.work_category
  AND daf.year = agg.year;

-- Step 4: Insert missing district_aarakhada_financial rows
INSERT INTO pesa.district_aarakhada_financial (
  id, district_name, taluka_name, work_category, year,
  annual_approved_fund, annual_received_fund, received_interest,
  total_received_fund, previous_expenditure, current_expenditure,
  cumulative_expenditure, remaining_funds,
  pesa_gram_panchayat_count, pesa_village_count,
  work_type, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  COALESCE(v.district, 'Chandrapur'),
  agg.taluka_name,
  agg.work_category,
  agg.year,
  agg.approved,
  agg.received,
  agg.interest,
  agg.total_received,
  agg.prev_exp,
  agg.curr_exp,
  agg.cumulative,
  agg.remaining,
  agg.gp_count,
  agg.village_count,
  'financial',
  now(),
  now()
FROM (
  SELECT
    taf.taluka_name,
    taf.work_category,
    taf.year,
    SUM(taf.annual_approved_fund)   AS approved,
    SUM(taf.annual_received_fund)   AS received,
    SUM(taf.received_interest)      AS interest,
    SUM(taf.total_received_fund)    AS total_received,
    SUM(taf.previous_expenditure)   AS prev_exp,
    SUM(taf.current_expenditure)    AS curr_exp,
    SUM(taf.cumulative_expenditure) AS cumulative,
    SUM(taf.remaining_funds)        AS remaining,
    COUNT(DISTINCT taf.gram_panchayat) AS gp_count,
    SUM(taf.pesa_village_count)     AS village_count
  FROM pesa.taluka_aarakhada_financial taf
  WHERE taf.year IS NOT NULL
  GROUP BY taf.taluka_name, taf.work_category, taf.year
) agg
LEFT JOIN (
  SELECT DISTINCT block, district FROM pesa.villages
) v ON v.block = agg.taluka_name
WHERE NOT EXISTS (
  SELECT 1 FROM pesa.district_aarakhada_financial daf
  WHERE daf.taluka_name = agg.taluka_name
    AND daf.work_category = agg.work_category
    AND daf.year = agg.year
);
