/*
  # Add 5 exceptional villages without Gram Panchayat

  1. Changes
    - Add 5 villages (Jiwati and Korpana talukas) with NULL/blank gram_panchayat
    - These are exceptional villages that don't have a gram panchayat

  2. Villages to be added:
    1. Jiwati Taluka, Chandrapur District, Jiwati Gaon
    2. Jiwati Taluka, Chandrapur District, Sarangpur Gaon
    3. Korpana Taluka, Chandrapur District, Korpana Gaon
    4. Korpana Taluka, Chandrapur District, Gadchandur Gaon
    5. Korpana Taluka, Chandrapur District, Devghat Gaon
*/

INSERT INTO pesa.villages (
  village_name,
  district,
  block,
  gram_panchayat,
  gram_panchayat_population,
  gram_panchayat_st_population,
  village_population,
  village_st_population,
  amount_per_head_st_population,
  is_pesa,
  year
) VALUES
  (
    'Jiwati Gaon',
    'Chandrapur',
    'Jiwati',
    NULL,
    0,
    0,
    0,
    0,
    0,
    false,
    '2025-26'
  ),
  (
    'Sarangpur Gaon',
    'Chandrapur',
    'Jiwati',
    NULL,
    0,
    0,
    0,
    0,
    0,
    false,
    '2025-26'
  ),
  (
    'Korpana Gaon',
    'Chandrapur',
    'Korpana',
    NULL,
    0,
    0,
    0,
    0,
    0,
    false,
    '2025-26'
  ),
  (
    'Gadchandur Gaon',
    'Chandrapur',
    'Korpana',
    NULL,
    0,
    0,
    0,
    0,
    0,
    false,
    '2025-26'
  ),
  (
    'Devghat Gaon',
    'Chandrapur',
    'Korpana',
    NULL,
    0,
    0,
    0,
    0,
    0,
    false,
    '2025-26'
  )
ON CONFLICT DO NOTHING;
