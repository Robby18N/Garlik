import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const LOGIN_LOADING_MS = 2000;

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    // 2s loading pass before handing off to Today's Patient — `fromLogin`
    // flags that page to run its own brief shimmer skeleton before the
    // real content fades in, so the two loading states read as one
    // continuous transition rather than a loading-screen jump-cut.
    setTimeout(() => {
      navigate('/patients', { state: { fromLogin: true } });
    }, LOGIN_LOADING_MS);
  }

  return (
    <div className="relative flex min-h-screen w-full bg-white">
      {/* Left: hero image panel — real exported asset (already includes the
          fade-to-white composited in, matching Figma node 469:3808's
          "Frame 1437255332" export 1:1), so no extra CSS gradient needed. */}
      <div className="relative hidden w-[60%] overflow-hidden lg:block">
        <img
          src="/hero-bg.png"
          alt="Modern dental clinic interior"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />

        <div className="absolute bottom-[10%] left-[6%] max-w-[631px]">
          <p className="text-[50px] font-medium leading-tight text-slate-950">
            Our Vision is to become a{' '}
            <span className="font-bold text-green-600">
              Professional Dental Clinic
            </span>
          </p>
          <p className="mt-4 text-[26px] leading-snug text-slate-950">
            Trusted in quality and comfort with International Standard Services.
          </p>
        </div>
      </div>

      {/* Right: login form panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-[40%]">
        <div className="flex w-full max-w-[459px] flex-col items-center gap-12 py-12">
          <img src="/logo.png" alt="Smile+ Dental Studio" className="h-16 w-auto self-start object-contain" />

          <form className="flex w-full flex-col items-end gap-8" onSubmit={handleSubmit}>
            <div className="flex w-full flex-col gap-4 text-left">
              <h1 className="text-left text-[32px] font-bold text-slate-950">
                Log in to your account
              </h1>
              <p className="w-full text-left text-lg leading-normal text-slate-700">
                Access your clinic and create appointment
              </p>
            </div>

            <div className="flex w-full flex-col gap-8">
              {/* Email / phone */}
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor="identifier" className="text-base font-medium text-slate-950">
                  Email/Phone Number
                </Label>
                <div className="flex min-h-[40px] w-full items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] focus-within:border-slate-400">
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Enter your email/phone number"
                    disabled={isLoggingIn}
                    className="h-auto p-0 text-base placeholder:text-slate-500 focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor="password" className="text-base font-medium text-slate-950">
                  Password
                </Label>
                <div className="flex min-h-[40px] w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] focus-within:border-slate-400">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    disabled={isLoggingIn}
                    className="h-auto p-0 text-base placeholder:text-slate-500 focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isLoggingIn}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="flex size-6 shrink-0 items-center justify-center text-slate-500 hover:text-slate-700 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember me / forgot password */}
              <div className="flex w-full items-center justify-between">
                <Label htmlFor="remember" className="flex items-center gap-2 font-normal">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-neutral-300 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                  />
                  <span className="text-base text-slate-700">Remember me</span>
                </Label>
                <a href="#" className="text-base font-medium text-green-600 hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoggingIn}
                className={cn(
                  'min-h-9 w-full rounded-lg bg-gradient-to-r from-[#87c341] to-[#03a83d] px-4 py-3 text-base font-bold text-white shadow-sm hover:opacity-90 hover:from-[#87c341] hover:to-[#03a83d] disabled:opacity-100'
                )}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Full-screen loading pass shown for 2s after Log in is clicked,
          before handing off to Today's Patient (which then runs its own
          brief shimmer skeleton) — the two together read as one continuous
          "smart animate" style transition rather than a hard cut. */}
      <AnimatePresence>
        {isLoggingIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm"
          >
            <img src="/logo.png" alt="" className="h-10 w-auto object-contain" />
            <Loader2 className="size-8 animate-spin text-green-600" />
            <p className="text-base font-medium text-slate-700">Logging you in...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
