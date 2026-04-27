
/*
  # Make work_name nullable in GP-level aarakhada tables

  The sync procedure inserts aggregated rows (one per village × work_category × year)
  rather than individual work rows. The work_name column doesn't apply to aggregated rows
  and must be nullable to support this pattern.

  ## Tables Modified
  - `pesa.aarakhada_physical` — work_name made nullable
  - `pesa.aarakhada_financial` — work_name made nullable
*/

ALTER TABLE pesa.aarakhada_physical ALTER COLUMN work_name DROP NOT NULL;
ALTER TABLE pesa.aarakhada_financial ALTER COLUMN work_name DROP NOT NULL;
