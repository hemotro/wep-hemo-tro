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
  const bannerUrl = bannerImage?.imageUrl || (series.titleAr === "تخاريف" ? "/takhareef-banner.jpg" : null);

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
                {/* رقم الحلقة */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-foreground text-sm">{episode.episodeNumber}</span>
                </div>

                {/* معلومات الحلقة */}
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">الحلقة {episode.episodeNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {episode.title || `الحلقة ${episode.episodeNumber}`}
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
        toast.success("تمت إزالة المسلسل من المفضلة");
      } else {
        await addFav.mutateAsync({ seriesId });
        setIsFav(true);
        toast.success("تمت إضافة المسلسل إلى المفضلة");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      className={`p-2 rounded-lg transition-all ${
        isFav
          ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
      disabled={addFav.isPending || removeFav.isPending}
    >
      <Heart className="w-6 h-6" fill={isFav ? "currentColor" : "none"} />
    </button>
  );
}

// مكون عرض التقييمات
function RatingDisplay({ seriesId }: { seriesId: number }) {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);

  const averageRating = trpc.ratings.getAverageRating.useQuery({ seriesId });
  const getUserRating = trpc.ratings.getUserRating.useQuery({ seriesId });
  const addRating = trpc.ratings.addOrUpdate.useMutation();

  useEffect(() => {
    if (getUserRating.data) {
      setUserRating(getUserRating.data.rating);
      setComment(getUserRating.data.comment || "");
    }
  }, [getUserRating.data]);

  const handleRating = async (rating: number) => {
    try {
      await addRating.mutateAsync({
        seriesId,
        rating,
        comment: comment || undefined,
      });
      setUserRating(rating);
      toast.success("تم حفظ التقييم بنجاح");
      setShowComment(false);
      getUserRating.refetch();
      averageRating.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل حفظ التقييم");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">متوسط التقييم</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${
                    star <= Math.round(averageRating.data || 0)
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {averageRating.data ? averageRating.data.toFixed(1) : "0.0"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">تقييمك</p>
        <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl transition-all hover:scale-110"
            >
              <span
                className={`${
                  star <= (hoverRating || userRating)
                    ? "text-yellow-500"
                    : "text-muted-foreground"
                }`}
              >
                ★
              </span>
            </button>
          ))}
        </div>
        {userRating > 0 && (
          <button
            onClick={() => setShowComment(!showComment)}
            className="text-xs text-primary hover:underline mb-2"
          >
            {showComment ? "إخفاء التعليق" : "إضافة تعليق"}
          </button>
        )}
        {showComment && (
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="أضف تعليقك هنا..."
            className="w-full p-2 rounded-lg bg-muted text-foreground text-sm resize-none"
            rows={3}
          />
        )}
      </div>
    </div>
  );
}
