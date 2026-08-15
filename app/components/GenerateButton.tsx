import Link from "next/link";

// The primary conversion action across the whole site.
export function GenerateButton({
  size = "md",
  full = false,
  label = "Generate Documents",
  href = "/apply",
}: {
  size?: "md" | "lg";
  full?: boolean;
  label?: string;
  href?: string;
}) {
  const sizing = size === "lg" ? "px-8 py-4 text-lg" : "px-6 py-3 text-base";
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${sizing} ${
        full ? "w-full" : ""
      }`}
    >
      {label}
      <span className="transition-transform duration-200 group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
