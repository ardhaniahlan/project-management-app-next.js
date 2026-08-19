"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Settings,
  Hexagon,
  LogOut,
} from "lucide-react";
import { logoutUser } from "@/features/auth/actions/authActions";
import { toast } from "sonner";
import { useState } from "react";

interface SidebarProps {
  user: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  organizationName: string | null;
}

export function Sidebar({ user, organizationName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const allRoutes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      requiresOrg: false,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: KanbanSquare,
      requiresOrg: true,
    },
    { name: "Team", href: "/team", icon: Users, requiresOrg: true },
    { name: "Settings", href: "/settings", icon: Settings, requiresOrg: false },
  ];

  const visibleRoutes = allRoutes.filter(
    (route) =>
      !route.requiresOrg || (route.requiresOrg && organizationName !== null),
  );

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingOut(true);
    try {
      await logoutUser();

      toast.success("Berhasil Keluar", {
        description: "Sampai jumpa kembali!",
      });

      setIsLoggingOut(false);

      router.replace("/login");
      router.refresh();
    } catch (err) {
      toast.error("Gagal keluar", { description: "Terjadi kesalahan." });
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 h-screen border-r border-gray-200 bg-gray-50/50 flex flex-col justify-between">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white shrink-0">
              <Hexagon size={20} className="fill-blue-500" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight truncate">
              {organizationName ? organizationName : "Akun Personal"}
            </span>
          </div>
        </div>

        <nav className="px-3 space-y-1">
          {visibleRoutes.map((route) => {
            const isActive =
              pathname === route.href || pathname.startsWith(`${route.href}/`);
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-blue-700" : "text-gray-500"}
                />
                {route.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-indigo-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {user.role}
              </span>
            </div>
          </div>
          <form onSubmit={handleLogout}>
            <button
              type="submit"
              disabled={isLoggingOut}
              title="Keluar"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
