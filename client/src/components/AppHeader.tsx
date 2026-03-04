/**
 * رأس التطبيق
 * شعار يعود للرئيسية + navbar احترافي للكمبيوتر
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Bell, User } from "lucide-react";

export default function AppHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [, navigate] = useLocation();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogoClick = () => {
    navigate("/");
  };

  // للهاتف: شريط بسيط
  if (!isDesktop) {
    return (
      <header
        className={`sticky top-0 z-20 transition-all duration-300 ${
          isScrolled
            ? "bg-background/50 backdrop-blur-md border-b border-border/30"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={handleLogoClick}
            className="hover:opacity-80 transition-opacity"
            title="العودة للرئيسية"
          >
            <img
              src="/logo.png"
              alt="hemo tro"
              className="h-10 w-auto object-contain"
            />
          </button>
        </div>
      </header>
    );
  }

  // للكمبيوتر: navbar احترافي
  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/30 shadow-lg"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* الشعار */}
        <button
          onClick={handleLogoClick}
          className="hover:opacity-80 transition-opacity flex-shrink-0"
          title="العودة للرئيسية"
        >
          <img
            src="/logo.png"
            alt="hemo tro"
            className="h-12 w-auto object-contain"
          />
        </button>

        {/* القائمة الوسطية */}
        <nav className="flex items-center gap-8 flex-1 justify-center">
          <a
            href="/"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            الرئيسية
          </a>
          <a
            href="/live"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            البث المباشر
          </a>
          <a
            href="/search"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            البحث
          </a>
        </nav>

        {/* الأيقونات اليمنى */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => navigate("/search")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="بحث"
          >
            <Search className="w-5 h-5 text-foreground/80" />
          </button>
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors relative"
            title="إشعارات"
          >
            <Bell className="w-5 h-5 text-foreground/80" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          <button
            onClick={() => navigate("/account")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="الحساب"
          >
            <User className="w-5 h-5 text-foreground/80" />
          </button>
        </div>
      </div>
    </header>
  );
}
