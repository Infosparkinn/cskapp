import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Lock, 
  User, 
  ArrowRight, 
  Shield, 
  Building2, 
  UserCheck, 
  GraduationCap, 
  MapPin, 
  Eye, 
  EyeOff, 
  KeyRound, 
  UserPlus,
  LogIn,
  CheckCircle2,
  Phone,
  Mail,
  BookOpen,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { dbService, BRANCHES } from '../../services/db';
import type { BranchId } from '../../types';
import logoImg from '../../assets/logo.png';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  
  // Active main tab: 'login' or 'register'
  const [activeMainTab, setActiveMainTab] = useState<'login' | 'register'>('login');
  
  // Register sub-option: 'change_password' or 'new_account'
  const [registerMode, setRegisterMode] = useState<'change_password' | 'new_account'>('change_password');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Change Password form state
  const [cpIdentifier, setCpIdentifier] = useState('');
  const [cpOldPassword, setCpOldPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [showCpOldPassword, setShowCpOldPassword] = useState(false);
  const [showCpNewPassword, setShowCpNewPassword] = useState(false);
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpSuccess, setCpSuccess] = useState<string | null>(null);
  const [isSubmittingCp, setIsSubmittingCp] = useState(false);

  // New Student Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBranch, setRegBranch] = useState<BranchId>('dadagapatty');
  const [regCourse, setRegCourse] = useState('Artificial Intelligence & Deep Learning (AI)');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const courses = dbService.getCourses(regBranch);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!identifier.trim()) {
      setLoginError('Please enter your Username, Email, or ID.');
      return;
    }
    if (!password.trim()) {
      setLoginError('Please enter your Password.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      const success = login(identifier.trim(), password.trim());
      setIsLoggingIn(false);
      if (!success) {
        setLoginError('Invalid username or password. Please check your credentials or use Change Password in the Register tab.');
      }
    }, 300);
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCpError(null);
    setCpSuccess(null);

    if (!cpIdentifier.trim()) {
      setCpError('Please enter your Username, Email, or User ID.');
      return;
    }
    if (!cpNewPassword.trim() || cpNewPassword.length < 4) {
      setCpError('New password must be at least 4 characters long.');
      return;
    }
    if (cpNewPassword !== cpConfirmPassword) {
      setCpError('New password and confirm password do not match.');
      return;
    }

    setIsSubmittingCp(true);
    setTimeout(() => {
      const result = dbService.changePassword(
        cpIdentifier.trim(),
        cpNewPassword.trim(),
        cpOldPassword.trim() || undefined
      );
      setIsSubmittingCp(false);

      if (result.success) {
        setCpSuccess(result.message);
        // Pre-fill login fields with updated credentials
        setIdentifier(cpIdentifier.trim());
        setPassword(cpNewPassword.trim());
        // Transition to login tab after brief pause
        setTimeout(() => {
          setActiveMainTab('login');
          setCpSuccess(null);
          setCpOldPassword('');
          setCpNewPassword('');
          setCpConfirmPassword('');
        }, 1800);
      } else {
        setCpError(result.message);
      }
    }, 350);
  };

  // Handle New Student Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim() && !regPhone.trim()) {
      setRegError('Please provide an email address or mobile number.');
      return;
    }
    if (regPassword && regPassword.length < 4) {
      setRegError('Password must be at least 4 characters.');
      return;
    }
    if (regPassword && regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setIsSubmittingReg(true);
    setTimeout(() => {
      const result = dbService.registerStudent({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        branchId: regBranch,
        courseName: regCourse,
        password: regPassword.trim() || 'student123'
      });
      setIsSubmittingReg(false);

      if (result.success) {
        setRegSuccess(result.message);
        // Pre-fill login
        setIdentifier(regEmail.trim() || regPhone.trim());
        setPassword(regPassword.trim() || 'student123');
        setTimeout(() => {
          setActiveMainTab('login');
          setRegSuccess(null);
          setRegName('');
          setRegEmail('');
          setRegPhone('');
          setRegPassword('');
          setRegConfirmPassword('');
        }, 1800);
      } else {
        setRegError(result.message);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white relative overflow-hidden py-8">
      {/* Decorative gradient glow circles */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/25 border-2 border-white/20 mb-1 bg-[#091428] p-1 ring-4 ring-blue-500/10">
            <img 
              src={logoImg} 
              alt="CSK Academy & InfoSpark Innovation Logo" 
              className="w-full h-full object-cover rounded-2xl" 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = './logo.png'; }}
            />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              CSK Academy
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-sky-400">
              & InfoSpark Innovation Pvt Ltd
            </p>
          </div>

          <p className="text-[11px] text-amber-300 font-medium flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400" /> Salem, Tamil Nadu
          </p>

          {/* 4 Branch Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1 pt-0.5 text-[9px] sm:text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/80">
              Dadagapatty (CSK)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/80">
              Kondalampatty (CSK)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/80">
              Ammapet (CSK)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/80 font-semibold">
              New Bus Stand (InfoSpark)
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 ring-1 ring-white/10">
          
          {/* Main Top Tabs: [Sign In] | [Register] */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/90 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('login');
                setLoginError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab('register');
                setCpError(null);
                setCpSuccess(null);
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: SIGN IN FORM                                      */}
          {/* ======================================================== */}
          {activeMainTab === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-center">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Sign In to Dashboard
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enter your username/email and password
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Username / Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Username, Email, or ID
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. admin, manager, staff, student"
                      value={identifier}
                      onChange={e => {
                        setIdentifier(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      autoComplete="username"
                      autoCapitalize="none"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-white placeholder:text-slate-500 transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMainTab('register');
                        setRegisterMode('change_password');
                        setCpIdentifier(identifier);
                      }}
                      className="text-[10px] text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer"
                    >
                      Change Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-white placeholder:text-slate-500 transition-all shadow-inner font-mono tracking-wider"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Alert */}
                {loginError && (
                  <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 p-2.5 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 active:scale-[0.99] text-white flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In / Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Helper to switch to Register */}
              <div className="pt-2 border-t border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-400">
                  Need to change password or create student account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMainTab('register');
                      setRegisterMode('change_password');
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    Go to Register Tab →
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REGISTER TAB (Change Password + New Registration) */}
          {/* ======================================================== */}
          {activeMainTab === 'register' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Register Sub-Toggle: [🔑 Change Password] | [📝 New Student] */}
              <div className="flex items-center justify-center gap-2 p-1 bg-slate-950/70 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterMode('change_password');
                    setCpError(null);
                    setCpSuccess(null);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    registerMode === 'change_password'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegisterMode('new_account');
                    setRegError(null);
                    setRegSuccess(null);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    registerMode === 'new_account'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Student Register</span>
                </button>
              </div>

              {/* -------------------------------------------------------- */}
              {/* OPTION A: CHANGE PASSWORD FORM                            */}
              {/* -------------------------------------------------------- */}
              {registerMode === 'change_password' && (
                <div className="space-y-3.5">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center justify-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-400" /> Change / Reset Password
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Change password for Admin, Manager, Staff, or Student
                    </p>
                  </div>

                  <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                    {/* Identifier */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Username, Email, or ID
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. admin, manager, staff, student"
                          value={cpIdentifier}
                          onChange={e => {
                            setCpIdentifier(e.target.value);
                            if (cpError) setCpError(null);
                          }}
                          className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden text-white placeholder:text-slate-500 transition-all shadow-inner"
                          required
                        />
                      </div>
                    </div>

                    {/* Current Password (Optional verification) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300">
                          Current Password <span className="text-[10px] text-slate-500 font-normal">(leave empty if forgotten)</span>
                        </label>
                      </div>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showCpOldPassword ? 'text' : 'password'}
                          placeholder="Current password"
                          value={cpOldPassword}
                          onChange={e => {
                            setCpOldPassword(e.target.value);
                            if (cpError) setCpError(null);
                          }}
                          className="w-full pl-10 pr-10 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-white placeholder:text-slate-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCpOldPassword(!showCpOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        >
                          {showCpOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showCpNewPassword ? 'text' : 'password'}
                          placeholder="•••••••• (min 4 characters)"
                          value={cpNewPassword}
                          onChange={e => {
                            setCpNewPassword(e.target.value);
                            if (cpError) setCpError(null);
                          }}
                          className="w-full pl-10 pr-10 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-white placeholder:text-slate-500 font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCpNewPassword(!showCpNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        >
                          {showCpNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <input
                          type={showCpNewPassword ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          value={cpConfirmPassword}
                          onChange={e => {
                            setCpConfirmPassword(e.target.value);
                            if (cpError) setCpError(null);
                          }}
                          className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-white placeholder:text-slate-500 font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Alerts */}
                    {cpError && (
                      <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 p-2.5 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{cpError}</span>
                      </div>
                    )}

                    {cpSuccess && (
                      <div className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 p-2.5 rounded-xl flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{cpSuccess}</p>
                          <p className="text-[11px] text-emerald-200/80 mt-0.5">Switching to Sign In tab...</p>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      type="submit"
                      disabled={isSubmittingCp}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 active:scale-[0.99] text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingCp ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Updating password...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Update & Change Password</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* OPTION B: NEW STUDENT REGISTRATION FORM                   */}
              {/* -------------------------------------------------------- */}
              {registerMode === 'new_account' && (
                <div className="space-y-3.5">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-teal-300 flex items-center justify-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-teal-400" /> New Student Registration
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Create student account for course admissions
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Student Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Anand Kumar"
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden text-white placeholder:text-slate-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="email"
                            placeholder="student@gmail.com"
                            value={regEmail}
                            onChange={e => setRegEmail(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden text-white placeholder:text-slate-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="tel"
                            placeholder="9845012345"
                            value={regPhone}
                            onChange={e => setRegPhone(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden text-white placeholder:text-slate-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Branch & Course */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Salem Campus
                        </label>
                        <select
                          value={regBranch}
                          onChange={e => setRegBranch(e.target.value as BranchId)}
                          className="w-full px-2.5 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden text-white"
                        >
                          {BRANCHES.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.location} ({b.shortCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Course
                        </label>
                        <select
                          value={regCourse}
                          onChange={e => setRegCourse(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden text-white truncate"
                        >
                          {courses.map(c => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Password
                        </label>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden text-white font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Confirm Password
                        </label>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={e => setRegConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Alerts */}
                    {regError && (
                      <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 p-2.5 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{regError}</span>
                      </div>
                    )}

                    {regSuccess && (
                      <div className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 p-2.5 rounded-xl flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{regSuccess}</p>
                          <p className="text-[11px] text-emerald-200/80 mt-0.5">Switching to Sign In tab...</p>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmittingReg}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-500 hover:to-emerald-600 active:scale-[0.99] text-white flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingReg ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Create Student Account</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Back to Sign In Link */}
              <div className="pt-2 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('login')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline cursor-pointer"
                >
                  ← Already have an account? Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500">
          CSK Academy & InfoSpark Innovation Pvt Ltd • Salem, Tamil Nadu
        </p>
      </div>
    </div>
  );
};
