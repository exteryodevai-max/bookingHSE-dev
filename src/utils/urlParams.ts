/**
 * Utility functions for safely handling URL parameters
 * Prevents "Missing required parameters" errors when window.location properties are null/undefined
 */

/**
 * Safely creates URLSearchParams from window.location.search
 * @returns URLSearchParams instance
 */
export function getSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search || '');
}

/**
 * Safely creates URLSearchParams from window.location.hash
 * @returns URLSearchParams instance
 */
export function getHashParams(): URLSearchParams {
  const hash = window.location.hash;
  return new URLSearchParams(hash ? hash.substring(1) : '');
}

/**
 * Gets a parameter from both search and hash, with hash taking priority
 * @param key - Parameter key to search for
 * @returns Parameter value or null if not found
 */
export function getUrlParam(key: string): string | null {
  const hashParams = getHashParams();
  const searchParams = getSearchParams();
  
  return hashParams.get(key) || searchParams.get(key);
}

/**
 * Gets multiple parameters from URL (both search and hash)
 * @param keys - Array of parameter keys to search for
 * @returns Object with parameter values
 */
export function getUrlParams(keys: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  
  for (const key of keys) {
    result[key] = getUrlParam(key);
  }
  
  return result;
}

/**
 * Safely gets authentication parameters commonly used by Supabase
 * @returns Object with auth parameters
 */
export function getAuthParams() {
  return getUrlParams([
    'token_hash',
    'type',
    'access_token',
    'refresh_token',
    'error_code',
    'error_description'
  ]);
}