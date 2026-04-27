import React, { useState, useEffect } from 'react';
import { Building2, Filter, DollarSign, TrendingUp as TrendingUpIcon, Download, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useYear, YEAR_OPTIONS } from '../../context/YearContext';
import { AarakhadaWorkForm } from './AarakhadaWorkForm';
import { AarakhadaTable } from './AarakhadaTable';
import { AarakhadaWork } from '../../types';
import { villageService, workService, pesaWorkOperations } from '../../utils/supabase';
import * as XLSX from 'xlsx';
import PesaLogo from '../../assets/pesaLogo.png';
import { handleDownloadGrampanchayatFinancialExcel } from './DownloadGrampanchayatFinancialReport';
import { handleDownloadGrampanchayatPdf } from './DownloadGrampanchayatPdf';

interface GramPanchayatProps {
  userId?: string;
  roleName?: string;
}

export function GramPanchayat({ userId, roleName }: GramPanchayatProps) {
  const { t, language } = useLanguage();
  const { selectedYear } = useYear();
  const [activeTab, setActiveTab] = useState<'financial' | 'physical'>('physical');
  const [selectedGramPanchayat, setSelectedGramPanchayat] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedTaluka, setSelectedTaluka] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'A' | 'B' | 'C' | 'D' | ''>('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [villages, setVillages] = useState<any[]>([]);
  const [allWorks, setAllWorks] = useState<AarakhadaWork[]>([]);
  const [works, setWorks] = useState<AarakhadaWork[]>([]);
  const [loading, setLoading] = useState(false);
  const [workNamesMap, setWorkNamesMap] = useState<Record<string, Record<string, string[]>>>({});
  const [editingWork, setEditingWork] = useState<AarakhadaWork | null>(null);
  const [viewMode, setViewMode] = useState(false);

  const workCategories = [
    { id: 'A', name: 'Category A - Infrastructure', name_mr: 'प्रकार अ - पायाभूत सुविधा' },
    { id: 'B', name: 'Category B - Forest Rights Act (FRA) and PESA Implementation', name_mr: 'प्रकार ब - वनहक्क अधिनियम (FRA) व पेसा अंमलबजावणी' },
    { id: 'C', name: 'Category C - Health, Sanitation, and Education', name_mr: 'प्रकार क - आरोग्य, स्वच्छता व शिक्षण' },
    { id: 'D', name: 'Category D - Afforestation, Wildlife Conservation, Water Conservation, Forest Ponds, Wildlife Tourism, and Forest Livelihood', name_mr: 'प्रकार ड - वनीकरण, वन्यजीव संवर्धन, जलसंधारण, वनतळी, वन्यजीव पर्यटन व वन उपजिविका' },
  ];

  const uniqueTalukas = Array.from(
    new Set(allWorks.map(w => w.taluka).filter(Boolean))
  ) as string[];

  const getMonthYear = (dateStr: string) => {
    if (!dateStr) return '';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (dateStr.includes('-')) return dateStr;
    if (months.includes(dateStr)) return dateStr;
    return dateStr;
  };

  const uniqueMonthYearList = Array.from(
    new Set(
      allWorks
        .map(w => w.added_month ? getMonthYear(w.added_month) : '')
        .filter(Boolean)
    )
  );

  useEffect(() => {
    loadVillages();
    loadAllWorks();
  }, []);

  useEffect(() => {
    filterWorks();
  }, [allWorks, activeTab, selectedTaluka, selectedGramPanchayat, selectedVillage, selectedCategory, selectedYear, selectedMonth]);

    const handleDownloadExcel = async () => {
      if (activeTab === 'financial') {
        await handleDownloadGrampanchayatFinancialExcel({
          selectedTaluka,
          selectedGramPanchayat,
          selectedCategory,
          language: language as 'en' | 'mr',
        });
      }
    };

    const handleDownloadPdf = async () => {
      await handleDownloadGrampanchayatPdf({
        selectedTaluka,
        selectedGramPanchayat,
        selectedCategory,
        language: language as 'en' | 'mr',
        activeTab,
      });
    };

  const loadVillages = async () => {
    try {
      let data = await villageService.getAll();
      // Only filter by userId if not a district-level role
      if (!['district', 'developer', 'super_admin', 'admin'].includes(roleName?.trim().toLowerCase()) && userId) {
        data = data.filter(
          (v: any) => v.tal_user_access === userId || v.gram_user_access === userId
        );
      }
      setVillages(data);
    } catch (error) {
      console.error('Error loading villages:', error);
    }
  };


  const loadAllWorks = async () => {
    try {
      setLoading(true);
      const allWorksData = await workService.getAll();
      setAllWorks(allWorksData);
    } catch (error) {
      console.error('Error loading works:', error);
      setAllWorks([]);
    } finally {
      setLoading(false);
    }
  };

  const filterWorks = () => {
    let filtered = [...allWorks];
    if (activeTab === 'physical') filtered = filtered.filter(w => w.work_type === 'physical');
    else if (activeTab === 'financial') filtered = filtered.filter(w => w.work_type === 'financial');
    if (selectedTaluka)
      filtered = filtered.filter(
        w =>
          (w.taluka ?? '').trim().toLowerCase() ===
          selectedTaluka.trim().toLowerCase()
      );
    if (selectedGramPanchayat) filtered = filtered.filter(w => w.gram_panchayat === selectedGramPanchayat);
    if (selectedVillage) filtered = filtered.filter(w => w.village_id === selectedVillage);
    if (selectedCategory) filtered = filtered.filter(w => w.work_category === selectedCategory);
    if (selectedYear) filtered = filtered.filter(w => w.year === selectedYear);
    if (selectedMonth) filtered = filtered.filter(w => getMonthYear(w.added_month) === selectedMonth);

    setWorks(filtered);
  };

  const handleSaveWork = async (
    workData: Omit<AarakhadaWork, 'created_at' | 'updated_at'> & { id?: string }
  ) => {
    try {
      if (workData.id) await workService.update(workData.id, workData);
      else await workService.insert(workData);

      setShowForm(false);
      setEditingWork(null);
      setViewMode(false);
      await loadAllWorks();
      filterWorks();
    } catch (error) {
      console.error('Error saving work:', error);
      alert('Error saving work. Please try again.');
    }
  };

  const handleEditWork = (work: AarakhadaWork) => {
    setEditingWork(work);
    setViewMode(false);
    setShowForm(true);
  };

  const handleViewWork = (work: AarakhadaWork) => {
    setEditingWork(work);
    setViewMode(true);
    setShowForm(true);
  };

  const handleDeleteWork = async (work: AarakhadaWork) => {
    try {
      await workService.delete(work.id, work.work_type);
      await loadAllWorks();
      filterWorks();
    } catch (error) {
      console.error('Error deleting work:', error);
      alert(t('errorDelete') || 'Failed to delete, please try again.');
    }
  };

  // Cascade filters: Taluka -> Gram Panchayat -> Village
  const gramPanchayatsByTaluka = selectedTaluka
    ? Array.from(new Set(villages
        .filter(v => (v.taluka ?? '').trim().toLowerCase() === selectedTaluka.trim().toLowerCase())
        .map(v => v.gram_panchayat)
        .filter(Boolean)))
    : Array.from(new Set(villages.map(v => v.gram_panchayat).filter(Boolean)));

  const filteredVillages = selectedGramPanchayat
    ? villages.filter(v => v.gram_panchayat === selectedGramPanchayat)
    : selectedTaluka
      ? villages.filter(v => (v.taluka ?? '').trim().toLowerCase() === selectedTaluka.trim().toLowerCase())
      : villages;

  const isNoVillages = !villages || villages.length === 0;

  // Filter works to only those belonging to filtered villages (accessible by the user)
  const accessibleWorks = ['district', 'developer', 'super_admin', 'admin'].includes(roleName?.trim().toLowerCase())
    ? works // all works visible to these roles
    : (() => {
      const accessibleVillageIds = new Set(villages.map(v => v.id));
      return works.filter(w => accessibleVillageIds.has(w.village_id));
    })();

  const getWorkSum = (
    works: AarakhadaWork[],
    valueKey: keyof AarakhadaWork
  ): number => {
    if (isNoVillages || !works.length) return 0;
    return works.reduce((sum, work) => {
      const raw = work[valueKey];
      const n = typeof raw === 'number' ? raw : Number(raw);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  };

  const totalVillages = isNoVillages ? 0 : villages.length;
  const totalWorks = getWorkSum(accessibleWorks, 'sanctioned_works');
  const totalExpenditure = getWorkSum(accessibleWorks, 'current_expenditure');
  const totalSanctionedWorks = getWorkSum(accessibleWorks, 'sanctioned_works');
  const totalCompletedWorks = getWorkSum(accessibleWorks, 'completed_works');
  const totalOngoingWorks = getWorkSum(accessibleWorks, 'ongoing_works');
  const totalPendingWorks = getWorkSum(accessibleWorks, 'pending_works');
  const totalReleasedAmount = getWorkSum(accessibleWorks, 'released_amount');
  const totalPreviousMonthExpenditure = getWorkSum(accessibleWorks, 'previous_expenditure');
  const totalCurrentMonthExpenditure = getWorkSum(accessibleWorks, 'current_expenditure');
  const totalCumulativeExpenditure = getWorkSum(accessibleWorks, 'cumulative_expenditure');

  const labelColorsMap = {
    'from-purple-500 to-pink-600': 'text-pink-600',
    'from-teal-500 to-emerald-600': 'text-emerald-600',
    'from-orange-500 to-red-600': 'text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-transparent flex items-center justify-center">
                <img
                  src={PesaLogo}
                  alt="Pesa Logo"
                  className="w-full h-full object-contain rounded shadow"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">{t('gramPanchayat')}</h1>
                <p className="text-purple-100 text-lg">
                  {language === 'mr'
                    ? 'ग्राम पंचायत स्तरावरील कामांचे व्यवस्थापन'
                    : 'Gram Panchayat level work management'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDownloadExcel}
                className="bg-white text-purple-600 px-5 py-3 mt-3 rounded-2xl hover:bg-purple-50 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium shadow-lg"
                title={'Download Excel'}
              >
                <Download className="w-5 h-5" />
                Excel
              </button>
              <button
                onClick={handleDownloadPdf}
                className="bg-white text-red-600 px-5 py-3 mt-3 rounded-2xl hover:bg-red-50 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium shadow-lg"
                title={'Download PDF'}
              >
                <FileText className="w-5 h-5" />
                PDF
              </button>

              {/* Taluka Filter */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-white mb-1">
                  {language === 'mr' ? 'तालुका निवडा' : 'Select Taluka'}
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedTaluka}
                    onChange={e => {
                      setSelectedTaluka(e.target.value);
                      setSelectedGramPanchayat('');
                      setSelectedVillage('');
                    }}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl
                 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500
                 transition-all duration-300 bg-white text-sm"
                  >
                    <option value="">
                      {language === 'mr' ? 'तालुका निवडा' : 'Select Taluka'}
                    </option>
                    {uniqueTalukas.map(taluka => (
                      <option key={taluka} value={taluka}>
                        {taluka}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-white mb-1">
                  {language === 'mr' ? 'ग्रामपंचायत निवडा' : 'Select Gram Panchayat'}
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedGramPanchayat}
                    onChange={e => {
                      setSelectedGramPanchayat(e.target.value);
                      setSelectedVillage('');
                    }}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl
                 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500
                 transition-all duration-300 bg-white text-sm"
                  >
                    <option value="">{language === 'mr' ? 'ग्रामपंचायत निवडा' : 'Select Gram Panchayat'}</option>
                    {gramPanchayatsByTaluka.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Original Cards below header */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-3 py-2">
        {[
          {
            icon: Building2,
            label: language === 'mr' ? 'एकूण गाव' : 'Total Villages',
            value: totalVillages.toString(),
            color: 'from-purple-500 to-pink-600'
          },
          {
            icon: DollarSign,
            label: language === 'mr' ? 'एकूण कामे' : 'Total Works',
            value: totalWorks.toString(),
            color: 'from-teal-500 to-emerald-600'
          },
          {
            icon: DollarSign,
            label: language === 'mr' ? 'चालू महिन्याचा खर्च' : 'Total Expenditure',
            value: `₹${totalExpenditure.toLocaleString()}`,
            color: 'from-orange-500 to-red-600',
          }
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
              <div
                className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center ml-2 shadow-md`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>
      {/* Financial/Physical Tabs */}
      <div className="bg-white rounded-3xl shadow-xl p-4 border border-gray-100">
        <div className="flex gap-0 mb-6 rounded-3xl overflow-hidden">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'physical'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
              : 'bg-white text-transparent relative'
              }`}
            style={{ borderRadius: 0 }}
          >
            {activeTab === 'physical' ? (
              <TrendingUpIcon className="w-5 h-5 text-white" />
            ) : (
              <TrendingUpIcon
                className="w-5 h-5"
                style={{
                  background: 'linear-gradient(90deg, #9333EA, #EC4899)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              />
            )}
            <span
              className={
                activeTab === 'physical'
                  ? ''
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent'
              }
              style={activeTab === 'physical' ? undefined : { WebkitBackgroundClip: 'text' }}
            >
              {t('physical')}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'financial'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
              : 'bg-white text-transparent relative'
              }`}
            style={{ borderRadius: 0 }}
          >
            {activeTab === 'financial' ? (
              <DollarSign className="w-5 h-5 text-white" />
            ) : (
              <DollarSign
                className="w-5 h-5"
                style={{
                  background: 'linear-gradient(90deg, #9333EA, #EC4899)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              />
            )}
            <span
              className={
                activeTab === 'financial'
                  ? ''
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent'
              }
              style={activeTab === 'financial' ? undefined : { WebkitBackgroundClip: 'text' }}
            >
              {t('financial')}
            </span>
          </button>
        </div>
        {/* Village, Work Category, Year and Month Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              {language === 'mr' ? 'गाव निवडा' : 'Select Village'}
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedVillage}
                onChange={e => setSelectedVillage(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white text-sm"
              >
                <option value="">{t('selectVillage')}</option>
                {(filteredVillages ?? []).map(village => (
                  <option key={village.id} value={village.id}>
                    {language === 'mr'
                      ? (village.village_name_mr || village.village_name)
                      : village.village_name}
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
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as 'A' | 'B' | 'C' | 'D')}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white text-sm"
              >
                <option value="">{t('selectCategory') || 'Select Category'}</option>
                {(workCategories ?? []).map(category => (
                  <option key={category.id} value={category.id}>
                    {language === 'mr' ? category.name_mr : category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              {language === 'mr' ? 'वर्ष' : 'Year'}
            </label>
            <div className="relative">
              <div className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700">
                {selectedYear}
              </div>
            </div>
          </div>
          {/* Month Filter updated: show all unique "Month-Year" options */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              {language === 'mr' ? 'महिना निवडा' : 'Select Month'}
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white text-sm"
              >
                <option value="">{language === 'mr' ? 'सर्व महिने' : 'All Months'}</option>
                {uniqueMonthYearList.map(monthYear => (
                  <option key={monthYear} value={monthYear}>
                    {monthYear}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Newly added cards below filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {activeTab === 'physical' ? (
            [
              {
                label: language === 'mr' ? 'एकूण मंजूर कामे' : 'Total Sanctioned Works',
                value: totalSanctionedWorks.toString(),
                color: 'from-purple-500 to-pink-600',
                icon: Building2,
              },
              {
                label: language === 'mr' ? 'एकूण पूर्ण झालेली कामे' : 'Total Completed Works',
                value: totalCompletedWorks.toString(),
                color: 'from-teal-500 to-emerald-600',
                icon: Filter,
              },
              {
                label: language === 'mr' ? 'एकूण चालू कामे' : 'Total Ongoing Works',
                value: totalOngoingWorks.toString(),
                color: 'from-yellow-500 to-orange-600',
                icon: Filter,
              },
              {
                label: language === 'mr' ? 'एकूण प्रलंबित कामे' : 'Total Pending Works',
                value: totalPendingWorks.toString(),
                color: 'from-red-500 to-pink-600',
                icon: Filter,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-all duration-300 flex items-center gap-4"
                  style={{ minWidth: 0, minHeight: 0 }}
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800 mb-1">{item.value}</p>
                    <p className="text-xs text-gray-600 font-bold">{item.label}</p>
                  </div>
                </div>
              );
            })
          ) : (
            [
              {
                label: language === 'mr' ? 'एकूण रक्कम रिलीझ' : 'Total Released Amount',
                value: `₹${totalReleasedAmount.toLocaleString()}`,
                color: 'from-purple-500 to-pink-600',
                icon: Building2,
              },
              {
                label: language === 'mr' ? 'मागील महिन्याचा खर्च' : 'Total Expenditure of Previous Month',
                value: `₹${totalPreviousMonthExpenditure.toLocaleString()}`,
                color: 'from-teal-500 to-emerald-600',
                icon: Filter,
              },
              {
                label: language === 'mr' ? 'चालू महिन्याचा खर्च' : 'Total Expenditure of Current Month',
                value: `₹${totalCurrentMonthExpenditure.toLocaleString()}`,
                color: 'from-yellow-500 to-orange-600',
                icon: Filter,
              },
              {
                label: language === 'mr' ? 'एकूण खर्च' : 'Total Cumulative Expenditure',
                value: `₹${totalCumulativeExpenditure.toLocaleString()}`,
                color: 'from-red-500 to-pink-600',
                icon: Filter,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-all duration-300 flex items-center gap-4"
                  style={{ minWidth: 0, minHeight: 0 }}
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800 mb-1">{item.value}</p>
                    <p className="text-xs text-gray-600 font-bold">{item.label}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Table */}
        <AarakhadaTable
          works={works}
          workType={activeTab}
          loading={loading}
          onEdit={handleEditWork}
          onView={handleViewWork}
          onDelete={handleDeleteWork}
          villages={villages}
          workCategories={workCategories}
          workNamesMap={workNamesMap}
          loadAllWorks={loadAllWorks}
          userId={userId}
          roleName={roleName}
        />

      </div>

      {/* Form Modal */}
      <AarakhadaWorkForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingWork(null);
          setViewMode(false);
        }}
        onSave={handleSaveWork}
        workType={activeTab}
        villages={villages}
        workCategories={workCategories}
        workNamesMap={workNamesMap}
        editingWork={editingWork}
        readonly={viewMode}
      />
    </div>
  );
}