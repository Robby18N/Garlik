import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ACCOUNTS, useRole } from '@/context/role-context';

const LOGIN_LOADING_MS = 2000;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useRole();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (isLoggingIn) return;

    if (!username) {
      setError('Please select an account.');
      return;
    }
    const account = login(username, password);
    if (!account) {
      setError('Incorrect password. Please try again.');
      return;
    }

    setError('');
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
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Full-bleed background photo — matches Figma node 604:6296
          ("01_full_login_screen 1"): the whole canvas sits on this image
          instead of it being boxed into a side panel, with the brand copy
          and login card floating directly on top of it. */}
      <img
        src="/hero-bg.png"
        alt="Modern dental clinic interior"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        {/* Left: brand copy + trust badge, overlaid straight on the photo.
            Hidden below lg so the login card alone carries small screens. */}
        <div className="hidden w-full flex-col justify-between px-16 py-16 lg:flex lg:w-1/2">
          <div className="flex max-w-lg flex-col gap-6">
            <img
              src="/logo.png"
              alt="Smile+ Dental Studio"
              className="h-16 w-auto self-start object-contain"
            />
            <div>
              <p className="text-[56px] leading-[1.1] font-semibold text-slate-950">Your Smile,</p>
              <p className="text-[56px] leading-[1.1] font-semibold text-[#61ba44]">Our Passion</p>
            </div>
            <p className="max-w-md text-xl leading-[1.5] text-slate-500">
              Premium dental care with advanced technology and a gentle touch.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-[17px] bg-white/95 px-5 py-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-sm">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <ShieldCheck className="size-5" />
            </div>
            <p className="text-sm leading-snug font-medium text-slate-700">
              Trusted by thousands
              <br />
              of happy patients
            </p>
          </div>
        </div>

        {/* Right: floating login card */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-[532px] rounded-[20px] bg-white p-10 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] sm:p-12">
            <div className="flex w-full flex-col items-center gap-12">
              <div className="flex w-full flex-col items-center gap-2 text-center">
                <h1 className="text-[32px] font-bold text-slate-950">Welcome Back</h1>
                <p className="text-lg leading-[1.5] text-slate-700">
                  Log in to access your clinic account
                </p>
              </div>

              <form className="flex w-full flex-col items-end gap-8" onSubmit={handleSubmit}>
                <div className="flex w-full flex-col gap-8">
                  {/* Account picker — replaces a free-text email/phone field
                      with a dropdown over the fixed set of demo accounts
                      (Receptionist, each doctor, Admin), since each one maps
                      to a specific role + menu access rather than an
                      arbitrary identity. */}
                  <div className="flex w-full flex-col gap-2">
                    <Label htmlFor="account" className="text-base font-medium text-slate-950">
                      Account
                    </Label>
                    <Select
                      value={username}
                      onValueChange={(value) => {
                        setUsername(value);
                        setError('');
                      }}
                      disabled={isLoggingIn}
                    >
                      <SelectTrigger
                        id="account"
                        className="h-auto min-h-[40px] w-full rounded-lg border-slate-200 px-4 py-3 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] data-[placeholder]:text-slate-500"
                      >
                        <SelectValue placeholder="Select your account" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNTS.map((acc) => (
                          <SelectItem key={acc.username} value={acc.username}>
                            {acc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
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
                    {error && <p className="text-sm font-medium text-red-600">{error}</p>}
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
