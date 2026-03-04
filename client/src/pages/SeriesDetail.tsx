import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Play, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import EpisodeModal from "@/components/EpisodeModal";

interface Episode {
  id: number;
  episodeNumber: number;
  titleAr: string;
  videoUrl: string;
  thumbnailUrl: string | null;
}

export default function SeriesDetail() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const series_id = parseInt(seriesId || "0");

  const { data: series, isLoading: seriesLoading } = trpc.series.getById.useQuery({ id: series_id });
  const { data: episodes, isLoading: episodesLoading } = trpc.series.getEpisodes.useQuery({
    seriesId: series_id,
  });
  const { data: user } = trpc.auth.me.useQuery();
  const { data: favorites } = trpc.favorites.getAll.useQuery();

  const addFavoriteMutation = trpc.favorites.add.useMutation();
  const removeFavoriteMutation = trpc.favorites.remove.useMutation();

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFavorite = favorites?.some((fav: any) => fav.seriesId === series_id);

  const handleToggleFavorite = async () => {
    if (!user) return;

    if (isFavorite) {
      await removeFavoriteMutation.mutateAsync({ seriesId: series_id });
    } else {
      await addFavoriteMutation.mutateAsync({ seriesId: series_id });
    }
  };

  const handleEpisodeClick = (episode: Episode) => {
    setSelectedEpisode(episode);
    setIsModalOpen(true);
  };

  const handleEpisodeChange = (episode: Episode) => {
    setSelectedEpisode(episode);
  };

  if (seriesLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">المسلسل غير موجود</p>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20 bg-background">
      {/* غلاف المسلسل */}
      <div className="w-full bg-gradient-to-b from-primary/20 to-background">
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-6 items-start">
            {/* صورة المسلسل */}
            <div className="w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {series.posterUrl ? (
                <img
                  src={series.posterUrl}
                  alt={series.titleAr}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground">
                    {series.titleAr.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* معلومات المسلسل */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">{series.titleAr}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {series.genre}
                </span>

              </div>

              {series.descriptionAr && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                  {series.descriptionAr}
                </p>
              )}

              {/* أزرار الإجراءات */}
              <div className="flex gap-3">
                <Button
                  onClick={handleToggleFavorite}
                  variant={isFavorite ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                  {isFavorite ? "مفضل" : "إضافة للمفضلة"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* قائمة الحلقات */}
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">الحلقات</h2>

        {episodesLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل الحلقات...</p>
          </div>
        ) : episodes && episodes.length > 0 ? (
          <div className="space-y-3">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => handleEpisodeClick(episode)}
                className="w-full group flex gap-4 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 text-left"
              >
                {/* صورة الحلقة */}
                <div className="w-24 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {episode.thumbnailUrl ? (
                    <img
                      src={episode.thumbnailUrl}
                      alt={`الحلقة ${episode.episodeNumber}`}
                      className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">
                        {episode.episodeNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* معلومات الحلقة */}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      الحلقة {episode.episodeNumber}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {episode.titleAr}
                    </p>
                  </div>

                  {/* زر التشغيل */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-primary/90 p-2 rounded-full">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">لا توجد حلقات</p>
        )}
      </div>

      {/* Modal الحلقة */}
      <EpisodeModal
        isOpen={isModalOpen}
        episode={selectedEpisode}
        series={series}
        episodes={episodes || []}
        onClose={() => setIsModalOpen(false)}
        onEpisodeChange={handleEpisodeChange}
      />
    </div>
  );
}
