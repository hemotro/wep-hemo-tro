import { useState } from "react";
import { Heart, LogIn } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

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

// مكون Auth Wall - رسالة تطلب تسجيل الدخول
function AuthWall({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-purple-500/30 p-8 text-center">
        {/* الأيقونة */}
        <div className="mb-6 flex justify-center">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-full p-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* العنوان */}
        <h2 className="text-2xl font-bold text-white mb-3">
          🔐 محتوى حصري
        </h2>

        {/* الوصف */}
        <p className="text-gray-300 mb-2">
          يرجى تسجيل الدخول للاستمتاع بمشاهدة هذا المسلسل
        </p>
        <p className="text-gray-400 text-sm mb-6">
          انضم إلى ملايين المستخدمين الذين يستمتعون بأفضل المسلسلات والأفلام
        </p>

        {/* الأزرار */}
        <div className="space-y-3">
          <Button
            onClick={onLoginClick}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg"
          >
            تسجيل الدخول
          </Button>
          <p className="text-xs text-gray-400">
            إنشاء حساب مجاني في ثوان معدودة
          </p>
        </div>

        {/* الميزات */}
        <div className="mt-8 space-y-2 text-left">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <span className="text-purple-400">✓</span>
            <span>مشاهدة غير محدودة</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <span className="text-purple-400">✓</span>
            <span>جودة عالية الدقة</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <span className="text-purple-400">✓</span>
            <span>بدون إعلانات</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const seriesId = parseInt(id || "0");
  const [showAuthWall, setShowAuthWall] = useState(false);

  // التحقق من تسجيل الدخول
  const { data: user } = trpc.auth.me.useQuery();

  const { data: series, isLoading: seriesLoading } = trpc.series.getById.useQuery({ id: seriesId });
  const { data: episodes, isLoading: episodesLoading } = trpc.series.getEpisodes.useQuery({ seriesId });
  const { data: images = [] } = trpc.seriesImages.getAll.useQuery({ seriesId });

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

  // الحصول على صورة البانر من قاعدة البيانات
  const bannerImage = images.find(img => img.imageType === "banner" && img.isDefault);
  const bannerUrl = bannerImage?.imageUrl || series.posterUrl;

  const handleEpisodeClick = () => {
    if (!user) {
      setShowAuthWall(true);
    }
  };

  return (
    <div className="flex-1 pb-20 bg-background">
      {/* Auth Wall */}
      {showAuthWall && (
        <AuthWall
          onLoginClick={() => {
            setShowAuthWall(false);
            setLocation("/login");
          }}
        />
      )}

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
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="py-8 border-b border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{series.titleAr}</h1>
              <p className="text-primary text-sm mb-4">{series.genre}</p>
            </div>
            {user && <FavoriteButton seriesId={seriesId} />}
          </div>
          
          {/* الوصف */}
          {series.descriptionAr && (
            <p className="text-sm text-muted-foreground leading-relaxed">{series.descriptionAr}</p>
          )}

          {/* تنبيه تسجيل الدخول */}
          {!user && (
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300 flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                <span>يرجى تسجيل الدخول لمشاهدة الحلقات</span>
              </p>
            </div>
          )}
        </div>

        {/* قائمة الحلقات */}
        <div className="py-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">الحلقات</h2>
          
          {episodesLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري تحميل الحلقات...</p>
            </div>
          ) : episodes && episodes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {episodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => {
                    if (!user) {
                      handleEpisodeClick();
                    } else {
                      setLocation(`/episode/${seriesId}/${episode.episodeNumber}`);
                      window.scrollTo(0, 0);
                    }
                  }}
                  className={`group relative overflow-hidden rounded-lg transition-all duration-300 ${
                    user
                      ? "hover:ring-2 hover:ring-primary/50 active:scale-95"
                      : "cursor-not-allowed opacity-75"
                  }`}
                >
                  {/* صورة الحلقة */}
                  <div className="relative w-full bg-muted overflow-hidden rounded-lg" style={{ aspectRatio: '3 / 2' }}>
                    {episode.thumbnailUrl ? (
                      <img
                        src={episode.thumbnailUrl}
                        alt={`الحلقة ${episode.episodeNumber}`}
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          user ? "group-hover:brightness-75" : ""
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {episode.episodeNumber}
                        </span>
                      </div>
                    )}
                    
                    {/* overlay عند التمرير */}
                    {user ? (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-primary/90 p-2.5 rounded-full">
                          <svg
                            className="w-5 h-5 text-white fill-white"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* معلومات الحلقة */}
                  <div className="mt-3">
                    <p className="font-semibold text-foreground text-sm">الحلقة {episode.episodeNumber}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{episode.titleAr}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">لا توجد حلقات</p>
          )}
        </div>
      </div>
    </div>
  );
}
