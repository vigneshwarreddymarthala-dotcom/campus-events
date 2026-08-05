"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap } from "lucide-react";
import NotificationBell from "@/components/shared/NotificationBell";

type NavLink = { href: string; label: string; mobileLabel?: string };

export default function TopNav({ links }: { links: NavLink[] }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const profilePath = user?.role === "admin" ? "/admin/profile" : "/student/profile";

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "??";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 sm:h-16 gap-2 sm:gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm hidden sm:block">CampusEvents</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href + "/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="sm:hidden">{link.mobileLabel ?? link.label}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Notification bell — students only */}
        {user?.role === "student" && <NotificationBell />}

        {/* Avatar — links to profile page */}
        <Link
          href={profilePath}
          className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[130px] truncate">
            {user?.name}
          </span>
        </Link>
      </div>
    </header>
  );
}
