import { Brand } from "@/components/reusables/brand";

/** Shared shell for /login and /register: brand bar + centred card. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Brand />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        {children}
      </main>
    </div>
  );
}
