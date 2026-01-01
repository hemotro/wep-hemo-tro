import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * صفحة حسابي
 * تعرض معلومات المستخدم وخيارات تسجيل الدخول والخروج
 */
export default function Account() {
  const { user, loading, isAuthenticated, logout } = useAuth();

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

  if (!isAuthenticated) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-foreground">تسجيل الدخول</CardTitle>
            <CardDescription className="text-muted-foreground">
              سجل الدخول لعرض حسابك الشخصي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              تسجيل الدخول عبر Manus
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20">
      <div className="px-4 py-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              حسابي
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              معلومات حسابك الشخصي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">الاسم</p>
              <p className="text-lg font-semibold text-foreground">{user?.name || "مستخدم"}</p>
            </div>

            {user?.email && (
              <div className="bg-background rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                <p className="text-lg font-semibold text-foreground">{user.email}</p>
              </div>
            )}

            {user?.loginMethod && (
              <div className="bg-background rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">طريقة التسجيل</p>
                <p className="text-lg font-semibold text-foreground capitalize">{user.loginMethod}</p>
              </div>
            )}

            <Button
              onClick={() => logout()}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-background"
            >
              <LogOut className="w-4 h-4 mr-2" />
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
