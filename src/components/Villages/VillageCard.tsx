import React from 'react';
import { MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { Village } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface VillageCardProps {
  village: Village;
  onEdit: (village: Village) => void;
  onDelete: (id: string) => void;
}

export function VillageCard({ village, onEdit, onDelete }: VillageCardProps) {
  const { t, language } = useLanguage();

  const villageName = language === 'mr' ? village.village_name_mr : village.village_name;
  const blockName = language === 'mr' ? village.block_mr : village.block;
  const gramPanchayatName = language === 'mr' ? village.gram_panchayat_mr : village.gram_panchayat;
  const districtName = language === 'mr' ? village.district_mr : village.district;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 transform hover:scale-105 border border-gray-100 overflow-hidden group max-w-sm">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{villageName}</h3>
                <p className="text-emerald-100 text-xs font-medium">{village.village_code}</p>
              </div>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(village)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
              >
                <Edit className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => village.id && onDelete(village.id)}
                className="w-8 h-8 bg-red-500/30 hover:bg-red-500/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-wrap gap-3">
  {/* District */}
  <div className="flex-1 min-w-[140px] bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl">
    <p className="text-xs font-medium text-gray-600 mb-1">{t('district')}</p>
    <p className="font-semibold text-gray-800 text-sm">{districtName}</p>
  </div>

  {/* Block */}
  <div className="flex-1 min-w-[140px] bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-xl">
    <p className="text-xs font-medium text-emerald-600 mb-1">{t('block')}</p>
    <p className="font-semibold text-emerald-800 text-sm">{blockName}</p>
  </div>

  {/* Gram Panchayat */}
  <div className="flex-1 min-w-[140px] bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl">
    <p className="text-xs font-medium text-blue-600 mb-1">{t('gramPanchayat')}</p>
    <p className="font-semibold text-blue-800 text-sm">{gramPanchayatName}</p>
  </div>

  {/* Population */}
  <div className="flex-1 min-w-[160px] flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
        <Users className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-orange-600">{t('population')}</p>
        <p className="text-base font-bold text-orange-800">
          {village.population.toLocaleString()}
        </p>
      </div>
    </div>
  </div>

  {/* GPS (only if available) */}
  {(village.latitude && village.longitude) && (
    <div className="flex-1 min-w-[180px] bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl">
      <p className="text-xs font-medium text-purple-600 mb-1">GPS</p>
      <div className="text-xs space-y-1">
        <div>
          <span className="text-purple-600 font-medium">{t('latitude')}: </span>
          <span className="text-purple-800">{village.latitude}</span>
        </div>
        <div>
          <span className="text-purple-600 font-medium">{t('longitude')}: </span>
          <span className="text-purple-800">{village.longitude}</span>
        </div>
      </div>
    </div>
  )}
</div>

    </div>
  );
}
