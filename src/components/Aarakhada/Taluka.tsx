import React from 'react';
import { Building2, Filter, DollarSign, TrendingUp, Target, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AarakhadaTalukaTable } from './AarakhadaTalukaTable';
import { villageService, talukaWorkService } from '../../utils/supabase';
import * as XLSX from 'xlsx';

interface TalukaProps {
  userId?: string;
  roleName?: string;
}

export function Taluka({ userId, roleName }: TalukaProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<'financial' | 'physical'>('physical');
  const [selectedTaluka, setSelectedTaluka] = React.useState('');
  const [selectedGramPanchayat, setSelectedGramPanchayat] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<'A' | 'B' | 'C' | 'D' | ''>('');
  const [works, setWorks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [talukas, setTalukas] = React.useState<any[]>([]);
  const [villages, setVillages] = React.useState<any[]>([]);
  const [gramPanchayatsByTaluka, setGramPanchayatsByTaluka] = React.useState<Record<string, string[]>>({});
  const [talukaAarakhadaFinancial, setTalukaAarakhadaFinancial] = React.useState<any[]>([]);
  const [talukaAarakhadaPhysical, setTalukaAarakhadaPhysical] = React.useState<any[]>([]);

  const defaultWorkCategories = [
    { id: 'A', name: 'Category A - Infrastructure', name_mr: 'प्रकार अ - पायाभूत सुविधा' },
    { id: 'B', name: 'Category B - Social Development', name_mr: 'प्रकार ब - सामाजिक विकास' },
    { id: 'C', name: 'Category C - Economic Development', name_mr: 'प्रकार क - आर्थिक विकास' },
    { id: 'D', name: 'Category D - Environmental', name_mr: 'प्रकार ड - पर्यावरण' },
  ];
  const [workCategories, setWorkCategories] = React.useState<any[]>(defaultWorkCategories);

  React.useEffect(() => {
    async function fetchTalukasAndGramPanchayats() {
      try {
        setLoading(true);
        let data = await villageService.getAll();

        if (roleName?.trim().toLowerCase() !== 'district' && userId) {
          data = data.filter(
            (v: any) => v.tal_user_access === userId || v.gram_user_access === userId
          );
        }
        setVillages(data);

        const uniqueTalukas = Array.from(
          new Map(data.map(v => [v.block, { id: v.block, name: v.block, name_mr: v.block_mr || v.block }])).values()
        );
        setTalukas(uniqueTalukas);

        const gramPanchayatsMap: Record<string, Set<string>> = {};
        data.forEach(village => {
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
  }, [userId]);

 const handleDownloadExcel = () => {
  const accessibleGramPanchayats = new Set(villages.map(v => v.gram_panchayat));
  const accessibleCategories = new Set(
    [...talukaAarakhadaFinancial, ...talukaAarakhadaPhysical].map(w => w.work_category)
  );

  const allWorks = [...talukaAarakhadaFinancial, ...talukaAarakhadaPhysical];

  const filteredWorks = allWorks.filter(
    w =>
      accessibleGramPanchayats.has(w.gram_panchayat) &&
      accessibleCategories.has(w.work_category)
  );

  if (!filteredWorks.length) {
    alert('No data available to download');
    return;
  }

  const filteredFinancial = filteredWorks.filter(w => w.work_type === 'financial');
  const filteredPhysical = filteredWorks.filter(w => w.work_type === 'physical');

  const financialColumns = [
    'Sr. No',
    'Gram Panchayat',
    'Work Category',
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
    'Gram Panchayat',
    'Work Category',
    'PESA Village Count',
    'Sanctioned Works',
    'Completed Works',
    'Ongoing Works',
    'Pending Works'
  ];

  const mapFinancialRows = (data: any[]) =>
    data.map((w, i) => [
      i + 1,
      w.gram_panchayat || '',
      w.work_category || '',
      w.pesa_village_count || 0,
      Number(w.annual_approved_fund) || 0,
      Number(w.annual_received_fund) || 0,
      Number(w.received_interest) || 0,
      Number(w.total_received_fund) || 0,
      Number(w.previous_expenditure) || 0,
      Number(w.current_expenditure) || 0,
      Number(w.cumulative_expenditure) || 0,
      Number(w.remaining_funds) || 0
    ]);

  const mapPhysicalRows = (data: any[]) =>
    data.map((w, i) => [
      i + 1,
      w.gram_panchayat || '',
      w.work_category || '',
      w.pesa_village_count || 0,
      Number(w.sanctioned_works) || 0,
      Number(w.completed_works) || 0,
      Number(w.ongoing_works) || 0,
      Number(w.pending_works) || 0
    ]);

  const wb = XLSX.utils.book_new();

  if (filteredPhysical.length) {
    const wsPhysical = XLSX.utils.aoa_to_sheet([
      physicalColumns,
      ...mapPhysicalRows(filteredPhysical),
    ]);
    XLSX.utils.book_append_sheet(wb, wsPhysical, 'Physical Works');
  }

  if (filteredFinancial.length) {
    const wsFinancial = XLSX.utils.aoa_to_sheet([
      financialColumns,
      ...mapFinancialRows(filteredFinancial),
    ]);
    XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financial Works');
  }

  XLSX.writeFile(wb, 'taluka_filtered_work_data.xlsx');
};

  const loadTalukaAarakhadaData = async () => {
    try {
      setLoading(true);
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

  const activeFilteredData =
    activeTab === 'financial' ? talukaAarakhadaFinancial : talukaAarakhadaPhysical;

  const isNoVillages = !villages || villages.length === 0;

  const accessibleGramPanchayats = new Set(villages.map(v => v.gram_panchayat));

  const filteredActiveData = activeFilteredData.filter(w =>
    accessibleGramPanchayats.has(w.gram_panchayat)
  );
  console.log("filteredActiveData",filteredActiveData)

  const totalGramPanchayatCount = isNoVillages
    ? 0
    : new Set(filteredActiveData.map(w => w.gram_panchayat)).size;

  const totalWorks = isNoVillages
    ? 0
    : (activeTab === 'physical'
      ? filteredActiveData.reduce((sum, w) => sum + (w.sanctioned_works || 0), 0)
      : 0);

  const totalExpenditure = isNoVillages
    ? 0
    : (activeTab === 'financial'
      ? filteredActiveData.reduce((sum, w) => sum + (w.cumulative_expenditure || 0), 0)
      : 0);

  // Financial card summaries
  const totalAnnualFund = filteredActiveData.reduce((sum, w) => sum + (Number(w.annual_received_fund) || 0), 0);
  const totalTillLastMonth = filteredActiveData.reduce((sum, w) => sum + (Number(w.expenditure_till_last_month) || 0), 0);
  const totalCurrentMonth = filteredActiveData.reduce((sum, w) => sum + (Number(w.current_month_expenditure) || 0), 0);
  const totalCumulative = filteredActiveData.reduce((sum, w) => sum + (Number(w.cumulative_expenditure) || 0), 0);
  const totalRemaining = filteredActiveData.reduce((sum, w) => sum + (Number(w.remaining_fund) || 0), 0);

  // Physical card summaries
  const totalSanctionedWorks = filteredActiveData.reduce((sum, w) => sum + (w.sanctioned_works || 0), 0);
  const totalCompletedWorks = filteredActiveData.reduce((sum, w) => sum + (w.completed_works || 0), 0);
  const totalOngoingWorks = filteredActiveData.reduce((sum, w) => sum + (w.ongoing_works || 0), 0);
  const totalPendingWorks = filteredActiveData.reduce((sum, w) => sum + (w.pending_works || 0), 0);

  React.useEffect(() => {
    loadTalukaAarakhadaData();
  }, [selectedTaluka, selectedGramPanchayat, selectedCategory]);

  React.useEffect(() => {
    if (activeTab === 'financial') {
      setWorks(talukaAarakhadaFinancial);
    } else {
      setWorks(talukaAarakhadaPhysical);
    }
  }, [activeTab, talukaAarakhadaFinancial, talukaAarakhadaPhysical]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
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
          <button
            onClick={handleDownloadExcel}
            className="bg-white text-indigo-600 px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium shadow-lg"
            {'Download Excel'}
          >
            <Download className="w-5 h-5" />
            Download Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-3 gap-3">
        {[
          {
            icon: Building2,
            label: language === 'mr' ? 'एकूण ग्रामपंचायत' : 'Total Gram Panchayats',
            value: totalGramPanchayatCount.toString(),
            color: 'from-blue-500 to-indigo-600'
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
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'physical'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
              : 'bg-white text-transparent relative'
              }`}
            style={{ borderRadius: 0 }}
          >
            <TrendingUp
              className={`w-5 h-5 ${activeTab === 'physical'
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
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'financial'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
              : 'bg-white text-transparent relative'
              }`}
            style={{ borderRadius: 0 }}
          >
            <DollarSign
              className={`w-5 h-5 ${activeTab === 'financial'
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

        {/* Summary Cards for both tabs */}
        {activeTab === 'financial' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
            {[
              {
                label: language === 'mr' ? 'वार्षिक प्राप्त निधी (₹)' : 'Annual Received Fund (₹)',
                value: `₹${totalAnnualFund.toLocaleString()}`,
                color: 'from-indigo-500 to-purple-600',
                icon: DollarSign,
              },
              {
                label: language === 'mr' ? 'मागील महिन्यापर्यंतचा खर्च (₹)' : 'Expenditure Till Last Month (₹)',
                value: `₹${totalTillLastMonth.toLocaleString()}`,
                color: 'from-emerald-500 to-teal-600',
                icon: Target,
              },
              {
                label: language === 'mr' ? 'चालू महिन्याचा खर्च (₹)' : 'Current Month Expenditure (₹)',
                value: `₹${totalCurrentMonth.toLocaleString()}`,
                color: 'from-yellow-500 to-orange-600',
                icon: TrendingUp,
              },
              {
                label: language === 'mr' ? 'एकूण खर्च (₹)' : 'Cumulative Expenditure (₹)',
                value: `₹${totalCumulative.toLocaleString()}`,
                color: 'from-blue-500 to-indigo-600',
                icon: Building2,
              },
              {
                label: language === 'mr' ? 'उर्वरित निधी (₹)' : 'Remaining Funds (₹)',
                value: `₹${totalRemaining.toLocaleString()}`,
                color: 'from-red-500 to-pink-600',
                icon: DollarSign,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-all duration-300 flex items-center gap-4"
                >
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-4 gap-2 mb-6">
            {[
              {
                label: language === 'mr' ? 'एकूण मंजूर कामे' : 'Total Sanctioned Works',
                value: totalSanctionedWorks.toString(),
                color: 'from-indigo-500 to-purple-600',
                icon: Building2,
              },
              {
                label: language === 'mr' ? 'पूर्ण झालेली कामे' : 'Total Completed Works',
                value: totalCompletedWorks.toString(),
                color: 'from-emerald-500 to-teal-600',
                icon: Target,
              },
              {
                label: language === 'mr' ? 'चालू कामे' : 'Ongoing Works',
                value: totalOngoingWorks.toString(),
                color: 'from-yellow-500 to-orange-600',
                icon: TrendingUp,
              },
              {
                label: language === 'mr' ? 'प्रलंबित कामे' : 'Pending Works',
                value: totalPendingWorks.toString(),
                color: 'from-blue-500 to-indigo-600',
                icon: Filter,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-all duration-300 flex items-center gap-4"
                >
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
        )}

        {/* Table */}
        <AarakhadaTalukaTable
          works={works}
          workType={activeTab}
          loading={loading}
          userId={userId}
          roleName={roleName}
          allowedGramPanchayats={villages.map(v => v.gram_panchayat)}
        />
      </div>
    </div>
  );
}
