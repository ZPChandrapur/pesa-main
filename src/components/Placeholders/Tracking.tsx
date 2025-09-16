import React from 'react';
import { MapPin as TrackingIcon, Navigation, Route, Target } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function Tracking() {
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrackingIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                {language === 'mr' ? 'ट्रॅकिंग सिस्टम' : 'Tracking System'}
              </h1>
              <p className="text-teal-100 text-lg">
                {language === 'mr' 
                  ? 'कामांचा रिअल-टाइम मागोवा'
                  : 'Real-time tracking of all works'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { icon: Navigation, label: language === 'mr' ? 'सक्रिय ट्रॅकिंग' : 'Active Tracking', value: '34', color: 'from-teal-500 to-cyan-600' },
          { icon: Route, label: language === 'mr' ? 'पूर्ण केलेले रूट' : 'Completed Routes', value: '189', color: 'from-blue-500 to-indigo-600' },
          { icon: Target, label: language === 'mr' ? 'लक्ष्य ठिकाण' : 'Target Locations', value: '67', color: 'from-emerald-500 to-green-600' },
          { icon: TrackingIcon, label: language === 'mr' ? 'एकूण अंतर' : 'Total Distance', value: '2,456km', color: 'from-purple-500 to-pink-600' }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
              <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-2">{item.value}</p>
              <p className="text-gray-600 font-medium">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrackingIcon className="w-12 h-12 text-teal-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {language === 'mr' ? 'ट्रॅकिंग मॉड्यूल विकसित केले जात आहे' : 'Tracking Module Under Development'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {language === 'mr' 
              ? 'हे मॉड्यूल लवकरच उपलब्ध होईल. कृपया धैर्य धरा.'
              : 'This module will be available soon. Please stay tuned.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}