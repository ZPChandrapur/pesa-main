import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle, Plus, Edit, Trash2, Eye, Copy, Layers, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { pesaWorkflowOperations, pesaWorkOperations } from '../../utils/supabase';
import { useLanguage } from '../../context/LanguageContext';
import WorkflowBuilder from '../Placeholders/WorkflowBuilder';
import WorkflowProgress from '../Placeholders/WorkflowProgress';
import { Village } from '../../types';
import HeaderLogo from '../../assets/headerLogo.png';

interface PesaWork {
  id: string;
  taluka: string;
  year?: string | number;
  work_name: string;
  department: string;
  admin_approval_no: string;
  admin_approval_date: string;
  admin_approval_amount?: string;
  tech_approval_no?: string;
  tech_approval_date?: string;
  tech_approval_amount?: number;
  agreement_approval_no?: number;
  agreement_approval_date?: string;
  agreement_approval_amount?: string;
  duration?: string;
  contractor_name?: string;
  current_status?: string;
  delay?: string;
  expected_completion_date?: string;
  note?: string;
  village_id?: string;
  gram_panchayat_work_id?: string;
  pesa_grampanchayat?: string;
  work_category?: string;
  added_month?: string; // added new field
  created_at?: string;
  updated_at?: string;
  village?: { village_name: string; village_name_mr?: string };
  gram_panchayat_work?: { work_name: string; work_category: string };
}
export function WorkProgress({ userId, roleName }: { userId: string; roleName: string }) {
  const { t, language } = useLanguage();
  const [works, setWorks] = useState<PesaWork[]>([]);
  const [availableWorkNames, setAvailableWorkNames] = useState<any[]>([]);
  const [pesaGrampanchayats, setPesaGrampanchayats] = useState<string[]>([]);
  const [workCategories, setWorkCategories] = useState([
    { id: 'A', name: 'Category A - Infrastructure', name_mr: 'प्रकार अ - पायाभूत सुविधा' },
    { id: 'B', name: 'Category B - Social Development', name_mr: 'प्रकार ब - सामाजिक विकास' },
    { id: 'C', name: 'Category C - Economic Development', name_mr: 'प्रकार क - आर्थिक विकास' },
    { id: 'D', name: 'Category D - Environmental', name_mr: 'प्रकार ड - पर्यावरण' },
  ]);
  const [villages, setVillages] = useState<{ id: string; village_name: string; village_name_mr?: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState<PesaWork | null>(null);
  const [viewingWork, setViewingWork] = useState<PesaWork | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; // adjust as needed
  const [loading, setLoading] = useState(true);
  const [allVillageData, setAllVillageData] = useState<Village[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder' | 'progress'>('dashboard');
  const [selectedWork, setSelectedWork] = useState<PesaWork | null>(null);
  const handleTab = (tab: 'dashboard' | 'builder' | 'progress') => {
    setActiveTab(tab);
    if (tab === 'progress' && !selectedWork && works.length > 0) {
      setSelectedWork(works[0]);
    }
  };

  const handleBackToWorkflowProgress = () => {
    setSelectedWork(null);    // clear selected work
    setActiveTab('progress'); // switch to progress tab (workflow cards/list)
  };


  // Reordered formData fields for input order in form
  const [formData, setFormData] = useState({
    taluka: '',
    year: '',
    work_name: '',
    department: '',
    current_status: '',
    admin_approval_no: '',
    admin_approval_date: '',
    admin_approval_amount: '',
    tech_approval_no: '',
    tech_approval_date: '',
    tech_approval_amount: '',
    agreement_approval_no: '',
    agreement_approval_date: '',
    agreement_approval_amount: '',
    duration: '',
    contractor_name: '',
    delay: '',
    expected_completion_date: '',
    note: '',
    village_id: '',
    gram_panchayat_work_id: '',
    pesa_grampanchayat: '',
    work_category: '',
    added_month: '', // added month field here
  });
  // Added states for filtering dropdowns
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [workCategoryFilter, setWorkCategoryFilter] = useState<string>('all');
  const [pesaGrampanchayatFilter, setPesaGrampanchayatFilter] = useState<string>('all');
  const [villageFilter, setVillageFilter] = useState<string>('all');
  const completedStages = works.filter(w => w.current_status === 'completed').length;
  const inProgress = works.filter(w => w.current_status === 'in_progress').length;
  const pending = works.filter(w => w.current_status === 'pending').length;
  const overallProgress = works.length ? Math.round((completedStages / works.length) * 100) : 0;
  useEffect(() => {
    loadWorks();
    loadAvailableWorkNames();
    setCurrentPage(1);
  }, [userId]);


  const handleDownloadCSV = () => {
    const headers = [
      'Taluka',
      'Year',
      'PESA Gram Panchayat',
      'Village',
      'Work Category',
      'Work Name',
      'Month',
      'Approval Amount',
      'Contractor Name',
      'Status',
    ];

    const rowsHtml = filteredWorks.map((w: any) => {
      return `<tr>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.taluka || ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.year ?? ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.pesa_grampanchayat || ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.village?.village_name || ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.work_category || ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.work_name || ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.added_month || ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.agreement_approval_amount || ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.contractor_name || ''}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${w.current_status || ''}</td>
    </tr>`;
    }).join('');

    const headerHtml = headers.map(h => `
    <th style="
      background-color: #10b981;
      color: white;
      font-weight: bold;
      padding: 6px 8px;
      text-align: left;
      border: 1px solid #ddd;
    ">${h}</th>`).join('');

    const tableHtml = `
    <table style="border-collapse: collapse; width: 100%;">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'work_progress_data.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const loadWorks = async () => {
    try {
      setLoading(true);

      const { villageService } = await import('../../utils/supabase');
      const allVillageData = await villageService.getAll();
      setAllVillageData(allVillageData);

      let allowedVillageIds: string[] = [];

      if (!['district', 'developer', 'super_admin'].includes(roleName?.trim().toLowerCase()) && userId) {
        allowedVillageIds = allVillageData
          .filter((v: any) => {
            if (v.tal_user_access === null && v.gram_user_access === null) {
              return false;
            }

            return v.tal_user_access === userId || v.gram_user_access === userId;
          })
          .map((v: any) => v.id);

        if (!allowedVillageIds.length) {
          setWorks([]);
          return;
        }
      }

      let worksData = await pesaWorkOperations.getAll();

      if (allowedVillageIds.length > 0) {
        worksData = worksData.filter((w: any) =>
          allowedVillageIds.includes(w.village_id)
        );
      }

      setWorks(worksData);

      const uniqueVillages = Array.from(
        new Set(
          worksData.map((w: any) => w.village?.village_name).filter(Boolean)
        )
      ) as string[];
      setVillages(uniqueVillages.map(name => ({ id: name, village_name: name })));

      const uniqueGramPanchayats = Array.from(
        new Set(worksData.map((w: any) => w.pesa_grampanchayat).filter(Boolean))
      );
      setPesaGrampanchayats(uniqueGramPanchayats);

    } catch (error) {
      console.error('Error loading works:', error);
      toast.error('Error loading works');
    } finally {
      setLoading(false);
    }
  };


  const loadAvailableWorkNames = async () => {
    try {
      const data = await pesaWorkOperations.getAvailableWorkNames();
      setAvailableWorkNames(data);
    } catch (error) {
      console.error('Error loading available work names:', error);
    }
  };
  const validateForm = () => {
    const requiredFields = ['taluka', 'work_name', 'village_id'];
    for (let field of requiredFields) {
      if (!(formData as any)[field]) {
        toast.error(`${t(field)} is required`);
        return false;
      }
    }
    return true;
  };

  const handleWorkClick = async (work: PesaWork) => {
    
    try {
      const workflowsData = await pesaWorkflowOperations.getAll();

      // Filter workflows for the clicked work_name
      const filteredWorkflows = workflowsData.filter(
        (workflow: any) => workflow.work?.work_name === work.work_name
      );

      const hasProgressData = filteredWorkflows.some(
        (workflow: any) => workflow.workflow_steps && workflow.workflow_steps.length > 0
      );

      if (!hasProgressData) {
        alert('There are no steps added for this work.');
        return;
      }

      setSelectedWork(work);
      setActiveTab('progress');
    } catch (error) {
      console.error('Error checking workflow progress:', error);
      toast.error('Error checking workflow progress');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!validateForm()) return;
    const formattedData = {
      ...formData,
      year: formData.year || null,
      tech_approval_amount: formData.tech_approval_amount ? Number(formData.tech_approval_amount) : null,
      agreement_approval_no: formData.agreement_approval_no ? Number(formData.agreement_approval_no) : null,
      agreement_approval_amount: formData.agreement_approval_amount ? Number(formData.agreement_approval_amount) : null,
      current_status: ['pending', 'in_progress', 'completed'].includes(formData.current_status)
        ? formData.current_status
        : 'pending',
      village_id: formData.village_id || null,
      gram_panchayat_work_id: formData.gram_panchayat_work_id || null,
      added_month: formData.added_month || null,
    };
    try {
      if (editingWork) {
        await pesaWorkOperations.update(editingWork.id, formattedData);
        toast.success('Work updated successfully');
      } else {
        await pesaWorkOperations.create(formattedData);
        toast.success('Work created successfully');
      }
      await loadWorks();
      resetForm();
    } catch (error) {
      console.error('Error saving work:', error);
      toast.error('Error saving work');
    }
  };
  const handleEdit = (work: PesaWork) => {
    setEditingWork(work);
    setFormData({
      taluka: work.taluka || '',
      year: work.year !== undefined && work.year !== null ? String(work.year) : '',
      work_name: work.work_name || '',
      department: work.department || '',
      current_status: work.current_status || '',
      admin_approval_no: work.admin_approval_no || '',
      admin_approval_date: work.admin_approval_date || '',
      admin_approval_amount: work.admin_approval_amount ? String(work.admin_approval_amount) : '',
      tech_approval_no: work.tech_approval_no || '',
      tech_approval_date: work.tech_approval_date || '',
      tech_approval_amount: work.tech_approval_amount ? String(work.tech_approval_amount) : '',
      agreement_approval_no: work.agreement_approval_no ? String(work.agreement_approval_no) : '',
      agreement_approval_date: work.agreement_approval_date || '',
      agreement_approval_amount: work.agreement_approval_amount ? String(work.agreement_approval_amount) : '',
      duration: work.duration || '',
      contractor_name: work.contractor_name || '',
      delay: work.delay || '',
      expected_completion_date: work.expected_completion_date || '',
      note: work.note || '',
      village_id: work.village_id || '',
      gram_panchayat_work_id: '',  // removed gram_panchayat_work_id usage
      pesa_grampanchayat: work.pesa_grampanchayat || '',
      work_category: work.work_category || work.gram_panchayat_work?.work_category || '',
      added_month: work.added_month || '',
    });
    setShowForm(true);
  };
  const handleView = (work: PesaWork) => setViewingWork(work);
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this work?')) {
      try {
        await pesaWorkOperations.delete(id);
        toast.success('Work deleted successfully');
        await loadWorks(); // Refresh list after delete
      } catch (error) {
        console.error('Error deleting work:', error);
        toast.error('Error deleting work');
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await pesaWorkOperations.duplicate(id);
      await loadWorks();
      toast.success('Work duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating work:', error);
      toast.error('Error duplicating work');
    }
  };
  const resetForm = () => {
    setFormData({
      taluka: '',
      year: '',
      work_name: '',
      department: '',
      current_status: '',
      admin_approval_no: '',
      admin_approval_date: '',
      admin_approval_amount: '',
      tech_approval_no: '',
      tech_approval_date: '',
      tech_approval_amount: '',
      agreement_approval_no: '',
      agreement_approval_date: '',
      agreement_approval_amount: '',
      duration: '',
      contractor_name: '',
      delay: '',
      expected_completion_date: '',
      note: '',
      village_id: '',
      gram_panchayat_work_id: '',
      pesa_grampanchayat: '',
      work_category: '',
      added_month: '',
    });
    setEditingWork(null);
    setShowForm(false);
  };
  const filteredWorks = works.filter(w => {
    const statusMatch = statusFilter === 'all' || w.current_status === statusFilter;
    const yearMatch = yearFilter === 'all' || String(w.year) === yearFilter;
    const workCategoryMatch = workCategoryFilter === 'all' || w.work_category === workCategoryFilter;
    const pesaGrampanchayatMatch = pesaGrampanchayatFilter === 'all' || w.pesa_grampanchayat === pesaGrampanchayatFilter;
    const villageMatch = villageFilter === 'all' || (w.village?.village_name === villageFilter);
    return statusMatch && yearMatch && workCategoryMatch && pesaGrampanchayatMatch && villageMatch;
  });
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const cards = [
    { icon: CheckCircle, label: t('completed'), value: completedStages, color: 'from-green-500 to-emerald-600' },
    { icon: Clock, label: t('inProgress'), value: inProgress, color: 'from-blue-500 to-indigo-600' },
    { icon: AlertCircle, label: t('pending'), value: pending, color: 'from-amber-500 to-orange-600' },
    { icon: TrendingUp, label: t('overallProgress'), value: `${overallProgress}%`, color: 'from-purple-500 to-pink-600' },
  ];
  const uniqueYears = Array.from(new Set(works.map(w => w.year).filter(Boolean) as (string | number)[])).map(String);

  const groupedBySomeKey = works.reduce((acc, work) => {
    const key = work.groupKey || '-'; // replace 'groupKey' with your actual group field
    if (!acc[key]) acc[key] = [];
    acc[key].push(work);
    return acc;
  }, {} as Record<string, typeof works[0][]>);

  const groupedArray = Object.entries(groupedBySomeKey).map(([key, items], idx) => ({
    key,
    items,
    groupSrNo: idx + 1,
  }));

  const totalPages = Math.ceil(filteredWorks.length / rowsPerPage);

  const paginatedWorks = filteredWorks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const labelColorsMap = {
    'from-green-500 to-emerald-600': 'text-emerald-600',
    'from-blue-500 to-indigo-600': 'text-blue-600',
    'from-amber-500 to-orange-600': 'text-orange-600',
    'from-purple-500 to-pink-600': 'text-pink-600',
  };


  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '1rem' }}>
        <button
          onClick={() => handleTab('dashboard')}
          style={{
            fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal',
            color: activeTab === 'dashboard' ? '#2ab085' : 'inherit',
            background: activeTab === 'dashboard' ? 'rgba(46,184,131,.08)' : 'transparent',
            borderRadius: '6px',
            padding: '6px 18px',
            border: 'none',
          }}
        >
          {t('workDashboard')}
        </button>
        <button
          onClick={() => handleTab('builder')}
          style={{
            fontWeight: activeTab === 'builder' ? 'bold' : 'normal',
            color: activeTab === 'builder' ? '#2a58ec' : 'inherit',
            background: activeTab === 'builder' ? 'rgba(52,120,255,.08)' : 'transparent',
            borderRadius: '6px',
            padding: '6px 18px',
            border: 'none',
          }}
        >
          {t('workflowBuilder')}
        </button>
        <button
          onClick={() => {
            setActiveTab('progress');
            setSelectedWork(null);
          }}
          style={{
            fontWeight: activeTab === 'progress' ? 'bold' : 'normal',
            color: activeTab === 'progress' ? '#9350d6' : 'inherit',
            background: activeTab === 'progress' ? 'rgba(147,80,214,.08)' : 'transparent',
            borderRadius: '6px',
            padding: '6px 18px',
            border: 'none',
          }}
        >
          {t('workflowProgress')}
        </button>

      </div>
      {/* Header and Filters replacing Add New Work Button */}
      {activeTab === 'dashboard' && (
        <div className="bg-gradient-to-r from-orange-400 via-fuchsia-500 to-cyan-400 rounded-3xl p-6 shadow-2xl relative mb-4 overflow-hidden">
          {/* Warli/BG Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('/src/assets/tribal_bg.jpg')] bg-cover bg-center opacity-10 pointer-events-none rounded-3xl" />

          <div className="relative z-10 flex items-center justify-between">
            {/* Left Logo */}
            <div className="flex-shrink-0 mr-6">
              <div className="w-16 h-16 bg-transparent rounded-2xl flex items-center justify-center shadow border border-white/60">
                <img
                  src={HeaderLogo}
                  alt="Header Logo"
                  className="w-full h-full object-contain rounded shadow"
                />
              </div>
            </div>

            {/* Left-aligned, vertically centered Title/Subtitle */}
            <div className="flex flex-col items-start justify-center flex-1">
              <h2 className="text-3xl font-bold text-white drop-shadow">{t('workManagement')}</h2>
              <p className="text-gray-100 mt-2 font-medium">{t('manageAndTrackAllWorkAssignments')}</p>
            </div>

            {/* Right Controls */}
            <div className="flex gap-4 flex-shrink-0">
              <button
                className="w-44 h-12 mt-4 bg-white text-cyan-600 rounded-2xl flex items-center justify-center gap-2 font-medium shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Excel
              </button>

              <div className="flex flex-col">
                <label className="font-bold text-white">{t('pesaGrampanchayat')}</label>
                <select
                  value={pesaGrampanchayatFilter}
                  onChange={e => setPesaGrampanchayatFilter(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="all">{t('All')}</option>
                  {pesaGrampanchayats.map(gp => (
                    <option key={gp} value={gp}>{gp}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="font-bold text-white">{t('village')}</label>
                <select
                  value={villageFilter}
                  onChange={e => setVillageFilter(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="all">{t('All')}</option>
                  {villages.map(v => (
                    <option key={v.id} value={v.village_name}>
                      {language === 'mr' ? v.village_name_mr || v.village_name : v.village_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Cards */}
      {activeTab === 'dashboard' && (
        <div className="relative grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 py-4 tribal-bg">
          {cards.map((item, index) => {
            const Icon = item.icon;
            const labelColorClass = labelColorsMap[item.color] || 'text-gray-600';
            return (
              <div
                key={index}
                className="relative bg-white/90 backdrop-blur-sm shadow-md rounded-2xl flex items-center justify-between p-4 hover:scale-105 hover:shadow-lg transform transition-all duration-300 border border-emerald-100 card-tribal"
              >
                <div className="flex flex-col text-left">
                  <span className="text-2xl font-bold text-gray-700 mb-1">{item.value}</span>
                  <span className={`text-sm font-semibold tracking-wide ${labelColorClass}`}>{item.label}</span>
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
      )}
      {/* Filters */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-wrap items-center gap-6 mb-4">
          <div className="flex flex-col">
            <label className="font-bold text-gray-700">{t('year')}</label>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('All')}</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="font-bold text-gray-700">{t('workCategory')}</label>
            <select
              value={workCategoryFilter}
              onChange={e => setWorkCategoryFilter(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('All')}</option>
              {workCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {language === 'mr' ? cat.name_mr : cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="font-bold text-gray-700">{t('Filter by Status')}</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('All')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="in_progress">{t('inProgress')}</option>
              <option value="completed">{t('completed')}</option>
            </select>
          </div>
        </div>
      )}
      {/* Works Table */}
      {activeTab === 'dashboard' && (
        <div className="table-container rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('Sr. No')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('taluka')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('year')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('pesaGrampanchayat')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('village')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('workCategory')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('workName')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('month')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('approval_amount')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('contractor_name')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('status')}</th>
                  <th className="px-2 py-4 text-left text-xs font-medium">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedWorks.map((work, index) => (
                  <tr key={work.id} className="hover:bg-gray-50">
                    <td className="px-2 py-4 text-xs">{index + 1}</td>
                    <td className="px-2 py-4 text-xs">{work.taluka}</td>
                    <td className="px-2 py-4 text-xs">{work.year !== undefined && work.year !== null ? String(work.year) : '-'}</td>
                    <td className="px-2 py-4 text-xs">{work.pesa_grampanchayat || '-'}</td>
                    <td className="px-2 py-4 text-xs">{work.village?.village_name || '-'}</td>
                    <td className="px-2 py-4 text-xs">
                      {work.work_category ? (
                        workCategories.find(c => c.id === work.work_category)
                          ? language === 'mr'
                            ? workCategories.find(c => c.id === work.work_category)?.name_mr
                            : workCategories.find(c => c.id === work.work_category)?.name
                          : work.work_category
                      ) : '-'}
                    </td>
                    <td
                      className="px-2 py-4 text-xs text-blue-600 underline cursor-pointer hover:text-blue-800"
                      onClick={() => handleWorkClick(work)}
                    >
                      {work.work_name || '-'}
                    </td>
                    <td className="px-2 py-4 text-xs">{work.added_month || '-'}</td>
                    <td className="px-2 py-4 text-xs">{work.agreement_approval_amount}</td>
                    <td className="px-2 py-4 text-xs">{work.contractor_name}</td>
                    <td className="px-1 py-4 text-xs">
                      {work.current_status ? (
                        <span
                          className={`px-1 py-1 rounded-full text-xs font-semibold ${work.current_status === 'pending'
                            ? 'bg-gray-100 text-gray-700'
                            : work.current_status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                            }`}
                        >
                          {t(work.current_status)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleView(work)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="View work">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(work)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit work">
                          <Edit className="w-4 h-4" />
                        </button>
                        {/* <button onClick={() => handleDuplicate(work.id)} className="p-1 text-green-600 hover:bg-green-50 rounded-lg" title="Duplicate work">
                          <Copy className="w-4 h-4" />
                        </button> */}
                        {roleName?.trim().toLowerCase() !== 'grampanchayat' && (
                          <button onClick={() => handleDelete(work.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Delete work">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredWorks.length === 0 && (
            <div className="text-center py-12 text-gray-500">{t('No works found')}</div>
          )}

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
      )}
      {activeTab === 'builder' && (
        <WorkflowBuilder userId={userId} allVillageData={allVillageData} roleName={roleName} />
      )}
      {activeTab === 'progress' && (
        <WorkflowProgress
          userId={userId}
          allVillageData={allVillageData}
          initialSelectedWorkName={selectedWork?.work_name || null}
          onBackToList={handleBackToWorkflowProgress}  // pass callback for back handling
        />
      )}

      {/* Form Modal for Add/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-blue-600">{editingWork ? t('edit') : t('addNewWork')}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Added pesaGrampanchayat Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('pesaGrampanchayat')}</label>
                  <select
                    value={formData.pesa_grampanchayat}
                    onChange={(e) => setFormData({ ...formData, pesa_grampanchayat: e.target.value })}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 ${roleName?.trim().toLowerCase() === 'grampanchayat' ? 'bg-gray-100 ' : ''
                      }`}
                    disabled={roleName?.trim().toLowerCase() === 'grampanchayat'}
                  >
                    <option value="">{t('selectPesaGrampanchayat')}</option>
                    {pesaGrampanchayats.map((gp) => (
                      <option key={gp} value={gp}>
                        {gp}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Added workCategory Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('workCategory')}</label>
                  <select
                    value={formData.work_category}
                    onChange={(e) => setFormData({ ...formData, work_category: e.target.value })}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 ${roleName?.trim().toLowerCase() === 'grampanchayat' ? 'bg-gray-100 ' : ''
                      }`}
                    disabled={roleName?.trim().toLowerCase() === 'grampanchayat'}
                  >
                    <option value="">{t('selectOption')}</option>
                    {workCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Added Month editable input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('month')}</label>
                  <input
                    type="text"
                    value={formData.added_month}
                    onChange={(e) => setFormData({ ...formData, added_month: e.target.value })}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 ${roleName?.trim().toLowerCase() === 'grampanchayat' ? 'bg-gray-100 ' : ''
                      }`}
                    placeholder="e.g. September-2025"
                    readOnly={roleName?.trim().toLowerCase() === 'grampanchayat'}
                  />
                </div>
                {/* Top fields now placed here in order */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('taluka')}</label>
                  <input
                    type="text"
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 ${roleName?.trim().toLowerCase() === 'grampanchayat' ? 'bg-gray-100 ' : ''
                      }`}
                    required
                    readOnly={roleName?.trim().toLowerCase() === 'grampanchayat'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('year')}</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 ${roleName?.trim().toLowerCase() === 'grampanchayat' ? 'bg-gray-100 ' : ''
                      }`}
                    required
                    readOnly={roleName?.trim().toLowerCase() === 'grampanchayat'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('workName')}</label>
                  <input
                    type="text"
                    value={formData.work_name}
                    onChange={(e) => setFormData({ ...formData, work_name: e.target.value })}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 ${roleName?.trim().toLowerCase() === 'grampanchayat' ? 'bg-gray-100 ' : ''
                      }`}
                    required
                    readOnly={roleName?.trim().toLowerCase() === 'grampanchayat'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('department')}</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('status')}</label>
                  <select
                    value={formData.current_status}
                    onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('selectOption')}</option>
                    <option value="pending">{t('pending')}</option>
                    <option value="in_progress">{t('in_progress')}</option>
                    <option value="completed">{t('completed')}</option>
                  </select>
                </div>
                {/* Remaining inputs except already placed fields and removed required admin_approval_no and admin_approval_date */}
                {Object.keys(formData).map((field) => {
                  if (
                    [
                      'village_id',
                      'gram_panchayat_work_id',
                      'pesa_grampanchayat',
                      'work_category',
                      'added_month',
                      'taluka',
                      'year',
                      'work_name',
                      'department',
                      'current_status',
                    ].includes(field)
                  )
                    return null;
                  const isRequired = field === 'agreement_approval_amount'; 
                  return (
                    <div key={field}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t(field)} {isRequired && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        placeholder={field.includes('date') ? 'dd-mm-yyyy' : ''}
                        type={
                          field.includes('date')
                            ? 'date'
                            : field === 'year'
                              ? 'text'
                              : typeof (formData as any)[field] === 'number'
                                ? 'number'
                                : 'text'
                        }
                        required={isRequired}
                        value={(formData as any)[field] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numericFields = ['agreement_approval_no', 'agreement_approval_amount', 'admin_approval_amount'];
                          setFormData(
                            (prev) => ({ ...prev, [field]: numericFields.includes(field) ? (value === '' ? null : Number(value)) : value })
                          );
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) && e.preventDefault()}
                        onFocus={e => e.target.addEventListener('wheel', function (ev) { ev.preventDefault(); }, { passive: false })}
                        onBlur={e => e.target.removeEventListener('wheel', function (ev) { ev.preventDefault(); })}
                      />
                    </div>
                  );
                })}
                {/* Buttons */}
                <div className="md:col-span-2 flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary px-6 py-2 rounded-lg border border-blue-100 font-medium text-gray-800 hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-400 shadow hover:scale-105 transition-all"
                  >
                    {editingWork ? t('update') : t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal structured like form fields */}
      {viewingWork && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold mb-6 text-emerald-600">{t('viewWork')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Show all form fields except village_id and gram_panchayat_work_id */}
              {Object.keys(formData).map((field) => {
                if (['village_id', 'gram_panchayat_work_id'].includes(field)) return null;
                let displayValue = (viewingWork as any)[field];
                displayValue = displayValue ? t(displayValue) : '-';
                return (
                  <div key={field}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t(field)}</label>
                    <div className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingWork(null)}
                className="btn-secondary px-6 py-2 rounded-lg border border-blue-100 font-medium text-gray-800 hover:bg-gray-50"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}