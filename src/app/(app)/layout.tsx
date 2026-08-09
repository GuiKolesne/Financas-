import { requireUser } from '@/lib/supabase/server';
import { signOut } from '@/app/login/actions';
import { Nav } from '@/components/nav';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Nav />

      <div className="md:pl-56">
        <header className="flex items-center justify-between gap-4 px-5 py-4">
          <span className="truncate text-sm text-slate-500 dark:text-slate-400">
            {user.email}
          </span>
          <form action={signOut}>
            <button className="text-sm text-slate-500 underline underline-offset-4 dark:text-slate-400">
              Sair
            </button>
          </form>
        </header>

        {/* pb-24 no celular para o conteúdo não ficar atrás da barra inferior */}
        <main className="px-5 pb-24 md:pb-10">{children}</main>
      </div>
    </div>
  );
}
