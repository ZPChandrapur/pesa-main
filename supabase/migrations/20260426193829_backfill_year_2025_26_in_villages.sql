/*
  # Backfill year = '2025-26' in pesa.villages where year is NULL

  1. Changes
    - Updates all rows in pesa.villages where year IS NULL to '2025-26'
    - This represents existing village fund allocation data which belongs to the 2025-26 financial year

  2. Notes
    - Only rows with year = NULL are updated (safe, idempotent)
    - New villages added through the form will have year set at creation time
*/

UPDATE pesa.villages
SET year = '2025-26'
WHERE year IS NULL;
