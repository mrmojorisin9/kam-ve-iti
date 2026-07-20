import Link from "next/link";

export type DateNavKey = "danas" | "sutra" | "vikend" | "tjedan";

const ITEMS: { key: DateNavKey; label: string; href: string }[] = [
  { key: "tjedan", label: "Tjedan", href: "/" },
  { key: "danas", label: "Danas", href: "/danas" },
  { key: "sutra", label: "Sutra", href: "/sutra" },
  { key: "vikend", label: "Vikend", href: "/vikend" },
];

export function DateNav({ active }: { active: DateNavKey }) {
  return (
    <nav className="border-line mb-8 flex gap-1 border-b">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={
            item.key === active
              ? "border-gold text-parchment -mb-px border-b-2 px-3 pb-3 text-sm font-medium"
              : "text-parchment-muted hover:text-parchment -mb-px border-b-2 border-transparent px-3 pb-3 text-sm"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}