import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Chrome } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.loginEmail.useMutation();

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

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  return (
    <div className="flex-1 pb-20 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground mb-2">hemo tro</CardTitle>
          <CardDescription>
            {isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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

          {/* فاصل */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">أو</span>
            </div>
          </div>

          {/* تسجيل الدخول عبر Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Chrome className="w-5 h-5 ml-2" />
            تسجيل الدخول عبر Google
          </Button>

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
        </CardContent>
      </Card>
    </div>
  );
}
