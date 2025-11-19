'use client';

import { useEffect } from 'react';

/**
 * Global error suppressor for benign Livepeer/Next.js errors
 * Intercepts console.error to filter out empty objects and timeout errors
 */
export function ErrorSuppressor() {
  useEffect(() => {
    // Store the original console.error
    const originalError = console.error;

    // Override console.error
    console.error = (...args: any[]) => {
      // Check if any argument is an empty object or benign error
      const shouldSuppress = args.some((arg) => {
        // Empty object check
        if (typeof arg === 'object' && arg !== null) {
          const keys = Object.keys(arg);
          if (keys.length === 0) {
            return true; // Suppress empty objects
          }
        }

        // String check for timeout errors
        if (typeof arg === 'string') {
          const lowerArg = arg.toLowerCase();
          if (
            lowerArg.includes('timeout') ||
            lowerArg.includes('canplay') ||
            lowerArg === '{}'
          ) {
            return true;
          }
        }

        return false;
      });

      // Only call original error if we shouldn't suppress
      if (!shouldSuppress) {
        originalError(...args);
      }
    };

    // Cleanup: restore original console.error
    return () => {
      console.error = originalError;
    };
  }, []);

  return null; // This component doesn't render anything
}

