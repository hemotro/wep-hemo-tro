import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

/**
 * صفحة البحث
 * تحتوي على شريط بحث وقائمة فارغة جاهزة للمسلسلات
 */
export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex-1 pb-20">
      <div className="sticky top-0 bg-background z-10 p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="ابحث عن مسلسل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">لا توجد مسلسلات حالياً</p>
            <p className="text-sm text-muted-foreground">سيتم إضافة المسلسلات قريباً</p>
          </div>
        </div>
      </div>
    </div>
  );
}
