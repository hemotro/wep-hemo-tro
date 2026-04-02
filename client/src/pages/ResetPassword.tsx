import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const verifyTokenMutation = trpc.auth.verifyPasswordResetToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    if (verifyTokenMutation.data) {
      setIsValidToken(verifyTokenMutation.data.valid);
      if (!verifyTokenMutation.data.valid) {
        setError(verifyTokenMutation.data.message || "الرمز غير صحيح أو منتهي الصلاحية");
      }
    }
  }, [verifyTokenMutation.data]);

  if (!token) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>خطأ</CardTitle>
            <CardDescription>لم يتم العثور على رمز استعادة كلمة المرور</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => setLocation("/login")}
            >
              العودة إلى تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyTokenMutation.isLoading) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق من الرمز...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>الرمز غير صحيح</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => setLocation("/login")}
            >
              العودة إلى تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle>تم بنجاح!</CardTitle>
            <CardDescription>تم تحديث كلمة السر بنجاح</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              يمكنك الآن تسجيل الدخول باستخدام كلمة السر الجديدة
            </p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword.trim()) {
      setError("يرجى إدخال كلمة السر الجديدة");
      return;
    }

    if (newPassword.length < 6) {
      setError("كلمة السر يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمات السر غير متطابقة");
      return;
    }

    resetPasswordMutation.mutate(
      { token: token || "", newPassword },
      {
        onSuccess: () => {
          toast.success("تم تحديث كلمة السر بنجاح!");
          setResetSuccess(true);
        },
        onError: (error: any) => {
          setError(error.message || "فشل تحديث كلمة السر");
          toast.error(error.message || "فشل تحديث كلمة السر");
        },
      }
    );
  };

  return (
    <div className="flex-1 pb-20 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground mb-2">hemo tro</CardTitle>
          <CardDescription>إعادة تعيين كلمة السر</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                كلمة السر الجديدة
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  required
                  disabled={resetPasswordMutation.isPending}
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                تأكيد كلمة السر
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  required
                  disabled={resetPasswordMutation.isPending}
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "جاري المعالجة..." : "تحديث كلمة السر"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setLocation("/login")}
              className="text-sm text-primary hover:underline"
            >
              العودة إلى تسجيل الدخول
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
