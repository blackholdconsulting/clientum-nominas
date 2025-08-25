"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { name: string; href: string; activeOn: string[] };

const nav: NavItem[] = [
  { name: "Dashboard",     href: "/dashboard",    activeOn: ["/dashboard"] },
  { name: "Empleados",     href: "/employees",    activeOn: ["/employees"] },
  // ⬇️ Corregido: Nóminas → /payroll, pero se marca activo también en /payrolls
  { name: "Nóminas",       href: "/payroll",      activeOn: ["/payroll", "/payrolls"] },
  { name: "Plantillas",    href: "/contracts",    activeOn: ["/contracts"] },
  { name: "Departamentos", href: "/departments",  activeOn: ["/departments"] },
  { name: "Documentos",    href: "/documents",    activeOn: ["/documents"] },
  { name: "Ajustes",       href: "/settings",     activeOn: ["/settings"] },
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
            const active = item.activeOn.some(
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
