/*
  # Add year column to pesa.villages table

  1. Changes
    - `pesa.villages` table: add `year text` column (nullable, no default to preserve existing data)

  2. Notes
    - Existing rows will have year = NULL (they pre-date year-keyed logic)
    - New village entries will store the year they were added for
    - Village fund allocation (amount_per_head_st_population) is year-dependent
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'pesa' AND table_name = 'villages' AND column_name = 'year'
  ) THEN
    ALTER TABLE pesa.villages ADD COLUMN year text;
  END IF;
END $$;
