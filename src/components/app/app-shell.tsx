import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Profile } from "@/lib/supabase/types";
import { AccountSummary } from "./account-summary";
import { AppMobileMenu } from "./app-mobile-menu";
import { AppNav } from "./app-nav";

/**
 * Authenticated frame: fixed sidebar on large screens, top bar with a popover
 * menu on small ones.
 */
export function AppShell({
  profile,
  email,
  children,
}: {
  profile: Profile;
  email: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[17rem_1fr]">
      <aside className="hidden flex-col gap-8 border-e border-line bg-surface p-5 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="flex items-center justify-between">
          <Logo href="/app" />
          <ThemeToggle />
        </div>
        <div className="flex-1">
          <AppNav />
        </div>
        <AccountSummary profile={profile} email={email} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-background/85 px-5 backdrop-blur-xl lg:hidden">
          <Logo href="/app" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <AppMobileMenu>
              <AccountSummary profile={profile} email={email} />
            </AppMobileMenu>
          </div>
        </header>

        <main
          id="conteudo"
          className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 lg:py-12"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
