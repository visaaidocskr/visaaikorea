import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/app/dashboard/SignOutButton";

const NAV = [
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/invitations", label: "Invitations" },
  { href: "/admin/service-requests", label: "Travel requests" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/email-logs", label: "Email logs" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guards every /admin/* route in one place.
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-lg font-extrabold text-blue-700">
            VisaAI · Admin
          </Link>
          <div className="flex gap-4 text-sm font-semibold text-slate-600">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-blue-700">
                {n.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
            Client view
          </Link>
          <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
