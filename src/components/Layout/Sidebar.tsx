import React from 'react';
import { Home, MapPin, Building2, Banknote, TrendingUp, Globe, LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  roleId: number | null;
  roleName: string | null;
  userId: string | null;
}

interface NavItem {
  id: string;
  icon: React.ComponentType<any>;
  labelKey: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: Home, labelKey: 'dashboard' },
  { id: 'villages', icon: MapPin, labelKey: 'villages' },
  { id: 'aarakhada', icon: Building2, labelKey: 'aarakhada' },
  { id: 'workProgress', icon: TrendingUp, labelKey: 'workProgress' },
  { id: 'gramPanchayat', icon: Building2, labelKey: 'gramPanchayat' },
  { id: 'taluka', icon: Building2, labelKey: 'taluka' },
  { id: 'district', icon: Building2, labelKey: 'district' },
  { id: 'funds', icon: Banknote, labelKey: 'distributedFunds' },
];

export function Sidebar({ activeTab, onTabChange, roleId, roleName, userId }: SidebarProps) {
  const { t, language, setLanguage } = useLanguage();
  const { signOut, user } = useAuth();

  let allowedNavs: string[] = navItems.map(item => item.id);

  if (roleName === "grampanchayat") {
    allowedNavs = [
      "dashboard", "villages", "aarakhada", "workProgress", "gramPanchayat"
    ];
  } else if (roleName === "taluka") {
    allowedNavs = [
      "dashboard", "villages", "aarakhada", "workProgress", "taluka"
    ];
  } else if (roleName === "district") {
    allowedNavs = [
      "dashboard", "villages", "aarakhada", "workProgress", "gramPanchayat", "taluka" ,"district", "funds"
    ];
  }

  const filteredNavItems = navItems.filter(item => allowedNavs.includes(item.id));

  return (
    <div className="w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              पेसा वर्क
            </h1>
            <p className="text-sm text-slate-400">Work Management</p>
          </div>
        </div>
        {user && (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <p className="text-sm font-medium text-white truncate">{user.email}</p>
            <p className="text-xs text-slate-400">
              {language === 'mr' ? 'लॉग इन केले आहे' : 'Logged in'}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <Globe className="w-4 h-4 text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'mr' | 'en')}
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
          >
            <option value="mr" className="bg-slate-800">मराठी</option>
            <option value="en" className="bg-slate-800">English</option>
          </select>
        </div>
      </div>
      <nav className="space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium flex-1 text-left">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto pt-4">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 text-slate-300 hover:bg-red-500/20 hover:text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">
            {language === 'mr' ? 'लॉग आउट' : 'Logout'}
          </span>
        </button>
      </div>
      <div className="mt-8 p-4 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-2xl border border-emerald-500/20">
        <p className="text-sm text-emerald-400 font-medium mb-2">
          {language === 'mr' ? 'प्रणाली आवृत्ती' : 'System Version'}
        </p>
        <p className="text-xs text-slate-400">v1.0.0</p>
      </div>
    </div>
  );
}
