import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { pesaWorkOperations } from '../../utils/supabase';
import { useLanguage } from '../../context/LanguageContext';
export function Aarakhada() {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    taluka: '' as string,
    year: null as string | number | null,
    work_name: '',
    work_category: '',
    department: '',
    admin_approval_no: '',
    admin_approval_date: '',
    admin_approval_amount: '',
    agreement_approval_no: null as number | null,
    agreement_approval_date: '',
    agreement_approval_amount: null as number | null,
    duration: '',
    contractor_name: '',
    village_id: '',
    pesa_grampanchayat: '',
    added_month: '', // ✅ new field
    current_status: '', // moved here for positioning after added_month
  });
  const [availableWorkNames, setAvailableWorkNames] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [filteredVillages, setFilteredVillages] = useState<any[]>([]);
  const [pesaGramPanchayats, setPesaGramPanchayats] = useState<any[]>([]);
  const [workCategories] = useState<any[]>([
    { id: 'A', name: 'Category A - Infrastructure', name_mr: 'प्रकार अ - पायाभूत सुविधा' },
    { id: 'B', name: 'Category B - Social Development', name_mr: 'प्रकार ब - सामाजिक विकास' },
    { id: 'C', name: 'Category C - Economic Development', name_mr: 'प्रकार क - आर्थिक विकास' },
    { id: 'D', name: 'Category D - Environmental', name_mr: 'प्रकार ड - पर्यावरण' },
  ]);
  const [editingWork, setEditingWork] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const readonly = false;
  // Auto-populate taluka when village is selected
  useEffect(() => {
    if (formData.village_id) {
      const selectedVillage = villages.find(v => v.id === formData.village_id);
      if (selectedVillage) {
        setFormData(prev => ({
          ...prev,
          taluka: selectedVillage.block || ''
        }));
      }
    }
  }, [formData.village_id, villages]);
  // Filter villages based on selected grampanchayat
  useEffect(() => {
    if (formData.pesa_grampanchayat) {
      const filtered = villages.filter(v => v.gram_panchayat === formData.pesa_grampanchayat);
      setFilteredVillages(filtered);
      // Reset village selection if currently selected village isn't in filtered list
      if (!filtered.some(v => v.id === formData.village_id)) {
        setFormData(prev => ({ ...prev, village_id: '' }));
      }
    } else {
      setFilteredVillages([]);
      setFormData(prev => ({ ...prev, village_id: '' }));
    }
  }, [formData.pesa_grampanchayat, villages]);
  useEffect(() => {
    loadAvailableWorkNames();
    loadVillages();
    setLoading(false);
    // Set added_month only on component mount (not on subsequent renders or on edit)
    if (!editingWork) {
      const date = new Date();
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      setFormData(prev => ({ ...prev, added_month: `${month}-${year}` }));
    }
  }, []);
  const loadAvailableWorkNames = async () => {
    try {
      const data = await pesaWorkOperations.getAvailableWorkNames();
      setAvailableWorkNames(data);
    } catch (error) {
      console.error('Error loading available work names:', error);
    }
  };
  const loadVillages = async () => {
    try {
      const { villageService } = await import('../../utils/supabase');
      const data = await villageService.getAll();
      setVillages(data);
      // Extract unique gram panchayat names from villages
      const uniqueGramPanchayats = Array.from(
        new Set(data.map((v) => v.gram_panchayat).filter(Boolean)),
      ).map((gp) => ({
        id: gp,
        gram_panchayat: gp,
      }));
      setPesaGramPanchayats(uniqueGramPanchayats);
    } catch (error) {
      console.error('Error loading villages:', error);
    }
  };
  const validateForm = () => {
    const requiredFields = [
      'taluka',
      'work_name',
      'year',
      'pesa_grampanchayat',
      'village_id',
      'work_category',
      'current_status', // made required
    ];
    for (let field of requiredFields) {
      if (!(formData as any)[field]) {
        toast.error(`${t(field)} is required`);
        return false;
      }
    }
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (editingWork) {
        await pesaWorkOperations.update(editingWork, formData);
        toast.success(t('workUpdatedSuccessfully'));
      } else {
        await pesaWorkOperations.create(formData);
        toast.success(t('workCreatedSuccessfully'));
      }
      resetForm();
    } catch (error) {
      console.error('Error saving work:', error);
      toast.error(t('errorSavingWork'));
    }
  };
  const resetForm = () => {
    setFormData({
      taluka: '',
      year: null,
      work_name: '',
      work_category: '',
      department: '',
      admin_approval_no: '',
      admin_approval_date: '',
      admin_approval_amount: '',
      agreement_approval_no: null,
      agreement_approval_date: '',
      agreement_approval_amount: null,
      duration: '',
      contractor_name: '',
      village_id: '',
      pesa_grampanchayat: '',
      added_month: '', // ✅ reset as well
      current_status: '', // keep position consistent
    });
    setEditingWork(null);
    setFilteredVillages([]);
  };
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl max-w-4xl mx-auto">
      <Toaster position="top-right" />
      <h3 className="text-2xl font-bold mb-6 text-blue-600">{editingWork ? t('edit') : t('addNewWork')}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PESA Gram Panchayat Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('pesaGrampanchayat')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.pesa_grampanchayat}
            disabled={readonly}
            onChange={(e) => !readonly && handleChange('pesa_grampanchayat', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
            required
          >
            <option value="">{t('selectPesaGrampanchayat')}</option>
            {pesaGramPanchayats.map((gp) => (
              <option key={gp.id} value={gp.gram_panchayat}>
                {gp.gram_panchayat}
              </option>
            ))}
          </select>
        </div>
        {/* Village Selection filtered by selected Gram Panchayat */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('pesaVillageName')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.village_id}
            disabled={readonly || !formData.pesa_grampanchayat}
            onChange={(e) => !readonly && handleChange('village_id', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
            required
          >
            <option value="">{t('selectVillage')}</option>
            {filteredVillages.map((village) => (
              <option key={village.id} value={village.id}>
                {language === 'mr' ? village.village_name_mr || village.village_name : village.village_name}
              </option>
            ))}
          </select>
        </div>
        {/* Work Category */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('workCategory')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.work_category}
            disabled={readonly}
            onChange={(e) => !readonly && handleChange('work_category', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
            required
          >
            <option value="">{t('selectOption')}</option>
            {workCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {language === 'mr' ? category.name_mr : category.name}
              </option>
            ))}
          </select>
        </div>
        {/* Work Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('workName')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={formData.work_name}
            readOnly={readonly}
            onChange={(e) => !readonly && handleChange('work_name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
            required
          />
        </div>
        {/* Taluka */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('taluka')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={formData.taluka}
            readOnly={readonly}
            onChange={(e) => !readonly && handleChange('taluka', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
            required
          />
        </div>
        {/* Year */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('year')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={formData.year ?? ''}
            readOnly={readonly}
            onChange={(e) => !readonly && handleChange('year', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
            required
          />
        </div>
        {/* Added Month - ✅ new field */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('month')}
          </label>
          <input
            type="text"
            value={formData.added_month}
            readOnly={readonly}
            onChange={(e) => !readonly && handleChange('added_month', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
          />
        </div>
        {/* current_status positioned here with required and asterisk */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('current_status')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.current_status}
            disabled={readonly}
            onChange={(e) => !readonly && handleChange('current_status', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
            required
          >
            <option value="">{t('selectOption')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="in_progress">{t('in_progress')}</option>
            <option value="completed">{t('completed')}</option>
          </select>
        </div>
        {/* Remaining Inputs */}
        {Object.keys(formData).map((field) => {
          if (['village_id', 'work_category', 'work_name', 'pesa_grampanchayat', 'taluka', 'year', 'added_month', 'current_status'].includes(field))
            return null;
          const removedFields = [
            'tech_approval_no',
            'tech_approval_date',
            'tech_approval_amount',
            'priority',
            'delay',
            'expected_completion',
            'note',
          ];
          if (removedFields.includes(field)) return null;
          const isRequired = false; // no other fields required
          return (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t(field)}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
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
                  handleChange(
                    field,
                    numericFields.includes(field) ? (value === '' ? null : Number(value)) : value,
                  );
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
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
  );
}
