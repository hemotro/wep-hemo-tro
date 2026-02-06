import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Play, Heart } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";

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

  // استخراج معرف الفيديو من رابط يوتيوب
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
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
        <div className="w-full aspect-video bg-black">
          <iframe
            width="100%"
            height="100%"
            src={getYoutubeEmbedUrl(currentEpisode.videoUrl)}
            title={`${series.titleAr} - الحلقة ${currentEpisode.episodeNumber}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
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
        <RatingDisplay seriesId={seriesId} />
        
        {/* الوصف */}
        {series.descriptionAr && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{series.descriptionAr}</p>
          </div>
        )}
      </div>

      {/* قائمة الحلقات */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">الحلقات</h2>

        <div className="space-y-2">
          {episodes && episodes.length > 0 ? (
            episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => setSelectedEpisode(episode.episodeNumber)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-right flex items-center gap-3 ${
                  selectedEpisode === episode.episodeNumber
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/50 hover:border-primary/50"
                }`}
              >
                {/* صورة مصغرة للحلقة */}
                <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center">
                  {episode.thumbnailUrl ? (
                    <img 
                      src={episode.thumbnailUrl} 
                      alt={`الحلقة ${episode.episodeNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-foreground text-sm">{episode.episodeNumber}</span>
                  )}
                </div>

                {/* معلومات الحلقة */}
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">الحلقة {episode.episodeNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {episode.titleAr || `الحلقة ${episode.episodeNumber}`}
                  </p>
                </div>

                {/* أيقونة التشغيل */}
                {selectedEpisode === episode.episodeNumber && (
                  <Play className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" />
                )}
              </button>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد حلقات متاحة</p>
          )}
        </div>
      </div>
    </div>
  );
}

// مكون زر المفضلة
function FavoriteButton({ seriesId }: { seriesId: number }) {
  const [isFav, setIsFav] = useState(false);
  const checkFav = trpc.favorites.isFavorite.useQuery({ seriesId });
  const addFav = trpc.favorites.add.useMutation();
  const removeFav = trpc.favorites.remove.useMutation();

  useEffect(() => {
    if (checkFav.data !== undefined) {
      setIsFav(checkFav.data);
    }
  }, [checkFav.data]);

  const handleToggleFavorite = async () => {
    try {
      if (isFav) {
        await removeFav.mutateAsync({ seriesId });
        setIsFav(false);
        toast.success("تم إزالة من المفضلة");
      } else {
        await addFav.mutateAsync({ seriesId });
        setIsFav(true);
        toast.success("تم إضافة إلى المفضلة");
      }
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      className="p-2 rounded-full hover:bg-primary/20 transition-colors"
    >
      <Heart
        className="w-6 h-6"
        fill={isFav ? "currentColor" : "none"}
        color={isFav ? "#ef4444" : "currentColor"}
      />
    </button>
  );
}

// مكون عرض التقييمات
function RatingDisplay({ seriesId }: { seriesId: number }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: userRating } = trpc.ratings.getUserRating.useQuery({ seriesId });
  const { data: avgRating } = trpc.ratings.getAverageRating.useQuery({ seriesId });
  const addRatingMutation = trpc.ratings.addOrUpdate.useMutation();

  useEffect(() => {
    if (userRating) {
      setRating(userRating.rating);
      setComment(userRating.comment || "");
    }
  }, [userRating]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("اختر تقييماً");
      return;
    }

    try {
      await addRatingMutation.mutateAsync({
        seriesId,
        rating,
        comment: comment || undefined,
      });
      toast.success("تم حفظ التقييم");
      setShowForm(false);
    } catch (error) {
      toast.error("فشل حفظ التقييم");
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">التقييم</span>
        <span className="text-sm text-primary">
          {avgRating ? avgRating.toFixed(1) : "0"} ⭐
        </span>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-primary hover:underline"
        >
          {rating > 0 ? `تقييمك: ${rating} ⭐` : "أضف تقييماً"}
        </button>
      ) : (
        <div className="space-y-2 p-3 bg-background/50 rounded-lg">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl transition-transform hover:scale-110"
              >
                {star <= (hoverRating || rating) ? "⭐" : "☆"}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="أضف تعليقاً (اختياري)"
            rows={2}
            className="w-full p-2 text-xs rounded bg-background border border-border text-foreground"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitRating}
              className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              حفظ
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-2 py-1 text-xs bg-background border border-border rounded hover:bg-background/80"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
