import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Music2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { login } from "../../services/api";

const imgBackground = "/background.jpg";

interface LoginScreenProps {
  onSignupClick: () => void;
  onLoginSuccess: () => void;
}

export default function LoginScreen({
  onSignupClick,
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({ email, password });
      if (response.userId) {
        onLoginSuccess();
      } else {
        setError(response.message || "로그인에 실패했습니다");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full aurora-bg flex items-center justify-center p-4">
      {/* Stars overlay */}
      <div className="stars" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Aurora Glass card */}
        <div className="aurora-glass rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 backdrop-blur-lg border border-emerald-400/30 rounded-2xl p-4 aurora-glow">
              <Music2 className="w-12 h-12 text-emerald-300" strokeWidth={1.5} />
            </div>
          </div>

          {/* Title */}
          <h2 className="aurora-text text-3xl text-center font-bold mb-2">로그인</h2>
          <p className="text-emerald-200/70 text-center mb-8">
            계정에 로그인하여 음악을 즐기세요
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-emerald-100">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-emerald-900/20 border-emerald-500/20 text-white placeholder:text-emerald-300/50 backdrop-blur-sm focus:bg-emerald-900/30 focus:border-emerald-400/40"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-100">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-emerald-900/20 border-emerald-500/20 text-white placeholder:text-emerald-300/50 backdrop-blur-sm focus:bg-emerald-900/30 focus:border-emerald-400/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300/70 hover:text-emerald-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2 text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white border-0 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 135, 0.3)' }}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-emerald-200/70 text-sm">
              계정이 없으신가요?{" "}
              <button
                onClick={onSignupClick}
                className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors"
              >
                회원가입
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
