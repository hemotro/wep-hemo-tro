import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.loginEmail.useMutation();
  const forgotPasswordMutation = trpc.auth.requestPasswordReset.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      // تسجيل حساب جديد
      if (!name.trim()) {
        setError("يرجى إدخال الاسم");
        return;
      }

      registerMutation.mutate(
        { email, password, name },
        {
          onSuccess: () => {
            toast.success("تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول");
            setIsSignUp(false);
            setName("");
            setEmail("");
            setPassword("");
          },
          onError: (error: any) => {
            setError(error.message || "فشل إنشاء الحساب");
          },
        }
      );
    } else {
      // تسجيل الدخول
      loginMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            // حفظ بيانات تسجيل الدخول إذا اختار المستخدم "تذكرني"
            if (rememberMe) {
              localStorage.setItem("rememberMe", JSON.stringify({ email, rememberMe: true }));
            } else {
              localStorage.removeItem("rememberMe");
            }
            toast.success("تم تسجيل الدخول بنجاح!");
            setLocation("/");
          },
          onError: (error: any) => {
            setError(error.message || "البريد الإلكتروني أو كلمة السر غير صحيحة");
          },
        }
      );
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!forgotEmail) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }

    forgotPasswordMutation.mutate(
      { email: forgotEmail },
      {
        onSuccess: () => {
          toast.success("تم إرسال كود استعادة كلمة السر إلى بريدك الإلكتروني");
          setShowForgotPassword(false);
          setForgotEmail("");
          setLocation("/reset-password-code");
        },
        onError: (error: any) => {
          setError(error.message || "فشل إرسال البريد الإلكتروني");
        },
      }
    );
  };

  const isLoading = registerMutation.isPending || loginMutation.isPending || forgotPasswordMutation.isPending;

  return (
    <div className="flex-1 pb-20 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground mb-2">hemo tro</CardTitle>
          <CardDescription>
            {showForgotPassword ? "استعادة كلمة السر" : isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* نموذج استعادة كلمة السر */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading}
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
                disabled={isLoading}
              >
                {isLoading ? "جاري المعالجة..." : "إرسال الكود"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError("");
                  setForgotEmail("");
                }}
              >
                العودة إلى تسجيل الدخول
              </Button>
            </form>
          ) : (
            <>
              {/* نموذج البريد الإلكتروني وكلمة السر */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      الاسم
                    </label>
                    <Input
                      type="text"
                      placeholder="أدخل اسمك"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    كلمة السر
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                </div>

                {/* خاصية تذكرني - فقط عند تسجيل الدخول */}
                {!isSignUp && (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      تذكرني
                    </label>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري المعالجة..." : isSignUp ? "إنشاء حساب" : "تسجيل الدخول"}
                </Button>
              </form>

              {/* خيار نسيان كلمة السر - فقط عند تسجيل الدخول */}
              {!isSignUp && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    هل نسيت كلمة السر؟
                  </button>
                </div>
              )}

              {/* تبديل بين التسجيل والدخول */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isSignUp ? "لديك حساب بالفعل؟ " : "ليس لديك حساب؟ "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setName("");
                    setEmail("");
                    setPassword("");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignUp ? "تسجيل الدخول" : "إنشاء حساب"}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
