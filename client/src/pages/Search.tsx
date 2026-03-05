import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [, setLocation] = useLocation();

  const { data: allSeries = [] } = trpc.series.list.useQuery();

  // استخراج الأنواع الفريدة
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    allSeries.forEach((series: any) => {
      if (series.genre) {
        genreSet.add(series.genre);
      }
    });
    return Array.from(genreSet).sort();
  }, [allSeries]);

  // تصفية المسلسلات
  const filteredSeries = useMemo(() => {
    return allSeries.filter((series: any) => {
      const matchesSearch =
        !searchQuery ||
        series.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        series.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGenre = !selectedGenre || series.genre === selectedGenre;

      return matchesSearch && matchesGenre;
    });
  }, [allSeries, searchQuery, selectedGenre]);

  return (
    <div className="flex-1 pb-20">
      <div className="sticky top-0 bg-background z-10 p-4 space-y-3 border-b border-border">
        {/* شريط البحث */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="hfffmddd..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* تصفية حسب النوع */}
        {genres.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedGenre("")}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-sm transition-all ${
                !selectedGenre
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              الكل
            </button>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-sm transition-all ${
                  selectedGenre === genre
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* نتائج البحث */}
      <div className="px-4 py-6">
        {filteredSeries.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredSeries.map((series: any) => (
              <button
                key={series.id}
                onClick={() => setLocation(`/series/${series.id}`)}
                className="group text-right"
              >
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                  {series.posterUrl ? (
                    <img
                      src={series.posterUrl}
                      alt={series.titleAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                      <span className="text-muted-foreground text-xs">بدون صورة</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                </div>
                <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                  {series.titleAr}
                </h3>
                {series.genre && (
                  <p className="text-xs text-muted-foreground mt-1">{series.genre}</p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">لا توجد مسلسلات مطابقة</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  جرب البحث عن كلمة أخرى
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
