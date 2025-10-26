import React from 'react';
import { Building2, Users, Target, DollarSign, TrendingUp, Filter, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AarakhadaDistrictTable } from './AarakhadaDistrictTable';
import { villageService, districtWorkService, pesaSupabase, workService } from '../../utils/supabase';
import * as XLSX from 'xlsx';
import PesaLogo from '../../assets/pesaLogo.png';

export function District() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<'financial' | 'physical'>('physical');
  const [selectedTaluka, setSelectedTaluka] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<'A' | 'B' | 'C' | 'D' | ''>('');
  const [works, setWorks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [districts, setDistricts] = React.useState<any[]>([]);
  const [talukas, setTalukas] = React.useState<any[]>([]);
  const [villagesByTaluka, setVillagesByTaluka] = React.useState<Record<string, any[]>>({});

  const defaultWorkCategories = [
    { id: 'A', name: 'Category A - Infrastructure', name_mr: 'प्रकार अ - पायाभूत सुविधा' },
    { id: 'B', name: 'Category B - Social Development', name_mr: 'प्रकार ब - सामाजिक विकास' },
    { id: 'C', name: 'Category C - Economic Development', name_mr: 'प्रकार क - आर्थिक विकास' },
    { id: 'D', name: 'Category D - Environmental', name_mr: 'प्रकार ड - पर्यावरण' },
  ];
  const [workCategories, setWorkCategories] = React.useState<any[]>(defaultWorkCategories);

  const loadWorks = async () => {
    setLoading(true);
    try {
      let query = pesaSupabase
        .from(activeTab === 'financial' ? 'district_aarakhada_financial' : 'district_aarakhada_physical')
        .select('*');

      if (selectedDistrict) query = query.eq('district_name', selectedDistrict);
      if (selectedTaluka) query = query.eq('taluka_name', selectedTaluka);
      if (selectedCategory) query = query.eq('work_category', selectedCategory);

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

  const handleDownloadExcel = async () => {
    debugger
    // Utility
    const parseNumeric = (val) => val == null ? 0 : Number(String(val).replace(/[^\d.-]/g, "")) || 0;

    // Define columns for sheet export
    const financialColumns = [
      'Sr. No',
      'District Name',
      'Taluka Name',
      'Work Category',
      'PESA Gram Panchayat Count',
      'PESA Village Count',
      'Annual Approved Fund',
      'Annual Received Fund',
      'Received Interest',
      'Total Received Fund',
      'Previous Expenditure',
      'Current Expenditure',
      'Cumulative Expenditure',
      'Remaining Funds'
    ];
    const physicalColumns = [
      'Sr. No',
      'District Name',
      'Taluka Name',
      'Work Category',
      'PESA Gram Panchayat Count',
      'PESA Village Count',
      'Sanctioned Works',
      'Approved Works',
      'Completed Works',
      'Ongoing Works',
      'Pending Works'
    ];

    // Fetch financial summary directly
    let financialQuery = pesaSupabase
      .from('district_aarakhada_financial')
      .select('*');
    if (selectedDistrict) financialQuery = financialQuery.eq('district_name', selectedDistrict);
    if (selectedTaluka) financialQuery = financialQuery.eq('taluka_name', selectedTaluka);
    if (selectedCategory) financialQuery = financialQuery.eq('work_category', selectedCategory);
    const { data: financialWorks, error: financialError } = await financialQuery;
    if (financialError) {
      alert('Failed to fetch financial summary');
      return;
    }

    // Fetch physical summary directly
    let physicalQuery = pesaSupabase
      .from('district_aarakhada_physical')
      .select('*');
    if (selectedDistrict) physicalQuery = physicalQuery.eq('district_name', selectedDistrict);
    if (selectedTaluka) physicalQuery = physicalQuery.eq('taluka_name', selectedTaluka);
    if (selectedCategory) physicalQuery = physicalQuery.eq('work_category', selectedCategory);
    const { data: physicalWorks, error: physicalError } = await physicalQuery;
    if (physicalError) {
      alert('Failed to fetch physical summary');
      return;
    }

    // Prepare sheet rows
    const financialSheetRows = (financialWorks || []).map((w, i) => [
      i + 1,
      w.district_name || '',
      w.taluka_name || '',
      w.work_category || '',
      parseNumeric(w.pesa_gram_panchayat_count),
      parseNumeric(w.pesa_village_count),
      parseNumeric(w.annual_approved_fund),
      parseNumeric(w.annual_received_fund),
      parseNumeric(w.received_interest),
      parseNumeric(w.total_received_fund),
      parseNumeric(w.previous_expenditure),
      parseNumeric(w.current_expenditure),
      parseNumeric(w.cumulative_expenditure),
      parseNumeric(w.remaining_funds)
    ]);

    const physicalSheetRows = (physicalWorks || []).map((w, i) => [
      i + 1,
      w.district_name || '',
      w.taluka_name || '',
      w.work_category || '',
      parseNumeric(w.pesa_gram_panchayat_count),
      parseNumeric(w.pesa_village_count),
      parseNumeric(w.sanctioned_works),
      parseNumeric(w.approved_works),
      parseNumeric(w.completed_works),
      parseNumeric(w.ongoing_works),
      parseNumeric(w.pending_works)
    ]);

    // Export
    const wb = XLSX.utils.book_new();
    const wsPhysical = XLSX.utils.aoa_to_sheet([physicalColumns, ...physicalSheetRows]);
    XLSX.utils.book_append_sheet(wb, wsPhysical, 'Physical Works');
    const wsFinancial = XLSX.utils.aoa_to_sheet([financialColumns, ...financialSheetRows]);
    XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financial Works');
    XLSX.writeFile(wb, 'district_work_data.xlsx');
  };


  React.useEffect(() => {
    const fetchVillagesAndBuildFilters = async () => {
      try {
        const villages = await villageService.getAll();
        const uniqueDistricts = Array.from(
          new Map(
            villages.map(v => [
              v.district,
              { id: v.district, name: v.district, name_mr: v.district_mr || v.district },
            ])
          ).values()
        );
        setDistricts(uniqueDistricts);
        const uniqueTalukas = Array.from(
          new Map(
            villages.map(v => [v.block, { id: v.block, name: v.block, name_mr: v.block_mr || v.block }])
          ).values()
        );
        setTalukas(uniqueTalukas);
        const villagesByTalukaMap: Record<string, any[]> = {};
        villages.forEach(village => {
          const talukaId = village.block;
          if (!villagesByTalukaMap[talukaId]) villagesByTalukaMap[talukaId] = [];
          villagesByTalukaMap[talukaId].push({
            id: village.id,
            name: village.village_name,
            name_mr: village.village_name_mr || village.village_name,
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
  }, [selectedDistrict, selectedTaluka, selectedCategory, activeTab, language]);

  const isNoVillages = !Object.keys(villagesByTaluka).length;

  const totalWorks = isNoVillages ? 0 : works.reduce((sum, work) => sum + (work.sanctioned_works || 0), 0);
  const totalExpenditure = isNoVillages
    ? 0
    : works.reduce((sum, work) => sum + (work.remaining_funds || 0), 0);

  // Financial summaries - updated as per your request
  const totalAnnualApprovedFund = works.reduce((sum, w) => sum + (Number(w.annual_approved_fund) || 0), 0);
  const totalAnnualReceivedFund = works.reduce((sum, w) => sum + (Number(w.annual_received_fund) || 0), 0);
  const totalReceivedInterest = works.reduce((sum, w) => sum + (Number(w.received_interest) || 0), 0);
  const totalRemaining = works.reduce((sum, w) => sum + (Number(w.remaining_funds) || 0), 0);

  // Physical summaries
  const totalSanctionedWorks = works.reduce((sum, w) => sum + (w.sanctioned_works || 0), 0);
  const totalCompletedWorks = works.reduce((sum, w) => sum + (w.completed_works || 0), 0);
  const totalOngoingWorks = works.reduce((sum, w) => sum + (w.ongoing_works || 0), 0);
  const totalPendingWorks = works.reduce((sum, w) => sum + (w.pending_works || 0), 0);

  const labelColorsMap = {
    'from-purple-500 to-indigo-600': 'text-indigo-600',
    'from-emerald-500 to-teal-600': 'text-emerald-600',
    'from-orange-500 to-red-600': 'text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-transparent flex items-center justify-center">
              <img
                src={PesaLogo}
                alt="Pesa Logo"
                className="w-full h-full object-contain rounded shadow"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                {language === 'mr' ? 'जिल्हा' : 'District'}
              </h1>
              <p className="text-purple-100 text-lg">
                {language === 'mr'
                  ? 'जिल्हा स्तरावरील कामांचे व्यवस्थापन'
                  : 'District level work management'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="bg-white text-purple-600 px-6 py-3 rounded-2xl hover:bg-purple-50 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium shadow-lg"
            title={'Download Excel'}
          >
            <Download className="w-5 h-5" />
            Download Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
        {[
          {
            icon: Building2,
            label: language === 'mr' ? 'एकूण तालुके' : 'Total Talukas',
            value: talukas.length.toString(),
            color: 'from-purple-500 to-indigo-600',
          },
          {
            icon: Target,
            label: language === 'mr' ? 'एकूण कामे' : 'Total Works',
            value: totalWorks.toString(),
            color: 'from-emerald-500 to-teal-600',
          },
          {
            icon: DollarSign,
            label: language === 'mr' ? 'एकूण खर्च' : 'Total Expenditure',
            value: `₹${(totalExpenditure / 100000).toFixed(1)}L`,
            color: 'from-orange-500 to-red-600',
          },
        ].map((item, index) => {
          const Icon = item.icon;
          const labelColorClass = labelColorsMap[item.color] || 'text-gray-600';
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow flex items-center justify-between p-4 hover:shadow-lg transition-all duration-300 card-tribal"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              <div className="flex flex-col text-left">
                <span className="text-2xl font-bold text-gray-800 mb-0.5">{item.value}</span>
                <span className={`text-xs font-bold ${labelColorClass}`}>{item.label}</span>
              </div>
              <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center ml-2 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
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
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'physical'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg'
              : 'bg-white text-transparent relative'
              }`}
            style={{ borderRadius: 0 }}
          >
            <TrendingUp
              className={`w-5 h-5 ${activeTab === 'physical' ? 'text-white' : 'text-transparent'}`}
              style={{
                background:
                  activeTab === 'physical' ? undefined : 'linear-gradient(90deg, #8B5CF6, #4F46E5)',
                WebkitBackgroundClip: activeTab === 'physical' ? undefined : 'text',
              }}
            />
            <span
              className={
                activeTab === 'physical'
                  ? ''
                  : 'bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent'
              }
            >
              {t('physical')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'financial'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg'
              : 'bg-white text-transparent relative'
              }`}
            style={{ borderRadius: 0 }}
          >
            <DollarSign
              className={`w-5 h-5 ${activeTab === 'financial' ? 'text-white' : 'text-transparent'}`}
              style={{
                background:
                  activeTab === 'financial' ? undefined : 'linear-gradient(90deg, #8B5CF6, #4F46E5)',
                WebkitBackgroundClip: activeTab === 'financial' ? undefined : 'text',
              }}
            />
            <span
              className={
                activeTab === 'financial'
                  ? ''
                  : 'bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent'
              }
            >
              {t('financial')}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              {language === 'mr' ? 'तालुका निवडा' : 'Select Taluka'}
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedTaluka}
                onChange={e => {
                  setSelectedTaluka(e.target.value);
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
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">{t('workCategory')}</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {(activeTab === 'financial'
            ? [
              {
                label: language === 'mr' ? 'वार्षिक मंजूर निधी (₹)' : 'Annual Approved Fund (₹)',
                value: `₹${totalAnnualApprovedFund.toLocaleString()}`,
                color: 'from-purple-600 to-indigo-700',
                icon: Building2,
              },
              {
                label: language === 'mr' ? 'वार्षिक प्राप्त निधी (₹)' : 'Annual Received Fund (₹)',
                value: `₹${totalAnnualReceivedFund.toLocaleString()}`,
                color: 'from-indigo-600 to-purple-700',
                icon: DollarSign,
              },
              {
                label: language === 'mr' ? 'प्राप्त व्याज (₹)' : 'Received Interest (₹)',
                value: `₹${totalReceivedInterest.toLocaleString()}`,
                color: 'from-emerald-500 to-teal-600',
                icon: TrendingUp,
              },
              {
                label: language === 'mr' ? 'उर्वरित निधी (₹)' : 'Remaining Funds (₹)',
                value: `₹${totalRemaining.toLocaleString()}`,
                color: 'from-red-500 to-pink-600',
                icon: DollarSign,
              },
            ]
            : [
              { label: language === 'mr' ? 'एकूण मंजूर कामे' : 'Total Sanctioned Works', value: totalSanctionedWorks.toString(), color: 'from-purple-600 to-indigo-700', icon: Building2 },
              { label: language === 'mr' ? 'पूर्ण झालेली कामे' : 'Total Completed Works', value: totalCompletedWorks.toString(), color: 'from-emerald-500 to-teal-600', icon: Target },
              { label: language === 'mr' ? 'चालू कामे' : 'Ongoing Works', value: totalOngoingWorks.toString(), color: 'from-yellow-500 to-orange-600', icon: TrendingUp },
              { label: language === 'mr' ? 'प्रलंबित कामे' : 'Pending Works', value: totalPendingWorks.toString(), color: 'from-blue-500 to-indigo-600', icon: Filter },
            ]
          ).map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition duration-300 flex items-center gap-4 flex-1 min-w-[160px]">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 mb-1">{item.value}</p>
                  <p className="text-xs text-gray-600 font-bold">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <AarakhadaDistrictTable works={works} workType={activeTab} loading={loading} />
      </div>
    </div>
  );
}
