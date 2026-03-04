/**
 * رأس التطبيق
 * يعرض شعار hemo tro في الأعلى مع خلفية شفافة بالكامل
 */
import { useState, useEffect } from "react";

export default function AppHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 transition-all duration-300 ${
        isScrolled
          ? "bg-background/50 backdrop-blur-md border-b border-border/30"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex items-center justify-end h-16 px-6">
        <img
          src="/logo.png"
          alt="hemo tro"
          className="h-10 w-auto object-contain"
        />
      </div>
    </header>
  );
}
