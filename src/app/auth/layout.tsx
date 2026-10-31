import { Brand } from "@/components/reusables/brand";

/** Shared shell for log in and register: wordmark above one centred panel. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-12 sm:justify-center sm:pb-24">
      <Brand className="mb-8 text-[26px]" />
      {children}
    </main>
  );
}
