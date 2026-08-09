export default function Loading() {
  return (
    <div className="space-y-3 py-10" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
