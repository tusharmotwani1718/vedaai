import { getHealth } from '@/lib/api';

// The API holds all state in memory, so this page must never be prerendered.
export const dynamic = 'force-dynamic';

/**
 * Placeholder home page.
 *
 * It exists to prove the frontend -> backend wiring works; it will be replaced
 * by the real screens once the Figma design is available.
 */
export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">VedaAI</h1>
        <p className="text-ink-muted mt-2 text-sm">Monorepo scaffold — no feature built yet.</p>
      </div>

      <section className="border-border bg-surface-muted rounded-lg border p-4">
        <h2 className="text-sm font-medium">API status</h2>
        {health === null ? (
          <p className="mt-1 text-sm text-red-600">
            Unreachable — start the API with <code className="font-mono">bun run dev:api</code>.
          </p>
        ) : (
          <dl className="mt-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-ink-muted">status</dt>
              <dd className="font-mono">{health.status}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-muted">uptime</dt>
              <dd className="font-mono">{health.uptimeSeconds}s</dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  );
}
