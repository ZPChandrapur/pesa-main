import React from 'react';
import { Building2, Users, Target, DollarSign, TrendingUp, Filter } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AarakhadaDistrictTable } from './AarakhadaDistrictTable';
import { villageService, districtWorkService, pesaSupabase } from '../../utils/supabase';
export function District() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<'financial' | 'physical'>('physical');
  const [selectedTaluka, setSelectedTaluka] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState('');
  const [selectedVillage, setSelectedVillage] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<'A' | 'B' | 'C' | 'D' | ''>('');
  const [works, setWorks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [districts, setDistricts] = React.useState<any[]>([]);
  const [talukas, setTalukas] = React.useState<any[]>([]);
  const [villagesByTaluka, setVillagesByTaluka] = React.useState<Record<string, any[]>>({});
  const defaultWorkCategories = [
  { id: 'A', name: 'Category A - Basic Infrastructure', name_mr: 'प्रकार अ - पायाभूत सुविधा' },
  { id: 'B', name: 'Category B - Implementation of FRA & PESA Acts', name_mr: 'प्रकार ब - वन हक्क अधिनियम (FRA) व पेसा (PESA) कायद्याची अंमलबजावणी' },
  { id: 'C', name: 'Category C - Health, Sanitation & Education', name_mr: 'प्रकार क - आरोग्य, स्वच्छता, शिक्षण' },
  { id: 'D', name: 'Category D - Afforestation, Wildlife Conservation & Livelihood', name_mr: 'प्रकार ड - वनीकरण, वन्यजीव संवर्धन, जलसंधारण, वनतळी, वन्यजीव पर्यटन व वन उपजिविका' },
];
  const [workCategories, setWorkCategories] = React.useState<any[]>(defaultWorkCategories);
  const availableVillages = selectedTaluka ? (villagesByTaluka[selectedTaluka] || []) : [];
  const loadWorks = async () => {
    setLoading(true);
    try {
      // Load all district data by default, filter by selected district if provided
      let query = pesaSupabase.from(activeTab === 'financial' ? 'district_aarakhada_financial' : 'district_aarakhada_physical').select('*');
      
      if (selectedDistrict) {
        query = query.eq('district_name', selectedDistrict);
      }
      if (selectedCategory) {
        query = query.eq('work_category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setWorks(data || []);
    } catch (err) {
      console.error('Failed to load works:', err);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    // Fetch villages and build filters
    const fetchVillagesAndBuildFilters = async () => {
      try {
        // Fetch all villages from Supabase
        const villages = await villageService.getAll();
        
        // Extract unique districts
        const uniqueDistricts = Array.from(
          new Map(villages.map(v => [v.district, { id: v.district, name: v.district, name_mr: v.district_mr || v.district }])).values()
        );
        setDistricts(uniqueDistricts);
        
        // Extract unique talukas
        const uniqueTalukas = Array.from(
          new Map(villages.map(v => [v.block, { id: v.block, name: v.block, name_mr: v.block_mr || v.block }])).values()
        );
        setTalukas(uniqueTalukas);
        
        // Group villages by taluka
        const villagesByTalukaMap: Record<string, any[]> = {};
        villages.forEach(village => {
          const talukaId = village.block;
          if (!villagesByTalukaMap[talukaId]) {
            villagesByTalukaMap[talukaId] = [];
          }
          villagesByTalukaMap[talukaId].push({
            id: village.id,
            name: village.village_name,
            name_mr: village.village_name_mr || village.village_name
          });
        });
        setVillagesByTaluka(villagesByTalukaMap);
      } catch (err) {
        console.error('Error fetching villages:', err);
      }
    };
    fetchVillagesAndBuildFilters();
  }, [language]);
  React.useEffect(() => {
    loadWorks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, selectedCategory, activeTab, language]);
  const totalWorks = works.reduce((sum, work) => sum + (work.approved_works || 0), 0);
  const totalExpenditure = works.reduce((sum, work) => sum + (work.remaining_funds || 0), 0);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  {language === 'mr' ? 'जिल्हा' : 'District'}
                </h1>
                <p className="text-purple-100 text-lg">
                  {language === 'mr' 
                    ? 'जिल्हा स्तरावरील कामांचे व्यवस्थापन'
                    : 'District level work management'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
     {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {[
          { icon: Building2, label: language === 'mr' ? 'एकूण जिल्हे' : 'Total Districts', value: districts.length.toString(), color: 'from-purple-500 to-indigo-600' },
          { icon: Building2, label: language === 'mr' ? 'एकूण तालुके' : 'Total Talukas', value: talukas.length.toString(), color: 'from-purple-500 to-indigo-600' },
          { icon: Target, label: language === 'mr' ? 'एकूण कामे' : 'Total Works', value: totalWorks.toString(), color: 'from-emerald-500 to-teal-600' },
          { icon: DollarSign, label: language === 'mr' ? 'एकूण खर्च' : 'Total Expenditure', value: `₹${(totalExpenditure / 100000).toFixed(1)}L`, color: 'from-orange-500 to-red-600' }
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
        {/* Financial/Physical Tabs */}
        <div className="flex gap-0 mb-6 rounded-3xl overflow-hidden">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === 'physical'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg'
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
                background: activeTab === 'physical' ? undefined : 'linear-gradient(90deg, #8B5CF6, #4F46E5)',
                WebkitBackgroundClip: activeTab === 'physical' ? undefined : 'text',
                backgroundClip: activeTab === 'physical' ? undefined : 'text',
              }}
            />
            <span
              className={
                activeTab === 'physical'
                  ? ''
                  : 'bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent'
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
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg'
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
                background: activeTab === 'financial' ? undefined : 'linear-gradient(90deg, #8B5CF6, #4F46E5)',
                WebkitBackgroundClip: activeTab === 'financial' ? undefined : 'text',
                backgroundClip: activeTab === 'financial' ? undefined : 'text',
              }}
            />
            <span
              className={
                activeTab === 'financial'
                  ? ''
                  : 'bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent'
              }
              style={activeTab === 'financial' ? undefined : { WebkitBackgroundClip: 'text' }}
            >
              {t('financial')}
            </span>
          </button>
        </div>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
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
                  setSelectedVillage('');
                  setSelectedCategory('');
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white text-sm"
              >
                <option value="">{language === 'mr' ? 'तालुका निवडा' : 'Select Taluka'}</option>
                {talukas.map(taluka => (
                  <option key={taluka.id} value={taluka.id}>
                    {language === 'mr' ? taluka.name_mr : taluka.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Village Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              {language === 'mr' ? 'गाव निवडा' : 'Select Village'}
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedVillage}
                onChange={(e) => {
                  setSelectedVillage(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white text-sm"
                disabled={!selectedTaluka}
              >
                <option value="">{t('selectVillage')}</option>
                {availableVillages.map(village => (
                  <option key={village.id} value={village.id}>
                    {language === 'mr' ? village.name_mr : village.name}
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
                onChange={e => setSelectedCategory(e.target.value as 'A' | 'B' | 'C' | 'D' | '')}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white text-sm"
              >
                <option value="">{t('selectCategory') || 'Select Category'}</option>
                {workCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {language === 'mr' ? category.name_mr : category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Table */}
        <AarakhadaDistrictTable 
          works={works}
          workType={activeTab}
          loading={loading}
        />
      </div>
    </div>
  );
}
