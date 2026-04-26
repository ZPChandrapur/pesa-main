/*
  # Add year column to taluka and district aarakhada tables

  1. Modified Tables
    - `pesa.taluka_aarakhada_financial` - adds `year` text column
    - `pesa.taluka_aarakhada_physical` - adds `year` text column
    - `pesa.district_aarakhada_financial` - adds `year` text column
    - `pesa.district_aarakhada_physical` - adds `year` text column

  2. Purpose
    - Allows filtering of financial and physical progress reports by year
    - Year values are propagated from the GP-level aarakhada_financial/aarakhada_physical tables
    - Format: '2024-25', '2025-26', '2026-27', '2027-28'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'pesa' AND table_name = 'taluka_aarakhada_financial' AND column_name = 'year'
  ) THEN
    ALTER TABLE pesa.taluka_aarakhada_financial ADD COLUMN year text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'pesa' AND table_name = 'taluka_aarakhada_physical' AND column_name = 'year'
  ) THEN
    ALTER TABLE pesa.taluka_aarakhada_physical ADD COLUMN year text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'pesa' AND table_name = 'district_aarakhada_financial' AND column_name = 'year'
  ) THEN
    ALTER TABLE pesa.district_aarakhada_financial ADD COLUMN year text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'pesa' AND table_name = 'district_aarakhada_physical' AND column_name = 'year'
  ) THEN
    ALTER TABLE pesa.district_aarakhada_physical ADD COLUMN year text;
  END IF;
END $$;
