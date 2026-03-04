import { useState } from "react";
import { Heart } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

function FavoriteButton({ seriesId }: { seriesId: number }) {
  const { data: isFav } = trpc.favorites.isFavorite.useQuery({ seriesId });
  const addFav = trpc.favorites.add.useMutation();
  const removeFav = trpc.favorites.remove.useMutation();

  const handleToggle = async () => {
    try {
      if (isFav) {
        await removeFav.mutateAsync({ seriesId });
      } else {
        await addFav.mutateAsync({ seriesId });
      }
    } catch (error) {
      console.error("خطأ في تحديث المفضلة:", error);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-full transition-colors ${
        isFav ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-red-500 hover:text-white"
      }`}
    >
      <Heart size={24} fill={isFav ? "currentColor" : "none"} />
    </button>
  );
}

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const seriesId = parseInt(id || "0");

  const { data: series, isLoading: seriesLoading } = trpc.series.getById.useQuery({ id: seriesId });
  const { data: episodes, isLoading: episodesLoading } = trpc.series.getEpisodes.useQuery({ seriesId });
  const { data: images = [] } = trpc.seriesImages.getAll.useQuery({ seriesId });

  if (seriesLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">المسلسل غير موجود</p>
      </div>
    );
  }

  // الحصول على صورة البانر من قاعدة البيانات
  const bannerImage = images.find(img => img.imageType === "banner" && img.isDefault);
  const bannerUrl = bannerImage?.imageUrl || series.posterUrl;

  return (
    <div className="flex-1 pb-20">
      {/* البانر */}
      {bannerUrl && (
        <div className="relative w-full bg-black">
          <img
            src={bannerUrl}
            alt={series.titleAr}
            className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover"
          />
          {/* تدرج لوني */}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        </div>
      )}

      {/* معلومات المسلسل */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">{series.titleAr}</h1>
            <p className="text-primary text-sm mb-2">{series.genre}</p>
          </div>
          <FavoriteButton seriesId={seriesId} />
        </div>
        
        {/* الوصف */}
        {series.descriptionAr && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{series.descriptionAr}</p>
          </div>
        )}
      </div>

      {/* قائمة الحلقات بشبكة احترافية */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-4">الحلقات</h2>
        {episodesLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جاري تحميل الحلقات...</p>
          </div>
        ) : episodes && episodes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => setLocation(`/episode/${seriesId}/${episode.episodeNumber}`)}
                className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105 active:scale-95"
              >
                {/* صورة الحلقة الكبيرة */}
                <div className="relative w-full aspect-video bg-muted overflow-hidden rounded-lg">
                  {episode.thumbnailUrl ? (
                    <img
                      src={episode.thumbnailUrl}
                      alt={`الحلقة ${episode.episodeNumber}`}
                      className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-3xl font-bold text-muted-foreground">
                        {episode.episodeNumber}
                      </span>
                    </div>
                  )}
                  
                  {/* overlay عند التمرير */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-primary/90 p-3 rounded-full">
                      <svg
                        className="w-6 h-6 text-white fill-white"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* معلومات الحلقة */}
                <div className="mt-2">
                  <p className="font-semibold text-foreground text-sm">الحلقة {episode.episodeNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">{episode.titleAr}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">لا توجد حلقات</p>
        )}
      </div>
    </div>
  );
}
