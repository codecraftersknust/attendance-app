/**
 * Extract a user-friendly error message from various error formats.
 * Handles API errors (detail as string or array), Error objects, and unknown types.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong';

  // ApiError from our interceptor
  const apiErr = error as { message?: string; errors?: Record<string, string[]> };
  if (typeof apiErr.message === 'string' && apiErr.message) {
    return apiErr.message;
  }

  // Axios-style error with response.data
  const axiosErr = error as { response?: { data?: { detail?: string | Array<{ msg?: string; loc?: string[] }> } }; message?: string };
  const detail = axiosErr.response?.data?.detail;
  if (typeof detail === 'string' && detail) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    return typeof first === 'object' && first?.msg ? first.msg : String(detail[0]);
  }

  // Standard Error
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Something went wrong';
}
