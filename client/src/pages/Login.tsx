import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// قائمة الصور الكرتونية المتاحة
const AVATAR_OPTIONS = [
  { id: "avatar1", name: "الدب", emoji: "🐻", color: "bg-amber-500" },
  { id: "avatar2", name: "الأسد", emoji: "🦁", color: "bg-yellow-600" },
  { id: "avatar3", name: "الثعلب", emoji: "🦊", color: "bg-orange-500" },
  { id: "avatar4", name: "الأرنب", emoji: "🐰", color: "bg-pink-400" },
  { id: "avatar5", name: "الفيل", emoji: "🐘", color: "bg-gray-500" },
  { id: "avatar6", name: "النسر", emoji: "🦅", color: "bg-amber-700" },
  { id: "avatar7", name: "الفراشة", emoji: "🦋", color: "bg-purple-400" },
  { id: "avatar8", name: "الدولفين", emoji: "🐬", color: "bg-blue-400" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [selectedAvatar, setSelectedAvatar] = useState("avatar1");
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.loginEmail.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      // تسجيل حساب جديد
      if (!name.trim()) {
        setError("يرجى إدخال الاسم الكامل");
        return;
      }
      if (!displayName.trim()) {
        setError("يرجى إدخال الاسم المستعار");
        return;
      }

      registerMutation.mutate(
        { 
          email, 
          password, 
          name,
          displayName,
          gender,
          avatar: selectedAvatar,
          avatarType: "cartoon"
        },
        {
          onSuccess: () => {
            toast.success("تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول");
            setIsSignUp(false);
            setName("");
            setDisplayName("");
            setEmail("");
            setPassword("");
            setGender("male");
            setSelectedAvatar("avatar1");
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

    toast.info("سيتم إرسال رابط استعادة كلمة السر إلى بريدك الإلكتروني");
    setShowForgotPassword(false);
    setForgotEmail("");
  };

  const isLoading = registerMutation.isPending || loginMutation.isPending;
  const selectedAvatarData = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);

  return (
    <div className="flex-1 pb-20 flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md bg-slate-800 border-purple-500/30 shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-lg">
          <CardTitle className="text-4xl font-bold text-white mb-2">🎬 hemo tro</CardTitle>
          <CardDescription className="text-purple-100">
            {showForgotPassword ? "استعادة كلمة السر" : isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* نموذج استعادة كلمة السر */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-200 mb-2 block">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-5 h-5 text-purple-400" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pr-10 bg-slate-700 border-purple-500/30 text-white placeholder:text-gray-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-lg border border-red-500/30">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "جاري المعالجة..." : "إرسال رابط الاستعادة"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-purple-500/30 text-gray-200 hover:bg-purple-500/10"
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
                  <>
                    {/* الاسم الكامل */}
                    <div>
                      <label className="text-sm font-medium text-gray-200 mb-2 block">
                        الاسم الكامل
                      </label>
                      <div className="relative">
                        <User className="absolute right-3 top-3 w-5 h-5 text-purple-400" />
                        <Input
                          type="text"
                          placeholder="أدخل اسمك الكامل"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pr-10 bg-slate-700 border-purple-500/30 text-white placeholder:text-gray-500"
                          required={isSignUp}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* الاسم المستعار */}
                    <div>
                      <label className="text-sm font-medium text-gray-200 mb-2 block">
                        الاسم المستعار (Display Name)
                      </label>
                      <div className="relative">
                        <Users className="absolute right-3 top-3 w-5 h-5 text-purple-400" />
                        <Input
                          type="text"
                          placeholder="الاسم الذي سيظهر للآخرين"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pr-10 bg-slate-700 border-purple-500/30 text-white placeholder:text-gray-500"
                          required={isSignUp}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* الجنس */}
                    <div>
                      <label className="text-sm font-medium text-gray-200 mb-2 block">
                        الجنس
                      </label>
                      <div className="flex gap-3 rtl:flex-row-reverse">
                        {[
                          { value: "male", label: "ذكر", emoji: "👨" },
                          { value: "female", label: "أنثى", emoji: "👩" },
                          { value: "other", label: "آخر", emoji: "🧑" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setGender(option.value as any)}
                            className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                              gender === option.value
                                ? "border-purple-500 bg-purple-500/20 text-white"
                                : "border-purple-500/30 bg-slate-700 text-gray-300 hover:border-purple-500/50"
                            }`}
                            disabled={isLoading}
                          >
                            <span className="text-lg">{option.emoji}</span>
                            <span className="text-xs block mt-1">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* اختيار الصورة الكرتونية */}
                    <div>
                      <label className="text-sm font-medium text-gray-200 mb-3 block">
                        اختر صورتك الكرتونية
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {AVATAR_OPTIONS.map((avatar) => (
                          <button
                            key={avatar.id}
                            type="button"
                            onClick={() => setSelectedAvatar(avatar.id)}
                            className={`p-3 rounded-lg transition-all border-2 ${
                              selectedAvatar === avatar.id
                                ? "border-purple-500 bg-purple-500/20 scale-110"
                                : "border-purple-500/30 bg-slate-700 hover:border-purple-500/50"
                            }`}
                            title={avatar.name}
                            disabled={isLoading}
                          >
                            <span className="text-3xl">{avatar.emoji}</span>
                          </button>
                        ))}
                      </div>
                      {selectedAvatarData && (
                        <p className="text-xs text-purple-300 mt-2">
                          الصورة المختارة: <span className="font-semibold">{selectedAvatarData.name}</span>
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* البريد الإلكتروني */}
                <div>
                  <label className="text-sm font-medium text-gray-200 mb-2 block">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 w-5 h-5 text-purple-400" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 bg-slate-700 border-purple-500/30 text-white placeholder:text-gray-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* كلمة السر */}
                <div>
                  <label className="text-sm font-medium text-gray-200 mb-2 block">
                    كلمة السر
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 w-5 h-5 text-purple-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 bg-slate-700 border-purple-500/30 text-white placeholder:text-gray-500"
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
                      className="border-purple-500/30"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium text-gray-200 cursor-pointer"
                    >
                      تذكرني
                    </label>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-lg border border-red-500/30">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2"
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
                    className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                  >
                    هل نسيت كلمة السر؟
                  </button>
                </div>
              )}

              {/* تبديل بين التسجيل والدخول */}
              <div className="text-center text-sm">
                <span className="text-gray-400">
                  {isSignUp ? "لديك حساب بالفعل؟ " : "ليس لديك حساب؟ "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setName("");
                    setDisplayName("");
                    setEmail("");
                    setPassword("");
                    setGender("male");
                    setSelectedAvatar("avatar1");
                  }}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
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
