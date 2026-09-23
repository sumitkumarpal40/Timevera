import React, { useState, useEffect } from 'react';
import { X, Smartphone, Mail, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({ isOpen, onClose }) => {
  const { user, customer, updateProfile } = useCustomerAuth();
  const [authMode, setAuthMode] = useState<'options' | 'phone' | 'otp' | 'setup'>('options');
  
  // Phone Auth State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Setup Profile State
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Firebase User object after successful auth but before profile creation
  const [tempUser, setTempUser] = useState<User | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (user && !customer) {
        // Logged in, but context hasn't fetched profile yet. Wait.
      } else if (user && customer) {
        // Check if profile is complete
        if (!customer.fullName || customer.fullName === 'Customer') {
          setSetupName(customer.fullName === 'Customer' ? '' : customer.fullName);
          setSetupEmail(customer.email || '');
          setSetupPhone(customer.phone || '');
          setAuthMode('setup');
        } else {
          onClose(); // Profile complete, close modal
        }
      } else {
        setAuthMode('options');
        setPhone('');
        setOtp('');
        setErrorMsg('');
        setLoading(false);
      }
    }
  }, [isOpen, user, customer, onClose]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const cred = await signInWithPopup(auth, googleProvider);
      await checkExistingProfile(cred.user);
    } catch (error: any) {
      
      if (error.code === 'auth/operation-not-allowed') {
        setErrorMsg('Google Sign-In is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.');
      } else {
        setErrorMsg('Google login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    
    try {
      setLoading(true);
      setErrorMsg('');
      setupRecaptcha();
      
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setAuthMode('otp');
      setLoading(false);
    } catch (error: any) {
      
      if (error.code === 'auth/operation-not-allowed') {
        setErrorMsg('Phone Auth is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.');
      } else {
        setErrorMsg('Failed to send OTP. Please try again later.');
      }
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6 || !confirmationResult) {
      setErrorMsg('Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const cred = await confirmationResult.confirm(otp);
      await checkExistingProfile(cred.user);
    } catch (error: any) {
      
      setErrorMsg('Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const checkExistingProfile = async (authUser: User) => {
    try {
      const docRef = doc(db, 'customers', authUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.fullName && data.fullName !== 'Customer') {
          // Has valid profile
          onClose();
        } else {
          // Need setup
          setTempUser(authUser);
          setSetupName(authUser.displayName || '');
          setSetupEmail(authUser.email || '');
          setSetupPhone(authUser.phoneNumber || '');
          setAuthMode('setup');
          setLoading(false);
        }
      } else {
        // No profile, need setup
        setTempUser(authUser);
        setSetupName(authUser.displayName || '');
        setSetupEmail(authUser.email || '');
        setSetupPhone(authUser.phoneNumber || '');
        setAuthMode('setup');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setLoading(false);
    }
  };

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      // The CustomerAuthContext might already create a default one. We update it.
      await updateProfile({
        fullName: setupName.trim(),
        email: setupEmail.trim(),
        phone: setupPhone.trim() || phone,
      });
      onClose();
    } catch (error) {
      
      setErrorMsg('Failed to save profile. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#121212] w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-slideUp">
        {/* Header */}
        <div className="relative px-4 py-5 sm:px-6 sm:py-8 text-center bg-zinc-950">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 p-1.5 sm:p-2 text-zinc-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex justify-center mb-2 sm:mb-3">
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-200 to-amber-500 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
              </div>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-brand font-bold text-white tracking-wide">
            {authMode === 'setup' ? 'COMPLETE PROFILE' : 'TIMEVERA WATCH'}
          </h2>
          <p className="text-amber-400/90 text-xs sm:text-sm italic font-serif mt-1">
            {authMode === 'setup' ? 'Just a few details to get started' : '"Time That Defines You"'}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          {errorMsg && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg sm:rounded-xl text-[11px] sm:text-xs text-red-600 dark:text-red-400 font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {authMode === 'options' && (
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 sm:gap-3 transition-all group disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-zinc-400" /> : <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-300 group-hover:text-amber-500" />}
                <span className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 sm:gap-4 py-1.5 sm:py-2">
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
              </div>

              <button
                onClick={() => setAuthMode('phone')}
                disabled={loading}
                className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-black dark:hover:bg-zinc-700 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-md disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="font-bold text-xs sm:text-sm">Continue with Mobile Number</span>
              </button>
            </div>
          )}

          {authMode === 'phone' && (
            <form onSubmit={handlePhoneLogin} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1 sm:mb-1.5">
                  Mobile Number
                </label>
                <div className="flex">
                  <div className="px-2.5 sm:px-3 py-2 sm:py-3 h-10 sm:h-11 bg-zinc-100 dark:bg-zinc-900 border border-r-0 border-zinc-300 dark:border-zinc-700 rounded-l-lg sm:rounded-l-xl flex items-center justify-center text-xs sm:text-sm font-bold text-zinc-500">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 h-10 sm:h-11 bg-white dark:bg-[#1a1a1a] border border-zinc-300 dark:border-zinc-700 rounded-r-lg sm:rounded-r-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-lg sm:rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <span>Send Secure OTP</span>}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('options')}
                className="w-full text-center text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white font-medium py-1.5 px-2"
              >
                Go Back
              </button>
            </form>
          )}

          {authMode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-5">
              <div className="text-center mb-1.5 sm:mb-2">
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  Enter the 6-digit verification code sent to
                </p>
                <p className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white mt-0.5 sm:mt-1">+91 {phone}</p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-4 text-center tracking-[0.8em] sm:tracking-[1em] bg-white dark:bg-[#1a1a1a] border-2 border-zinc-300 dark:border-zinc-700 rounded-lg sm:rounded-xl text-base sm:text-xl font-bold focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-lg sm:rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <span>Verify & Login</span>}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setAuthMode('phone');
                  setOtp('');
                }}
                className="w-full text-center text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white font-medium py-1.5 px-2"
              >
                Change Mobile Number
              </button>
            </form>
          )}

          {authMode === 'setup' && (
            <form onSubmit={handleSetupProfile} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 h-10 sm:h-11 bg-white dark:bg-[#1a1a1a] border border-zinc-300 dark:border-zinc-700 rounded-lg sm:rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={setupPhone}
                  onChange={(e) => setSetupPhone(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 h-10 sm:h-11 bg-white dark:bg-[#1a1a1a] border border-zinc-300 dark:border-zinc-700 rounded-lg sm:rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. name@gmail.com"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 h-10 sm:h-11 bg-white dark:bg-[#1a1a1a] border border-zinc-300 dark:border-zinc-700 rounded-lg sm:rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-1.5 sm:pt-2">
                <button
                  type="submit"
                  disabled={loading || !setupName}
                  className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-lg sm:rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Complete Setup</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
};
