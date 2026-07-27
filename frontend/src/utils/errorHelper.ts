/**
 * Helper utility to parse Axios connection/API errors and return descriptive messages.
 */
export const getErrorMessage = (err: any): string => {
  if (err.response) {
    // The server responded with a status code other than 2xx
    return err.response.data?.message || `Server error: ${err.response.status}`;
  }
  
  if (err.request) {
    // The request was made but no response was received (e.g. backend down, timeout, CORS error, Mixed Content)
    if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
      return 'Connection timed out. Please try again.';
    }
    if (err.message?.toLowerCase().includes('network error')) {
      return 'Backend unavailable: Direct connection to the API server failed. Please verify that the backend is running and reachable.';
    }
    return 'Connection error: Unable to reach the server. Please check your internet connection or verify the backend is online.';
  }
  
  // Something happened in setting up the request
  return err.message || 'An unexpected error occurred.';
};
