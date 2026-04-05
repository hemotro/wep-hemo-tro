import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { LogOut, User, Mail, Settings, Heart } from "lucide-react";
import { useState, useEffect } from "react";

export default function Account() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: favorites = [] } = trpc.favorites.getAll.useQuery();

  if (loading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>تسجيل الدخول مطلوب</CardTitle>
            <CardDescription>يرجى تسجيل الدخول للوصول إلى حسابك</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => setLocation("/login")}
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    setLocation("/");
  };

  return (
    <div className="flex-1 pb-20 px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* معلومات الحساب */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              معلومات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">الاسم</p>
              <p className="text-foreground font-semibold">{user.name || "بدون اسم"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </p>
              <p className="text-foreground font-semibold">{user.email || "بدون بريد"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">طريقة التسجيل</p>
              <p className="text-foreground font-semibold">البريد الإلكتروني</p>
            </div>
          </CardContent>
        </Card>

        {/* المفضلة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              مسلسلاتي المفضلة
            </CardTitle>
            <CardDescription>
              {favorites.length} مسلسل مفضل
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favorites.length > 0 ? (
              <div className="space-y-2">
                {favorites.map((fav: any) => (
                  <FavoriteSeries key={fav.id} seriesId={fav.seriesId} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                لم تضف أي مسلسلات للمفضلة بعد
              </p>
            )}
          </CardContent>
        </Card>

        {/* لوحة التحكم */}
        {user.role === "admin" && (
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => setLocation("/admin")}
          >
            <Settings className="w-4 h-4 ml-2" />
            لوحة التحكم
          </Button>
        )}

        {/* تسجيل الخروج */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4 ml-2" />
          {logoutMutation.isPending ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
        </Button>
      </div>
    </div>
  );
}

// مكون عرض المسلسل المفضل
function FavoriteSeries({ seriesId }: { seriesId: number }) {
  const { data: series } = trpc.series.getById.useQuery({ id: seriesId });
  const [, setLocation] = useLocation();

  if (!series) {
    return null;
  }

  return (
    <button
      onClick={() => setLocation(`/series/${seriesId}`)}
      className="w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-right flex items-center gap-3"
    >
      {series.posterUrl ? (
        <img
          src={series.posterUrl}
          alt={series.titleAr}
          className="w-12 h-12 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className="flex-1">
        <p className="font-semibold text-foreground text-sm">{series.titleAr}</p>
        {series.genre && (
          <p className="text-xs text-muted-foreground">{series.genre}</p>
        )}
      </div>
    </button>
  );
}
