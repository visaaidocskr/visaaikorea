import { signOut } from "@/app/auth/actions";

// Server-action form button — no client JS needed.
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Sign out
      </button>
    </form>
  );
}
