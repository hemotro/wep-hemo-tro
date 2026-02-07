/**
 * رأس التطبيق
 * يعرض شعار hemo tro في الأعلى مع خلفية شفافة
 */
export default function AppHeader() {
  return (
    <header className="sticky top-0 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-sm border-b border-border/50 z-20">
      <div className="flex items-center justify-end h-20 px-6">
        <img
          src="/logo.png"
          alt="hemo tro"
          className="h-12 w-auto object-contain"
        />
      </div>
    </header>
  );
}
