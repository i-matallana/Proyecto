"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Upload,
  FileCheck,
  FileWarning,
  LayoutDashboard,
} from "lucide-react";

const navigation = [
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
    description: "Gestionar clientes e incapacidades",
  },
  {
    name: "Subir Documentos",
    href: "/subir",
    icon: Upload,
    description: "Cargar y analizar documentos",
  },
  {
    name: "Resultados",
    href: "/resultados",
    icon: FileCheck,
    description: "Ver analisis de documentos",
  },
  {
    name: "Detalles",
    href: "/detalles",
    icon: FileWarning,
    description: "Revisar y corregir documentos",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <LayoutDashboard className="text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">
              Incapacidades
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Sistema de Gestion
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="flex flex-col gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "shrink-0",
                      isActive ? "text-sidebar-primary" : ""
                    )} />
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      <span className="text-xs font-normal opacity-60">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent/30 p-3">
            <p className="text-xs text-sidebar-foreground/60">
              Version 1.0.0
            </p>
            <p className="text-xs text-sidebar-foreground/40 mt-1">
              Analisis con IA
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
