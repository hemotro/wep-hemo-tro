/**
 * رأس التطبيق
 * يعرض شعار hemo tro في الأعلى
 */
export default function AppHeader() {
  return (
    <header className="sticky top-0 bg-card border-b border-border z-20">
      <div className="flex items-center justify-center h-20 px-4">
        <img
          src="/logo.png"
          alt="hemo tro"
          className="h-12 w-auto object-contain"
        />
      </div>
    </header>
  );
}
