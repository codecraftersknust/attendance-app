/**
 * KNUST engineering programmes (dropdown options)
 */
export const PROGRAMMES = [
  'Agricultural Engineering',
  'Aerospace Engineering',
  'Biomedical Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Engineering',
  'Electrical and Electronics Engineering',
  'Geological Engineering',
  'Geomatic Engineering',
  'Materials Engineering',
  'Mechanical Engineering',
  'Metallurgical Engineering',
  'Petrochemical Engineering',
  'Petroleum Engineering',
  'Telecommunications Engineering',
] as const;

export type Programme = (typeof PROGRAMMES)[number];
