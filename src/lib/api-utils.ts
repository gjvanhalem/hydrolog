/**
 * Utility functions for API requests with built-in retry and rate limit handling
 */

/**
 * Performs a fetch request with automatic retries for rate limit errors
 * 
 * @param url The URL to fetch
 * @param options Fetch options
 * @param maxRetries Maximum number of retries (default: 3)
 * @param initialDelay Initial delay in ms before retrying (default: 1000)
 * @returns Promise with the fetch response
 */
export async function fetchWithRetry(
  url: string, 
  options?: RequestInit,
  maxRetries = 3,
  initialDelay = 1000
): Promise<Response> {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      const response = await fetch(url, options);
      
      // If we hit a rate limit and have retries left, wait and try again
      if (response.status === 429 && retries < maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
        
        console.warn(`Rate limit hit, retrying after ${waitTime}ms (retry ${retries + 1}/${maxRetries})`);
        
        // Wait for the specified time
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Increment retry counter and delay (exponential backoff)
        retries++;
        delay *= 2;
        
        continue;
      }
      
      return response;
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      console.warn(`Request failed, retrying (${retries + 1}/${maxRetries})`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increment retry counter and delay (exponential backoff)
      retries++;
      delay *= 2;
    }
  }
}
