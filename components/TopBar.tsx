"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { name: string; href: string; activeOn?: string[] };

const nav: NavItem[] = [
  { name: "Dashboard",     href: "/dashboard" },
  { name: "Empleados",     href: "/employees" },
  // ✅ Nóminas debe abrir /contracts
  { name: "Nóminas",       href: "/contracts",  activeOn: ["/contracts", "/nominas", "/payroll", "/payrolls"] },
  // Plantillas la dejamos en /plantillas (ajusto activeOn por si usas subrutas)
  { name: "Plantillas",    href: "/plantillas", activeOn: ["/plantillas"] },
  { name: "Departamentos", href: "/departments" },
  { name: "Documentos",    href: "/documents" },
  { name: "Ajustes",       href: "/settings" },
];

export default function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-clientum-blue text-white border-b border-clientum-blueDark/30 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo-clientum.png" alt="Clientum" width={28} height={28} priority />
            <span className="font-semibold tracking-tight">Clientum</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {nav.map((item) => {
            const actives = item.activeOn ?? [item.href];
            const active = actives.some(
              (p) => pathname === p || pathname.startsWith(p + "/")
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white text-clientum-blue"
                    : "text-white/90 hover:bg-clientum-blueDark/40",
                ].join(" ")}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
