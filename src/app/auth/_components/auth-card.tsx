export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="panel w-full max-w-sm">
      <div className="px-6 pt-6">
        <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-6">{children}</div>
      <div className="border-t px-6 py-4 text-sm text-muted-foreground">
        {footer}
      </div>
    </div>
  );
}
