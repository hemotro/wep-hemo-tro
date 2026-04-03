import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Lock, ArrowRight } from 'lucide-react';

export default function PasswordResetCode() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = useState(false);

  const resetMutation = trpc.auth.requestPasswordReset.useMutation();
  const updatePasswordMutation = trpc.auth.resetPasswordWithCode.useMutation();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsLoading(true);
    try {
      await resetMutation.mutateAsync({ email });
      toast.success('تم إرسال الكود إلى بريدك الإلكتروني');
      setStep('code');
    } catch (error: any) {
      toast.error(error.message || 'فشل إرسال الكود');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      toast.error('يرجى إدخال الكود');
      return;
    }

    if (code.length !== 6) {
      toast.error('الكود يجب أن يكون 6 أرقام');
      return;
    }

    toast.success('تم التحقق من الكود بنجاح');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setIsLoading(true);
    try {
      await updatePasswordMutation.mutateAsync({
        email,
        code,
        newPassword,
      });
      toast.success('تم تحديث كلمة المرور بنجاح');
      setLocation('/login');
    } catch (error: any) {
      toast.error(error.message || 'فشل تحديث كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Lock className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">استعادة كلمة المرور</CardTitle>
          <CardDescription className="text-slate-400">
            {step === 'email' && 'أدخل بريدك الإلكتروني لاستقبال الكود'}
            {step === 'code' && 'أدخل الكود الذي تلقيته على بريدك الإلكتروني'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال الكود'}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  الكود الرقمي
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  disabled={isLoading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-slate-400 mt-2">الكود صالح لمدة 10 دقائق</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  كلمة المرور الجديدة
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  تأكيد كلمة المرور
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              هل تتذكر كلمة المرورك؟{' '}
              <button
                onClick={() => setLocation('/login')}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
