// ════════════════════════════════════════════════════════════════════════════
// Retry Logic with Exponential Backoff
// Handles transient failures and rate limiting for integration API calls
// ════════════════════════════════════════════════════════════════════════════

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

export interface RateLimitError extends Error {
  retryAfter?: number; // seconds
  status?: number;
}

/**
 * Check if an error is a rate limit error (HTTP 429)
 */
function isRateLimitError(error: unknown): error is RateLimitError {
  if (error instanceof Error) {
    const errWithStatus = error as RateLimitError;
    return errWithStatus.status === 429 ||
      error.message.toLowerCase().includes("rate limit") ||
      error.message.toLowerCase().includes("too many requests");
  }
  return false;
}

/**
 * Check if an error is retryable (transient network/server errors)
 */
function isRetryableError(error: unknown): boolean {
  if (isRateLimitError(error)) {
    return true;
  }

  if (error instanceof Error) {
    const errWithStatus = error as { status?: number };
    const status = errWithStatus.status;

    // Retry on server errors (5xx) and some client errors
    if (status !== undefined) {
      return status >= 500 || status === 408 || status === 429;
    }

    // Retry on network errors
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("socket") ||
      message.includes("fetch failed")
    );
  }

  return false;
}

/**
 * Extract Retry-After header value from error
 */
function getRetryAfterSeconds(error: unknown): number | null {
  if (isRateLimitError(error) && error.retryAfter) {
    return error.retryAfter;
  }

  // Try to extract from error message or properties
  if (error instanceof Error) {
    const match = error.message.match(/retry.?after[:\s]+(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * const result = await withRetry(
 *   () => fetchEmails({ connectedAccountId: "123", toolkit: "gmail" }),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Only retry on retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // Calculate delay
      let delay: number;

      // Respect Retry-After header for rate limits
      const retryAfterSeconds = getRetryAfterSeconds(error);
      if (retryAfterSeconds !== null) {
        delay = retryAfterSeconds * 1000;
        console.log(
          `[Retry] Rate limited, respecting Retry-After: ${retryAfterSeconds}s`
        );
      } else {
        // Exponential backoff: baseDelay * 2^attempt
        delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      }

      // Log retry attempt
      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms:`,
        error instanceof Error ? error.message : String(error)
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted
  console.error(
    `[Retry] All ${maxRetries} retries exhausted`,
    lastError instanceof Error ? lastError.message : String(lastError)
  );
  throw lastError;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a rate-limit-aware error with Retry-After
 */
export function createRateLimitError(
  message: string,
  retryAfterSeconds: number
): RateLimitError {
  const error = new Error(message) as RateLimitError;
  error.status = 429;
  error.retryAfter = retryAfterSeconds;
  return error;
}
