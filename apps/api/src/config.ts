/**
 * Runtime configuration, read once at startup from the environment.
 *
 * Bun loads `.env` automatically, so no dotenv dependency is needed.
 */

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: readPort(process.env.API_PORT, 4000),

  /** Origin allowed to call this API from the browser (the Next.js app). */
  corsOrigin: process.env.API_CORS_ORIGIN ?? 'http://localhost:3000',

  isProduction: process.env.NODE_ENV === 'production',
} as const;
