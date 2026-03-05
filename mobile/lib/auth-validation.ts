/**
 * Shared auth validation for KNUST Absense app.
 * - Students: email *@st.knust.edu.gh, student ID 8 digits
 * - Lecturers: email *@knust.edu.gh
 * - Password: min 8 chars, at least one letter and one number
 */

export const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@st\.knust\.edu\.gh$/;
export const LECTURER_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@knust\.edu\.gh$/;
export const STUDENT_ID_REGEX = /^\d{8}$/;

/** Valid KNUST student email (e.g. jdadoo@st.knust.edu.gh) */
export function isValidStudentEmail(email: string): boolean {
  return STUDENT_EMAIL_REGEX.test(email.trim());
}

/** Valid KNUST lecturer email (e.g. lecturer@knust.edu.gh) */
export function isValidLecturerEmail(email: string): boolean {
  return LECTURER_EMAIL_REGEX.test(email.trim());
}

/** Valid student ID: exactly 8 digits */
export function isValidStudentId(id: string): boolean {
  return STUDENT_ID_REGEX.test(id.trim());
}

/** Secure password: min 8 chars, at least one letter and one number */
export function isSecurePassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
}

export function getStudentEmailError(email: string): string | null {
  const t = email.trim();
  if (!t) return 'Email is required';
  if (!isValidStudentEmail(email)) return 'Use your KNUST student email (e.g. jdadoo@st.knust.edu.gh)';
  return null;
}

export function getLecturerEmailError(email: string): string | null {
  const t = email.trim();
  if (!t) return 'Email is required';
  if (!isValidLecturerEmail(email)) return 'Use your KNUST lecturer email (e.g. lecturer@knust.edu.gh)';
  return null;
}

export function getStudentIdError(id: string): string | null {
  const t = id.trim();
  if (!t) return 'Student ID is required';
  if (!isValidStudentId(id)) return 'Student ID must be exactly 8 digits';
  return null;
}

/** Valid lecturer/staff ID: exactly 8 digits */
export function isValidLecturerId(id: string): boolean {
  return STUDENT_ID_REGEX.test(id.trim());
}

export function getLecturerIdError(id: string): string | null {
  const t = id.trim();
  if (!t) return 'Lecturer ID is required';
  if (!isValidLecturerId(id)) return 'Lecturer ID must be exactly 8 digits';
  return null;
}

export function getPasswordError(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  return null;
}

/** For login: accept student email, lecturer email, student ID, or lecturer ID (8 digits) */
export function getLoginIdentifierError(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Email or ID is required';
  if (isValidStudentId(t)) return null;
  if (isValidLecturerId(t)) return null;
  if (isValidStudentEmail(t)) return null;
  if (isValidLecturerEmail(t)) return null;
  return 'Enter a valid KNUST email (e.g. jdadoo@st.knust.edu.gh) or 8-digit ID';
}
