import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function EmailVerification({
  email,
  onVerified,
  onCancel,
}: EmailVerificationProps) {
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 دقائق
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const sendVerificationMutation = trpc.auth.sendEmailVerification.useMutation();
  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation();

  // إرسال كود التحقق عند فتح المكون
  useEffect(() => {
    const sendCode = async () => {
      try {
        await sendVerificationMutation.mutateAsync({ email });
        toast.success("تم إرسال كود التحقق إلى بريدك الإلكتروني");
      } catch (error: any) {
        toast.error(error.message || "فشل إرسال كود التحقق");
        setError(error.message || "فشل إرسال كود التحقق");
      }
    };
    sendCode();
  }, [email]);

  // عداد الوقت
  useEffect(() => {
    if (timeLeft <= 0 || isVerified) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isVerified]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code) {
      setError("يرجى إدخال الكود");
      return;
    }

    if (code.length !== 6) {
      setError("الكود يجب أن يكون 6 أرقام");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailMutation.mutateAsync({ email, code });
      setIsVerified(true);
      toast.success("تم التحقق من البريد الإلكتروني بنجاح!");
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (error: any) {
      setError(error.message || "فشل التحقق من الكود");
      toast.error(error.message || "فشل التحقق من الكود");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await sendVerificationMutation.mutateAsync({ email });
      setTimeLeft(600);
      setCode("");
      setError("");
      toast.success("تم إرسال الكود مرة أخرى");
    } catch (error: any) {
      toast.error(error.message || "فشل إعادة إرسال الكود");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isVerified) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle>تم التحقق بنجاح!</CardTitle>
            <CardDescription>تم تفعيل حسابك بنجاح</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              سيتم إعادة توجيهك الآن...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle>تحقق من بريدك الإلكتروني</CardTitle>
          <CardDescription>
            أرسلنا كود التحقق إلى {email}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                كود التحقق
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={isLoading}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                صالح لمدة {formatTime(timeLeft)}
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading || timeLeft <= 0}
            >
              {isLoading ? "جاري التحقق..." : "تحقق الآن"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                لم تستقبل الكود؟
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendCode}
                disabled={isLoading || timeLeft > 540} // يمكن إعادة الإرسال بعد مرور دقيقة
              >
                إعادة إرسال الكود
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onCancel}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
