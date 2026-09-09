import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Users,
  FileSignature,
  ClipboardCheck,
  FileArchive,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

const MODULOS = [
  { label: "CRM", to: "/crm", icon: Users, match: "/crm" },
  { label: "Propostas", to: "/propostas", icon: FileSignature, match: "/propostas" },
  { label: "Vistorias", to: "/vistorias", icon: ClipboardCheck, match: "/vistorias" },
  { label: "Laudos", to: "/", icon: FileArchive, match: "/" },
  { label: "Configurações", to: "/configuracoes", icon: Settings, match: "/configuracoes" },
] as const;

function ativo(pathname: string, match: string) {
  if (match === "/") {
    return pathname === "/" || pathname.startsWith("/nova-vistoria") || pathname.startsWith("/revisao");
  }
  return pathname === match || pathname.startsWith(`${match}/`);
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1 p-3">
      {MODULOS.map((m) => {
        const isAtivo = ativo(pathname, m.match);
        return (
          <Link
            key={m.label}
            to={m.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              isAtivo
                ? "bg-erp-nav-active text-erp-nav-foreground"
                : "text-erp-nav-muted hover:bg-erp-nav-active/70 hover:text-erp-nav-foreground"
            }`}
          >
            <m.icon className={`h-4.5 w-4.5 ${isAtivo ? "text-erp-gold" : ""}`} />
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-erp-gold text-xs font-black text-erp-gold-foreground">
        TE
      </span>
      <div className="leading-tight">
        <p className="text-sm font-black tracking-wide text-erp-nav-foreground">TEMPLAR</p>
        <p className="text-[10px] font-semibold tracking-[0.18em] text-erp-nav-muted">ENGENHARIA</p>
      </div>
    </div>
  );
}

export function ErpShell({
  children,
  actions,
  footer,
}: {
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  const { userEmail, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const inicial = (userEmail ?? "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-erp-nav lg:flex">
        <Marca />
        <NavItems />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet open={menu} onOpenChange={setMenu}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] border-0 bg-erp-nav p-0">
                  <SheetTitle className="sr-only">Módulos</SheetTitle>
                  <Marca />
                  <NavItems onNavigate={() => setMenu(false)} />
                </SheetContent>
              </Sheet>

              <Link to="/" className="truncate text-sm font-black tracking-wide text-foreground">
                TEMPLAR ENGENHARIA
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {actions}
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-erp-nav text-xs font-bold text-erp-nav-foreground">
                  {inicial}
                </span>
                <span className="hidden max-w-[180px] truncate text-xs font-medium text-muted-foreground sm:block">
                  {userEmail}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="min-h-9">
                <LogOut className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

        {footer}
      </div>
    </div>
  );
}
