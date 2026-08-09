/**
 * O `?` ao lado de um número. Nenhum valor calculado aparece na tela sem que a
 * pessoa possa descobrir de onde ele saiu.
 */
export function Explain({ children }: { children: string }) {
  return (
    <span
      tabIndex={0}
      title={children}
      aria-label={children}
      role="note"
      className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full
                 border border-slate-300 align-middle text-[10px] leading-none text-slate-500
                 dark:border-slate-600 dark:text-slate-400"
    >
      ?
    </span>
  );
}
