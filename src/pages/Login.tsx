import React, { useState, useEffect } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import axios from "axios";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  
  const { login } = useAuth();
  const { panelName, enableLoginAnimation } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setIntroDone(true)
      });

      if (enableLoginAnimation !== false) {
        // Cinematic Parallax Intro Sequence
        gsap.set(".desert-wrapper", { backgroundColor: "#000" });
        gsap.set(".login-card", { autoAlpha: 0, y: 40, scale: 0.95 });
        gsap.set(".parallax-container", { scale: 1.1, opacity: 0 });
        
        const shakeKeyframes = Array.from({ length: 15 }).map(() => ({
          x: Math.random() * 30 - 15,
          y: Math.random() * 30 - 15,
          rotation: Math.random() * 3 - 1.5,
          duration: 0.05
        }));
        shakeKeyframes.push({ x: 0, y: 0, rotation: 0, duration: 0.05 });

        tl.to(".parallax-container", { opacity: 1, duration: 2.5, ease: "power2.inOut" })
          .to(".desert-wrapper", { backgroundColor: "#F7ABAE", duration: 1.5 }, "-=1.5")
          .to(".parallax-container", { scale: 1.25, transformOrigin: "center 35%", duration: 2.5, ease: "power2.inOut" }, "-=1")
          .to(".parallax-container", { scale: 1, duration: 0.5, ease: "power4.inOut" })
          .to(".parallax-container", { keyframes: shakeKeyframes, ease: "none" })
          .to(".login-card", { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.2)" }, "+=0.1");
      } else {
        // Instant Show Fallback
        gsap.set(".desert-wrapper", { backgroundColor: "#F7ABAE" });
        gsap.set(".login-card", { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set(".parallax-container", { scale: 1, opacity: 1 });
        setIntroDone(true);
      }

      // Floating Parallax Layers
      const layers = [1, 2, 3, 4, 5, 6, 7];
      layers.forEach((layerNum) => {
        gsap.to(`.layer-${layerNum}`, {
          y: -10 - layerNum * 4, 
          duration: 3 + layerNum * 0.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
      });
      
      gsap.to(".layer-text", {
         y: -18,
         duration: 4,
         ease: "sine.inOut",
         yoyo: true,
         repeat: -1
      });
    });
    
    return () => ctx.revert();
  }, [enableLoginAnimation]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!introDone) return;

    const x = (e.clientX / window.innerWidth - 0.5) * 2; // Range: -1 to 1

    const layers = [1, 2, 3, 4, 5, 6, 7];
    layers.forEach((layerNum) => {
      const depth = layerNum * 8;
      gsap.to(`.layer-${layerNum}`, {
        x: -x * depth,
        duration: 1,
        ease: "power2.out",
        overwrite: "auto"
      });
    });
    
    gsap.to(".layer-text", {
      x: -x * 25,
      duration: 1,
      ease: "power2.out",
      overwrite: "auto"
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/auth/login", { username, password });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials or server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="desert-wrapper relative overflow-hidden select-none" onMouseMove={handleMouseMove}>
      
      {/* Background Parallax Layer Canvas */}
      <div className="parallax-container">
        <img src="/desert/img-bg.svg" alt="" className="parallax-layer layer-bg" />
        <img src="/desert/img-1.svg" alt="" className="parallax-layer layer-1" />
        <img src="/desert/img-2.svg" alt="" className="parallax-layer layer-2" />
        <img src="/desert/img-3.svg" alt="" className="parallax-layer layer-3" />
        
        <div className="parallax-layer layer-text flex flex-col items-center justify-center text-center">
           <h1 className="background-title font-black uppercase tracking-widest text-white drop-shadow-2xl">
             {panelName || "MINEHOSTING"}
           </h1>
           <p className="background-subtitle font-mono text-xs tracking-[0.4em] text-white/80 uppercase mt-1">
             CONTROL PANEL
           </p>
        </div>

        <img src="/desert/img-4.svg" alt="" className="parallax-layer layer-4" />
        <img src="/desert/img-5.svg" alt="" className="parallax-layer layer-5" />
        <img src="/desert/img-6.svg" alt="" className="parallax-layer layer-6" />
        <img src="/desert/img-7.svg" alt="" className="parallax-layer layer-7" />
      </div>

      {/* Cyber Glassmorphism Login Card */}
      <div className="login-card w-full max-w-md p-6 sm:p-8 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative z-30">
        
        {/* Header Badge */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-sky-400 uppercase">
            Secure Gateway
          </span>
        </div>

        <h2 className="login-title text-2xl sm:text-3xl font-extrabold text-white text-center tracking-tight">
          {panelName || "Panel"} Access
        </h2>
        <p className="login-subtitle text-xs text-gray-400 text-center font-medium mt-1 mb-6">
          Enter your administrative credentials
        </p>
        
        <form onSubmit={handleLogin} className="login-form space-y-4">
          {error && (
            <div className="login-error flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-300 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Username Input */}
          <div className="input-group relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              name="username" 
              required 
              placeholder="Username" 
              className="login-input w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all font-sans" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          {/* Password Input with Visibility Toggle */}
          <div className="input-group relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              required 
              placeholder="Password" 
              className="login-input w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-11 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all font-sans" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="login-button w-full py-3.5 bg-sky-600 hover:bg-sky-500 active:scale-95 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-2" 
            disabled={isLoading}
          >
            <span>{isLoading ? "Authenticating..." : "Sign In to Console"}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>

          <p className="text-center text-xs text-gray-500 pt-1">
            Don't have an account?{" "}
            <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">Create Account</Link>
          </p>
        </form>
      </div>
      
      {isLoading && <LoadingOverlay message="Authenticating credentials..." />}
    </div>
  );
            }
                           
