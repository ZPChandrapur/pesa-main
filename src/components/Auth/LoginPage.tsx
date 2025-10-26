import React, { useState } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../utils/supabase';
import TribalBg from '../../assets/tribal_bg.jpg';

interface LoginPageProps {
  onRoleIdFetch: (roleId: number | null, roleName: string | null, userId: string | null) => void;
}

export function LoginPage({ onRoleIdFetch }: LoginPageProps) {
  const { t, language } = useLanguage();
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError(language === 'mr' ? 'कृपया सर्व फील्ड भरा' : 'Please fill in all fields');
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        setError(language === 'mr' ? 'लॉगिन अयशस्वी' : 'Login failed');
        return;
      }

      // Fetch role_id from user_roles table based on authenticated user id
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', data.user.id)
        .single();

      if (roleError) {
        console.error('Role fetch error:', roleError);
        setError(language === 'mr' ? 'भूमिका प्राप्त करण्यात त्रुटी' : 'Error fetching role');
        onRoleIdFetch(null, null, null);
        return;
      }

      const roleId = roleData?.role_id ?? null;
      let roleName: string | null = null;

      // ✅ ACCESS CHECK - BLOCK LOGIN IF NO PERMISSION FOR 'pesa'
      if (roleId !== null) {
        const { data: accessData, error: accessError } = await supabase
          .from('application_permissions')
          .select('id')
          .eq('role_id', roleId)
          .eq('application_name', 'pesa')
          .maybeSingle();

        if (!accessData) {
          alert(language === 'mr' ? 'आपल्याला PESA ॲप्लिकेशनचा प्रवेश नाही' : 'You do not have access to PESA application');
          await supabase.auth.signOut();
          return;
        }
      }

      if (roleId !== null) {
        // Now fetch the role name from roles table
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('name')
          .eq('id', roleId)
          .single();

        if (rolesError) {
          console.error('Role name fetch error:', rolesError);
          setError(language === 'mr' ? 'भूमिका नाव मिळवण्यात त्रुटी' : 'Error fetching role name');
          roleName = null;
        } else {
          roleName = rolesData?.name ?? null;
        }
      }

      // Pass roleId, roleName, and userId up
      onRoleIdFetch(roleId, roleName, data.user.id);

      // Persist role info in localStorage
      if (roleId !== null) {
        localStorage.setItem('roleId', String(roleId));
      } else {
        localStorage.removeItem('roleId');
      }
      if (roleName !== null) {
        localStorage.setItem('roleName', roleName);
      } else {
        localStorage.removeItem('roleName');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.message ||
        (language === 'mr' ? 'लॉगिन करताना त्रुटी आली' : 'Error occurred during login')
      );
      onRoleIdFetch(null, null, null);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <img
        src={TribalBg}
        alt="Login Background"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
        style={{ filter: 'brightness(0.8) blur(3px)', opacity: 0.3 }}
      />
      <div
        className="w-full max-w-md rounded-3xl border border-white/50 p-8 bg-white/70 shadow-lg"
        style={{
          boxShadow: '0 0 25px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(6px)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            {language === 'mr' ? 'पेसा कायदा कार्य आणि निधी व्यवस्थापन प्रणाली' : 'Pesa Act work and fund Management System'}
          </h1>
          <p className="text-gray-600">
            {language === 'mr'
              ? 'कार्य व्यवस्थापन प्रणालीमध्ये प्रवेश करा'
              : 'Access the Work Management System'
            }
          </p>
        </div>

        {/* Login Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {language === 'mr' ? 'ईमेल पत्ता' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={language === 'mr' ? 'आपला ईमेल पत्ता टाका' : 'Enter your email address'}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {language === 'mr' ? 'पासवर्ड' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={language === 'mr' ? 'आपला पासवर्ड टाका' : 'Enter your password'}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-6 rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading
                ? (language === 'mr' ? 'प्रवेश करत आहे...' : 'Signing in...')
                : (language === 'mr' ? 'प्रवेश करा' : 'Sign In')
              }
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              {language === 'mr'
                ? `© ${new Date().getFullYear()} जिल्हा परिषद चंद्रपूर, महाराष्ट्र शासन. सर्व हक्क राखीव.`
                : `© ${new Date().getFullYear()} ZP Chandrapur, Govt of Maharashtra. All rights reserved.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
