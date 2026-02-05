import { Home, Radio, Search, User, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * شريط التنقل السفلي
 * يحتوي على أربعة أيقونات للتنقل بين الأقسام الأربعة
 */
export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/live", label: "مباشر", icon: Radio },
    { href: "/search", label: "بحث", icon: Search },
    ...(user?.role === "admin" ? [{ href: "/admin", label: "الإدارة", icon: Settings }] : []),
    { href: "/account", label: "حسابي", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around items-center h-20">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href}>
              <a
                className={`flex flex-col items-center justify-center w-16 h-20 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={label}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
