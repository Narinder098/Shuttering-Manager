type RateLimitStore = {
  [key: string]: {
    count: number;
    lastReset: number;
  };
};

const store: RateLimitStore = {};

/**
 * Rate Limiter Function
 * @param identifier Unique key (e.g., IP address or User ID)
 * @param limit Max number of requests allowed
 * @param windowMs Time window in milliseconds (e.g., 60000 for 1 minute)
 * @returns boolean - true if allowed, false if blocked
 */
export function rateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  
  // Initialize or Reset if window passed
  if (!store[identifier] || now - store[identifier].lastReset > windowMs) {
    store[identifier] = {
      count: 0,
      lastReset: now,
    };
  }

  // Check limit
  if (store[identifier].count >= limit) {
    return false; // Blocked
  }

  // Increment
  store[identifier].count++;
  return true; // Allowed
}