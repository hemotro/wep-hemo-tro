import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { LogOut, User, Mail, Settings } from "lucide-react";

export default function Account() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

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
              <p className="text-foreground font-semibold">
                {user.loginMethod === "email" && "البريد الإلكتروني"}
                {user.loginMethod === "google" && "Google"}
                {user.loginMethod === "manus" && "Manus"}
              </p>
            </div>
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
