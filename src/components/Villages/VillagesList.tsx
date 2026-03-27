import React, { useState, useEffect } from 'react';
import { Building2, Users, Plus, Filter, MapPin, Edit, Trash2, Eye, Download } from 'lucide-react';
import { Village } from '../../types';
import { VillageForm } from './VillageForm';
import { pesaSupabase, villageService } from '../../utils/supabase';
import { useLanguage } from '../../context/LanguageContext';
import HeaderLogo from '../../assets/headerLogo.png';


export function VillagesList({ userId, roleName }: { userId: string }) {
  const { t, language } = useLanguage();
  const [villages, setVillages] = useState<Village[]>([]);
  const [filteredVillages, setFilteredVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [selectedGramPanchayat, setSelectedGramPanchayat] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const handleDownloadCSV = () => {
    const headers = [
      'District',
      'Block',
      'Gram Panchayat',
      'Village Name',
      'Village Population',
      'Village ST Population',
      'Amount Per Head ST Population',
      'Fund Allocated Village Wise',
      'Fund Allocated GP Wise'
    ];

    const headerHtml = headers.map(h => `
      <th style="
        background-color: #10b981; 
        color: white; 
        font-weight: bold; 
        padding: 6px 8px; 
        text-align: left;
        border: 1px solid #ddd;
      ">${h}</th>`).join('');

    const rowsHtml = filteredVillages.map((v: any) => {
      const amtPerHead = Number(v.amount_per_head_st_population) || 0;
      const stPop = Number(v.village_st_population) || 0;
      const fundAllocatedVillage = Math.round((amtPerHead * stPop + Number.EPSILON) * 100) / 100;

      const villagesInGp = filteredVillages.filter(fv => fv.gram_panchayat === v.gram_panchayat);
      const fundAllocatedGp = villagesInGp.reduce((sum, gv) => {
        const amt = Number(gv.amount_per_head_st_population) || 0;
        const st = Number(gv.village_st_population) || 0;
        return sum + amt * st;
      }, 0);

      return `<tr>
        <td style="border: 1px solid #ddd; padding: 4px;">${v.district || ''}</td>
        <td style="border: 1px solid #ddd; padding: 4px;">${v.block || ''}</td>
        <td style="border: 1px solid #ddd; padding: 4px;">${v.gram_panchayat || ''}</td>
        <td style="border: 1px solid #ddd; padding: 4px;">${v.village_name || ''}</td>
        <td style="border: 1px solid #ddd; padding: 4px;">${v.village_population || ''}</td>
        <td style="border: 1px solid #ddd; padding: 4px;">${v.village_st_population || ''}</td>
        <td style="border: 1px solid #ddd; padding: 4px;">${v.amount_per_head_st_population || ''}</td>
        <td style="border: 1px solid #ddd; padding: 4px;">${fundAllocatedVillage.toFixed(0)}</td>
        <td style="border: 1px solid #ddd; padding: 4px;">${fundAllocatedGp.toFixed(0)}</td>
      </tr>`;
    }).join('');

    const tableHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'villages_data.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toProperCase = (str?: string | null) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };


  const labelColorsMap: Record<string, string> = {
    'from-indigo-500 to-purple-600': 'text-indigo-600',
    'from-blue-500 to-indigo-600': 'text-blue-600',
    'from-emerald-500 to-teal-600': 'text-emerald-600',
    'from-pink-500 to-rose-500': 'text-pink-600',
  };

  useEffect(() => {
    loadVillages();
  }, []);

  useEffect(() => {
    filterVillages();
    setCurrentPage(1);
  }, [villages, searchTerm, selectedDistrict, selectedGramPanchayat, selectedBlock, language]);

  const loadVillages = async () => {
    try {
      setLoading(true);
      let data = await villageService.getAll();

      if (!['district', 'developer', 'super_admin', 'admin'].includes(roleName?.trim().toLowerCase()) && userId) {
        data = data.filter(v =>
          v.tal_user_access === userId || v.gram_user_access === userId
        );
      }

      setVillages(data);
    } catch (error) {
      console.error('Error loading villages:', error);
    } finally {
      setLoading(false);
    }
  };


  const filterVillages = () => {
    let filtered = villages;
    if (searchTerm) {
      filtered = filtered.filter(village =>
        (village.village_name || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (village.village_code || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedGramPanchayat) {
      filtered = filtered.filter(v => v.gram_panchayat === selectedGramPanchayat);
    }
    if (selectedBlock) {
      filtered = filtered.filter(v => v.block === selectedBlock);
    }
    setFilteredVillages(filtered);
  };

  const handleSave = async (villageData: Omit<Village, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingVillage?.id) {
        await villageService.update(editingVillage.id, villageData);
      } else {
        await villageService.create(villageData);
      }
      await loadVillages();
      setShowForm(false);
      setEditingVillage(null);
      setViewMode(false);
    } catch (error) {
      console.error('Error saving village:', error);
    }
  };

  const handleEdit = (village: Village) => {
    setEditingVillage(village);
    setViewMode(false);
    setShowForm(true);
  };

  const handleView = (village: Village) => {
    setEditingVillage(village);
    setViewMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(language === 'mr' ? 'गाव हटवायचे आहे?' : 'Are you sure you want to delete this village?')) {
      try {
        await villageService.delete(id);
        await loadVillages();
      } catch (error) {
        console.error('Error deleting village:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingVillage(null);
    setViewMode(false);
    setShowForm(true);
  };

  const uniqueDistricts = Array.from(new Set(villages.map(v => v.district)));
  const uniqueBlocks = Array.from(new Set(villages.map(v => v.block)));

  const isPesaVillage = (v: Village) => {
    const anyV = v as any;
    const candidates = [anyV.is_pesa, anyV.pesa, anyV.pesa_flag, anyV.isPesa];
    for (const c of candidates) {
      if (c === true || c === 1) return true;
      if (typeof c === 'string' && ['1', 'true', 'yes', 'y'].includes(c.toLowerCase())) return true;
    }
    return false;
  };

  const totalVillages = filteredVillages.length;
  const totalGP = new Set(filteredVillages.map(v => v.gram_panchayat)).size;

  const uniqueGpPopulations = new Map<string, number>();
  filteredVillages.forEach(v => {
    const gpKey = v.gram_panchayat || '';
    const gpPop = Number((v as any).gram_panchayat_population) || 0;
    if (gpKey && !uniqueGpPopulations.has(gpKey)) uniqueGpPopulations.set(gpKey, gpPop);
  });

  const filteredGramPanchayats = Array.from(
    new Set(villages.filter(v => !selectedBlock || v.block === selectedBlock).map(v => v.gram_panchayat))
  );

  useEffect(() => {
    setSelectedGramPanchayat('');
  }, [selectedBlock]);

  const totalPopulation = Array.from(uniqueGpPopulations.values()).reduce((sum, val) => sum + val, 0);
  const totalPesaVillagesPopulation = filteredVillages
    .filter(v => isPesaVillage(v))
    .reduce((sum, v) => sum + (Number((v as any).village_population) || 0), 0);

  const groupedByGp = filteredVillages.reduce((acc, village) => {
    const gp = village.gram_panchayat || '-';
    if (!acc[gp]) acc[gp] = [];
    acc[gp].push(village);
    return acc;
  }, {} as Record<string, Village[]>);

  const gpFundsMap = Object.fromEntries(
    Object.entries(groupedByGp).map(([gp, villages]) => {
      const totalFundAllocatedGp = villages.reduce((sum, v) => {
        const amtPerHead = Number((v as any).amount_per_head_st_population) || 0;
        const stPop = Number((v as any).village_st_population) || 0;
        return sum + amtPerHead * stPop;
      }, 0);
      return [gp, totalFundAllocatedGp];
    })
  );

  const totalFundAllocatedGp = Object.values(gpFundsMap).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

  interface RenderRow {
    village: Village;
    isFirstOfGroup: boolean;
    groupSize: number;
    groupSrNo: number;
    gramPanchayat: string;
  }

  // ----------------- UPDATED PAGINATION LOGIC -----------------
  const groupedArray = Object.entries(groupedByGp).map(([gp, villages], idx) => ({
    gp,
    villages,
    groupSrNo: idx + 1,
  }));

  const totalPages = Math.ceil(groupedArray.length / rowsPerPage);
  const paginatedGroups = groupedArray.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const renderRows: RenderRow[] = [];
  paginatedGroups.forEach(({ gp, villages, groupSrNo }) => {
    villages.forEach((village, index) => {
      renderRows.push({
        village,
        isFirstOfGroup: index === 0,
        groupSize: villages.length,
        groupSrNo,
        gramPanchayat: gp,
      });
    });
  });
  // ----------------- END UPDATED PAGINATION LOGIC -----------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-transparent rounded-2xl flex items-center justify-center shadow border border-white/60">
              <img
                src={HeaderLogo}
                alt="Header Logo"
                className="w-full h-full object-contain rounded shadow"
                style={{ background: 'white', padding: '6px' }}
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{t('villageManagement')}</h1>
              <p className="text-emerald-100 text-lg">
                {language === 'mr' ? 'गावांची माहिती व्यवस्थापित करा' : 'Manage villages information'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadCSV}
              className="bg-white text-teal-600 px-6 py-3 rounded-2xl hover:bg-teal-50 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download Excel
            </button>

            <button
              onClick={handleAddNew}
              className="bg-white text-emerald-600 px-6 py-3 rounded-2xl hover:bg-emerald-50 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {t('addVillage')}
            </button>
          </div>

        </div>
      </div>

      {/* Stats Cards */}
      <div
        className="relative grid grid-cols-1 md:grid-cols-5 xl:grid-cols-5 gap-3 py-4 tribal-bg"
      >
        {[
          {
            icon: Building2,
            label: language === 'mr' ? 'एकूण ग्रामपंचायती' : 'Total GPs',
            value: totalGP,
            color: 'from-indigo-500 to-purple-600',
          },
          {
            icon: Users,
            label: language === 'mr' ? 'एकूण गावे' : 'Total Villages',
            value: totalVillages,
            color: 'from-blue-500 to-indigo-600',
          },
          {
            icon: Users,
            label: language === 'mr' ? 'एकूण लोकसंख्या' : 'Total Population',
            value: totalPopulation.toLocaleString(),
            color: 'from-emerald-500 to-teal-600',
          },
          {
            icon: Users,
            label:
              language === 'mr'
                ? 'एकूण GP निधी वाटप'
                : 'Total Fund Allocated (GP)',
            value: totalFundAllocatedGp.toLocaleString('en-IN', {
              maximumFractionDigits: 0,
            }),
            color: 'from-orange-500 to-amber-500',
          },
          {
            icon: Users,
            label:
              language === 'mr'
                ? 'PESA गावांची लोकसंख्या'
                : 'Total PESA Villages Population',
            value: totalPesaVillagesPopulation.toLocaleString(),
            color: 'from-pink-500 to-rose-500',
          },
        ].map((item, index) => {
          const Icon = item.icon;
          const labelColorClass = labelColorsMap[item.color] || 'text-gray-600';

          return (
            <div
              key={index}
              className="relative bg-white/90 backdrop-blur-sm shadow-md rounded-2xl flex items-center justify-between p-4 hover:scale-105 hover:shadow-lg transform transition-all duration-300 border border-emerald-100 card-tribal"
            >
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-700 mb-1">{item.value}</span>
                <span className={`${labelColorClass} text-sm font-semibold tracking-wide`}>{item.label}</span>
              </div>

              <div
                className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-md`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          );
        })}
      </div>


      {/* Main Content */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl bg-white focus:ring-4 focus:ring-emerald-500/20"
            >
              <option value="">{t('block')}</option>
              {uniqueBlocks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedGramPanchayat}
              onChange={(e) => setSelectedGramPanchayat(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl bg-white focus:ring-4 focus:ring-emerald-500/20"
            >
              <option value="">{t('gramPanchayat')}</option>
              {villages
                .filter(v => !selectedBlock || v.block === selectedBlock)
                .map(v => v.gram_panchayat)
                .filter((gp, index, self) => gp && self.indexOf(gp) === index)
                .map(gp => (
                  <option key={gp} value={gp}>{gp}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container overflow-x-auto bg-white rounded-2xl shadow-lg">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 text-gray-700 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">{t('srNo')}</th>
                <th className="px-4 py-3">{t('ceoZp')}</th>
                <th className="px-4 py-3">{t('bdoPs')}</th>
                <th className="px-4 py-3">{t('gsk')}</th>
                <th className="px-4 py-3">{t('gskPopulation')}</th>
                <th className="px-4 py-3">{t('gskStPopulation')}</th>
                <th className="px-4 py-3">{t('villageName')}</th>
                <th className="px-4 py-3">{t('villagePopulation')}</th>
                <th className="px-4 py-3">{t('villageSTPopulation')}</th>
                <th className="px-4 py-3">{t('amountPerHeadSTPopulation')}</th>
                <th className="px-4 py-3">{t('fundAllocatedVillageWise')}</th>
                <th className="px-4 py-3">{t('fundAllocatedGpWise')}</th>
                <th className="px-4 py-3">{t('actions')}</th>
              </tr>
            </thead>

            <tbody>
              {renderRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8 text-gray-500">
                    {language === 'mr' ? 'कोणतेही गाव सापडले नाही' : 'No villages found'}
                  </td>
                </tr>
              ) : (
                renderRows.map(({ village: v, isFirstOfGroup, groupSize, groupSrNo, gramPanchayat }, i) => {
                  const amtPerHead = Number((v as any).amount_per_head_st_population) || 0;
                  const stPop = Number((v as any).village_st_population) || 0;
                  const fundAllocatedVillage = Math.round((amtPerHead * stPop + Number.EPSILON) * 100) / 100;
                  const fundAllocatedGp = gpFundsMap[gramPanchayat] || 0;
                  return (
                    <tr key={v.id} className="border-t border-gray-400 hover:bg-gray-50 transition-colors">
                      {isFirstOfGroup && (
                        <td rowSpan={groupSize} className="px-4 py-3 font-medium align-middle">{groupSrNo}</td>
                      )}
                      {isFirstOfGroup && <td rowSpan={groupSize} className="px-4 py-3 align-middle">{toProperCase(v.district)}</td>}
                      {isFirstOfGroup && <td rowSpan={groupSize} className="px-4 py-3 align-middle">{toProperCase(v.block) || '-'}</td>}
                      {isFirstOfGroup && <td rowSpan={groupSize} className="px-4 py-3 align-middle">{toProperCase(gramPanchayat)}</td>}
                      {isFirstOfGroup && <td rowSpan={groupSize} className="px-4 py-3 align-middle">{Number((v as any).gram_panchayat_population) || 0}</td>}
                      {isFirstOfGroup && <td rowSpan={groupSize} className="px-4 py-3 align-middle">{Number((v as any).gram_panchayat_st_population) || 0}</td>}

                      <td className="px-4 py-3">{toProperCase(v.village_name)}</td>
                      <td className="px-4 py-3">{Number((v as any).village_population) || 0}</td>
                      <td className="px-4 py-3">{stPop}</td>
                      <td className="px-4 py-3">{amtPerHead}</td>
                      <td className="px-4 py-3">{fundAllocatedVillage.toFixed(0)}</td>
                      {isFirstOfGroup && <td rowSpan={groupSize} className="px-4 py-3 align-middle">{fundAllocatedGp.toFixed(0)}</td>}

                      <td className="px-4 py-3 flex gap-2">
                        <button className="text-blue-500 hover:text-blue-700" onClick={() => handleView(v)}><Eye size={18} /></button>
                        <button className="text-green-500 hover:text-green-700" onClick={() => handleEdit(v)}><Edit size={18} /></button>
                        <button className="text-red-500 hover:text-red-700" onClick={() => { v.id && handleDelete(v.id); }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-4 mb-4">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              {t("prev")}
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-gray-200" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              {t("next")}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <VillageForm
        village={editingVillage}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingVillage(null);
          setViewMode(false);
        }}
        isOpen={showForm}
        readonly={viewMode}
      />
    </div>
  );
}
