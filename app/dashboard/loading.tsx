// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <main className="space-y-8 animate-pulse">
      <div className="h-8 w-64 rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-xl bg-slate-200" />
        <div className="h-28 rounded-xl bg-slate-200" />
        <div className="h-28 rounded-xl bg-slate-200" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-xl bg-slate-200 lg:col-span-2" />
        <div className="h-64 rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
