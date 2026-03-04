import { useState } from "react";
import { Heart } from "lucide-react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import VideoPlayer from "@/components/VideoPlayer";

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
  const seriesId = parseInt(id || "0");
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

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

  const currentEpisode = episodes?.find(ep => ep.episodeNumber === selectedEpisode);
  
  // الحصول على صورة البانر من قاعدة البيانات
  const bannerImage = images.find(img => img.imageType === "banner" && img.isDefault);
  const bannerUrl = bannerImage?.imageUrl || series.posterUrl;

  // تحديث مشغل الفيديو بناءً على نوع الفيديو
  const renderVideoPlayer = (episode: any) => {
    if (!episode.videoUrl) return null;
    
    // إذا كان رابط YouTube
    if (episode.videoUrl.includes("youtube.com") || episode.videoUrl.includes("youtu.be")) {
      const videoId = episode.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([^&\n?#]+)/)?.[ 1];
      if (videoId) {
        return (
          <div className="w-full aspect-video bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={`${series.titleAr} - الحلقة ${episode.episodeNumber}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        );
      }
    }
    
    // باقي الروابط (MP4, M3U8, إلخ.)
    return (
      <VideoPlayer
        src={episode.videoUrl}
        title={`${series.titleAr} - الحلقة ${episode.episodeNumber}`}
        poster={episode.thumbnailUrl}
      />
    );
  };

  return (
    <div className="flex-1 pb-20">
      {/* البانر - تصميم بسيط وسهل */}
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

      {/* مشغل الفيديو الحالي */}
      {currentEpisode && (
        <div className="w-full bg-black">
          {renderVideoPlayer(currentEpisode)}
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
        {currentEpisode && (
          <div>
            <p className="text-foreground font-semibold">الحلقة {currentEpisode.episodeNumber}</p>
            <p className="text-muted-foreground text-sm">من {series.totalEpisodes} حلقة</p>
          </div>
        )}
        
        {/* الوصف */}
        {series.descriptionAr && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{series.descriptionAr}</p>
          </div>
        )}
      </div>

      {/* قائمة الحلقات */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-4">الحلقات</h2>
        {episodesLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جاري تحميل الحلقات...</p>
          </div>
        ) : episodes && episodes.length > 0 ? (
          <div className="space-y-3">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => setSelectedEpisode(episode.episodeNumber)}
                className={`w-full p-3 rounded-lg border transition-all text-left flex items-center gap-3 ${
                  selectedEpisode === episode.episodeNumber
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* صورة مصغرة للحلقة */}
                {episode.thumbnailUrl ? (
                  <img
                    src={episode.thumbnailUrl}
                    alt={`الحلقة ${episode.episodeNumber}`}
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {episode.episodeNumber}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">الحلقة {episode.episodeNumber}</p>
                  <p className="text-sm text-muted-foreground truncate">{episode.titleAr}</p>
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
