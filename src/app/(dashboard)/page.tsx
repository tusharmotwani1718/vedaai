export default function Home() {
  return (
    <main className="h-auto bg-slate-50 px-4 py-10 text-slate-900">
      <section className="mx-auto flex max-w-3xl flex-col items-start gap-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm shadow-slate-200/40">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Teacher toolkit
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">
            AI-powered assignment creation made simple.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Generate class-ready assignments, review content, and manage tasks with a minimal dashboard built for educators.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-base font-medium text-slate-900">Clean workflow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep the interface focused on what matters: assignments, groups, and notifications.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-base font-medium text-slate-900">Smart assistance</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use AI tools to quickly draft, review, and improve materials without clutter.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
