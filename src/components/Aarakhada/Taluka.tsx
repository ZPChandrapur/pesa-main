import React from 'react';
import { Building2, Filter, DollarSign, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AarakhadaTalukaTable } from './AarakhadaTalukaTable';
import { villageService, talukaWorkService } from '../../utils/supabase';

export function Taluka() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<'financial' | 'physical'>('physical');
  const [selectedTaluka, setSelectedTaluka] = React.useState('');
  const [selectedGramPanchayat, setSelectedGramPanchayat] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<'A' | 'B' | 'C' | 'D' | ''>('');
  const [works, setWorks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [talukas, setTalukas] = React.useState<any[]>([]);
  const [gramPanchayatsByTaluka, setGramPanchayatsByTaluka] = React.useState<Record<string, string[]>>({});
  const [talukaAarakhadaFinancial, setTalukaAarakhadaFinancial] = React.useState<any[]>([]);
  const [talukaAarakhadaPhysical, setTalukaAarakhadaPhysical] = React.useState<any[]>([]);

  const defaultWorkCategories = [
    { id: 'A', name: 'Category A - Basic Infrastructure', name_mr: 'प्रकार अ - पायाभूत सुविधा' },
  { id: 'B', name: 'Category B - Implementation of FRA & PESA Acts', name_mr: 'प्रकार ब - वन हक्क अधिनियम (FRA) व पेसा (PESA) कायद्याची अंमलबजावणी' },
  { id: 'C', name: 'Category C - Health, Sanitation & Education', name_mr: 'प्रकार क - आरोग्य, स्वच्छता, शिक्षण' },
  { id: 'D', name: 'Category D - Afforestation, Wildlife Conservation & Livelihood', name_mr: 'प्रकार ड - वनीकरण, वन्यजीव संवर्धन, जलसंधारण, वनतळी, वन्यजीव पर्यटन व वन उपजिविका' },
  ];
  const [workCategories, setWorkCategories] = React.useState<any[]>(defaultWorkCategories);

  React.useEffect(() => {
    async function fetchTalukasAndGramPanchayats() {
      try {
        setLoading(true);
        const villages = await villageService.getAll();
        const uniqueTalukas = Array.from(
          new Map(villages.map(v => [v.block, { id: v.block, name: v.block, name_mr: v.block_mr || v.block }])).values()
        );
        setTalukas(uniqueTalukas);

        const gramPanchayatsMap: Record<string, Set<string>> = {};
        villages.forEach(village => {
          const talukaId = village.block;
          if (!gramPanchayatsMap[talukaId]) {
            gramPanchayatsMap[talukaId] = new Set();
          }
          if (village.gram_panchayat) {
            gramPanchayatsMap[talukaId].add(village.gram_panchayat);
          }
        });

        const gramPanchayatsByTalukaObj: Record<string, string[]> = {};
        Object.entries(gramPanchayatsMap).forEach(([taluka, gps]) => {
          gramPanchayatsByTalukaObj[taluka] = Array.from(gps);
        });
        setGramPanchayatsByTaluka(gramPanchayatsByTalukaObj);
      } catch (err) {
        console.error('Error fetching villages:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTalukasAndGramPanchayats();
  }, []);

  const loadWorks = async () => {
    if (selectedTaluka) {
      try {
        setLoading(true);
        // Load data from taluka tables instead of village-level data
        const data = await talukaWorkService.getByTalukaAndCategory({
          taluka_name: selectedTaluka,
          category: selectedCategory || undefined,
          work_type: activeTab,
        });
        
        // Filter by gram panchayat if selected
        const filteredWorks = selectedGramPanchayat
          ? data.filter(w => w.gram_panchayat === selectedGramPanchayat)
          : data;

        setWorks(filteredWorks || []);

      } catch (err) {
        console.error('Error loading works:', err);
        setWorks([]);
      } finally {
        setLoading(false);
      }
    } else {
      setWorks([]);  // If no taluka selected, show all works without filter
      try {
        setLoading(true);
        // Load all works of current tab type without taluka filter for initial display
        // To show all works initially, fetch works with empty taluka filter or use another method as needed
        // Here, fallback to empty so table is empty when no taluka selected
      } finally {
        setLoading(false);
      }
    }
  };

  const loadTalukaAarakhadaData = async () => {
    try {
      setLoading(true);
      // Load data directly from taluka tables
      const financial = await talukaWorkService.getByTalukaAndCategory({
        taluka_name: selectedTaluka || undefined,
        category: undefined,
        work_type: 'financial',
      });
      const physical = await talukaWorkService.getByTalukaAndCategory({
        taluka_name: selectedTaluka || undefined,
        category: undefined,
        work_type: 'physical',
      });
      
      // Apply filters
      const filteredFinancial = financial.filter(w => 
        (!selectedCategory || w.work_category === selectedCategory) &&
        (!selectedGramPanchayat || w.gram_panchayat === selectedGramPanchayat) &&
        (!selectedTaluka || w.taluka_name === selectedTaluka)
      );
      const filteredPhysical = physical.filter(w => 
        (!selectedCategory || w.work_category === selectedCategory) &&
        (!selectedGramPanchayat || w.gram_panchayat === selectedGramPanchayat) &&
        (!selectedTaluka || w.taluka_name === selectedTaluka)
      );
      
      setTalukaAarakhadaFinancial(filteredFinancial || []);
      setTalukaAarakhadaPhysical(filteredPhysical || []);
    } catch (err) {
      console.error('Error loading taluka aarakhada data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTalukaAarakhadaData();
  }, [selectedTaluka, selectedGramPanchayat, selectedCategory]);

  const totalExpenditure = works.reduce((sum, w) => sum + (w.cumulative_expenditure || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{t('taluka')}</h1>
              <p className="text-indigo-100 text-lg">
                {language === 'mr' ? 'तालुका स्तरावरील कामांचे व्यवस्थापन' : 'Taluka level work management'}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {[
          {
            icon: Building2,
            label: language === 'mr' ? 'एकूण तालुके' : 'Total Talukas',
            value: talukas.length.toString(),
            color: 'from-indigo-500 to-purple-600'
          },
          {
            icon: Building2,
            label: language === 'mr' ? 'एकूण ग्रामपंचायत' : 'Total Gram Panchayats',
            value: selectedTaluka && gramPanchayatsByTaluka[selectedTaluka]
              ? gramPanchayatsByTaluka[selectedTaluka].length.toString()
              : '0',
            color: 'from-blue-500 to-indigo-600'
          },
          {
            icon: DollarSign,
            label: language === 'mr' ? 'नोंदी' : 'Records',
            value: works.length.toString(),
            color: 'from-emerald-500 to-teal-600'
          },
          {
            icon: DollarSign,
            label: language === 'mr' ? 'एकूण खर्च' : 'Total Expenditure',
            value: `₹${(totalExpenditure / 100000).toFixed(1)}L`,
            color: 'from-orange-500 to-red-600'
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow p-2 hover:shadow-lg transition-all duration-300"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              <div className={`w-8 h-8 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-1`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-gray-800 mb-0.5">{item.value}</p>
              <p className="text-xs text-gray-600 font-bold">{item.label}</p>
            </div>
          );
        })}
      </div>
      {/* Main Content */}
      <div className="bg-white rounded-3xl shadow-xl p-4 border border-gray-100">
        {/* Tabs */}
        <div className="flex gap-0 mb-6 rounded-3xl overflow-hidden">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === 'physical'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'bg-white text-transparent relative'
            }`}
            style={{ borderRadius: 0 }}
          >
            <TrendingUp
              className={`w-5 h-5 ${
                activeTab === 'physical'
                  ? 'text-white'
                  : 'text-transparent'
              }`}
              style={{
                background: activeTab === 'physical' ? undefined : 'linear-gradient(90deg, #4F46E5, #9333EA)',
                WebkitBackgroundClip: activeTab === 'physical' ? undefined : 'text',
                backgroundClip: activeTab === 'physical' ? undefined : 'text',
              }}
            />
            <span
              className={
                activeTab === 'physical'
                  ? ''
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent'
              }
              style={activeTab === 'physical' ? undefined : { WebkitBackgroundClip: 'text' }}
            >
              {t('physical')}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === 'financial'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'bg-white text-transparent relative'
            }`}
            style={{ borderRadius: 0 }}
          >
            <DollarSign
              className={`w-5 h-5 ${
                activeTab === 'financial'
                  ? 'text-white'
                  : 'text-transparent'
              }`}
              style={{
                background: activeTab === 'financial' ? undefined : 'linear-gradient(90deg, #4F46E5, #9333EA)',
                WebkitBackgroundClip: activeTab === 'financial' ? undefined : 'text',
                backgroundClip: activeTab === 'financial' ? undefined : 'text',
              }}
            />
            <span
              className={
                activeTab === 'financial'
                  ? ''
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent'
              }
              style={activeTab === 'financial' ? undefined : { WebkitBackgroundClip: 'text' }}
            >
              {t('financial')}
            </span>
          </button>
        </div>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
          {/* Taluka Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              {language === 'mr' ? 'तालुका निवडा' : 'Select Taluka'}
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedTaluka}
                onChange={(e) => {
                  setSelectedTaluka(e.target.value);
                  setSelectedGramPanchayat('');
                  setSelectedCategory('');
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white text-sm"
              >
                <option value="">{language === 'mr' ? 'तालुका निवडा' : 'Select Taluka'}</option>
                {talukas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {language === 'mr' ? t.name_mr : t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Gram Panchayat Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              {language === 'mr' ? 'ग्रामपंचायत निवडा' : 'Select Gram Panchayat'}
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedGramPanchayat}
                onChange={(e) => setSelectedGramPanchayat(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white text-sm"
                disabled={!selectedTaluka}
              >
                <option value="">
                  {language === 'mr' ? 'ग्रामपंचायत निवडा' : 'Select Gram Panchayat'}
                </option>
                {(gramPanchayatsByTaluka[selectedTaluka] || []).map((gp) => (
                  <option key={gp} value={gp}>
                    {gp}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              {t('workCategory')}
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'A' | 'B' | 'C' | 'D' | '')}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white text-sm"
              >
                <option value="">{t('selectCategory') || 'Select Category'}</option>
                {workCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {language === 'mr' ? c.name_mr : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Table */}
        <AarakhadaTalukaTable
          works={activeTab === 'financial' ? talukaAarakhadaFinancial : talukaAarakhadaPhysical}
          workType={activeTab}
          loading={loading}
        />
      </div>
    </div>
  );
}
