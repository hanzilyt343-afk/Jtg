import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import axios from "axios";
import "./Login.css";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/register", { username, email, password });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-sky-500", "bg-emerald-500"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strength = passwordStrength();

  return (
    <div className="desert-wrapper relative overflow-hidden select-none">
      <div className="parallax-container">
        <img src="/desert/img-bg.svg" alt="" className="parallax-layer layer-bg" />
        <img src="/desert/img-1.svg" alt="" className="parallax-layer layer-1" />
        <img src="/desert/img-2.svg" alt="" className="parallax-layer layer-2" />
        <img src="/desert/img-3.svg" alt="" className="parallax-layer layer-3" />
        <div className="parallax-layer layer-text flex flex-col items-center justify-center text-center">
          <h1 className="background-title font-black uppercase tracking-widest text-white drop-shadow-2xl">MINEACTYL</h1>
          <p className="background-subtitle font-mono text-xs tracking-[0.4em] text-white/80 uppercase mt-1">CONTROL PANEL</p>
        </div>
        <img src="/desert/img-4.svg" alt="" className="parallax-layer layer-4" />
        <img src="/desert/img-5.svg" alt="" className="parallax-layer layer-5" />
        <img src="/desert/img-6.svg" alt="" className="parallax-layer layer-6" />
        <img src="/desert/img-7.svg" alt="" className="parallax-layer layer-7" />
      </div>

      <div className="login-card w-full max-w-md p-6 sm:p-8 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative z-30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">Create Account</span>
        </div>

        <h2 className="login-title text-2xl sm:text-3xl font-extrabold text-white text-center tracking-tight">Join Mineactyl</h2>
        <p className="login-subtitle text-xs text-gray-400 text-center font-medium mt-1 mb-6">Create your hosting account to get started</p>

        <form onSubmit={handleSignup} className="login-form space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              required
              placeholder="Username"
              className="login-input w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              value={username}
              onChange={e => setUsername(e.target.value)}
              minLength={3}
              maxLength={24}
            />
          </div>

          <div className="input-group relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="Email (optional)"
              className="login-input w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Password"
              className="login-input w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-11 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {password && (
            <div className="space-y-1.5 px-1">
              <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? strengthColors[strength-1] : 'bg-white/10'}`} />
                ))}
              </div>
              <p className="text-[10px] font-mono text-gray-500">{strength > 0 ? strengthLabels[strength-1] : ""} password</p>
            </div>
          )}

          <div className="input-group relative">
            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirm Password"
              className={`login-input w-full bg-white/5 border rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all ${
                confirmPassword && confirmPassword !== password ? 'border-rose-500/50 focus:ring-1 focus:ring-rose-500/30' : 'border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30'
              }`}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="login-button w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            disabled={isLoading}
          >
            <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>

          <p className="text-center text-xs text-gray-500 pt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
