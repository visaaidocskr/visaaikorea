import Link from "next/link";
import { TravelAuthScene } from "@/app/auth/TravelAuthScene";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-8 text-slate-900 sm:px-6 sm:py-14">
      <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-100/60 blur-3xl" />
      <div className="relative grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <TravelAuthScene />

        <div className="w-full max-w-md justify-self-center">
          <Link href="/" className="mb-7 block text-center text-2xl font-extrabold tracking-tight text-blue-700">
            VisaAI Korea
          </Link>
          <div className="rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-2xl shadow-slate-300/60 backdrop-blur md:p-10">
            <h1 className="text-3xl font-extrabold">{title}</h1>
            <p className="mt-2 mb-8 text-slate-600">{subtitle}</p>
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
