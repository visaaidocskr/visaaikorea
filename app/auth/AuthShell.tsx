import Link from "next/link";

// Shared visual wrapper for the auth pages (server component).
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-14 text-slate-900">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-2xl font-extrabold text-blue-700">
          VisaAI Korea
        </Link>
        <div className="rounded-[2rem] bg-white p-8 shadow-2xl md:p-10">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 mb-8 text-slate-600">{subtitle}</p>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </main>
  );
}
