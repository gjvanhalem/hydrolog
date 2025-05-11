'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log error to our logging system
    logger.error('Client-side error caught by error boundary', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              Something went wrong!
            </h2>
            <p className="mb-4 text-gray-600">
              We apologize for the inconvenience. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
