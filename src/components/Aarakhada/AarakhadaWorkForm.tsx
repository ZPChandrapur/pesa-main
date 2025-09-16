import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { AarakhadaWork } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
interface AarakhadaWorkFormProps {
  isOpen: boolean;
  readonly?: boolean;
  onClose: () => void;
  onSave: (work: Omit<AarakhadaWork, 'created_at' | 'updated_at'> & { id?: string }) => void;
  workType: 'financial' | 'physical';
  villages: any[];
  workCategories: any[];
  editingWork?: AarakhadaWork | null;
  workNamesMap: Record<string, Record<string, string[]>>;
}
export function AarakhadaWorkForm({
  isOpen,
  onClose,
  onSave,
  workType,
  villages,
  workCategories,
  editingWork,
  workNamesMap,
  readonly = false,
}: AarakhadaWorkFormProps) {
  const { t, language } = useLanguage();
  type FormDataType = Omit<AarakhadaWork, 'id' | 'created_at' | 'updated_at'> & {
    previous_expenditure?: number | null;
    current_expenditure?: number | null;
    cumulative_expenditure?: number | null;
    remaining_funds?: number | null;
    sanctioned_works?: number | null;
    completed_works?: number | null;
    progress_works?: number | null;
    not_started_works?: number | null;
  };
  const initialFormData: FormDataType = {
    village_id: '',
    village_name: '',
    work_category: 'A',
    work_name: '',
    work_type: workType,
    estimated_amount: null,
    sanctioned_amount: null,
    released_amount: null,
    expenditure: null,
    physical_progress: null,
    financial_progress: null,
    status: 'pending',
    start_date: '',
    completion_date: '',
    gram_panchayat: '',
    taluka: '',
    district: '',
    previous_expenditure: null,
    current_expenditure: null,
    cumulative_expenditure: null,
    remaining_funds: null,
    sanctioned_works: null,
    completed_works: null,
    progress_works: null,
    not_started_works: null,
  };
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [availableWorks, setAvailableWorks] = useState<string[]>([]);

  useEffect(() => {
    if (editingWork) {
      setFormData(prev => ({
        ...prev,
        village_id: editingWork.village_id,
        village_name: editingWork.village_name,
        work_category: editingWork.work_category,
        work_name: editingWork.work_name,
        work_type: editingWork.work_type,
        estimated_amount: editingWork.estimated_amount || null,
        sanctioned_amount: editingWork.sanctioned_amount || null,
        released_amount: editingWork.released_amount || null,
        expenditure: editingWork.expenditure || null,
        physical_progress: editingWork.physical_progress || null,
        financial_progress: editingWork.financial_progress || null,
        status: editingWork.status,
        start_date: editingWork.start_date || '',
        completion_date: editingWork.completion_date || '',
        gram_panchayat: editingWork.gram_panchayat,
        taluka: editingWork.taluka,
        district: editingWork.district,
        previous_expenditure: (editingWork as any).previous_expenditure || null,
        current_expenditure: (editingWork as any).current_expenditure || null,
        cumulative_expenditure: (editingWork as any).cumulative_expenditure || null,
        remaining_funds: (editingWork as any).remaining_funds || null,
        sanctioned_works: (editingWork as any).sanctioned_works || null,
        completed_works: (editingWork as any).completed_works || null,
        progress_works: (editingWork as any).progress_works || null,
        not_started_works: (editingWork as any).not_started_works || null,
      }));
    } else {
      resetForm();
    }
  }, [editingWork, workType]);

  useEffect(() => {
    if (workType === 'financial') {
      const prevExp = formData.previous_expenditure || 0;
      const currExp = formData.current_expenditure || 0;
      const released = formData.released_amount || 0;
      const cumulative = prevExp + currExp;
      const remaining = released - cumulative;
      setFormData(prev => ({
        ...prev,
        cumulative_expenditure: cumulative,
        remaining_funds: remaining,
      }));
    }
  }, [formData.previous_expenditure, formData.current_expenditure, formData.released_amount, workType]);

  useEffect(() => {
    if (formData.village_id && formData.work_category) {
      const selectedVillage = villages.find(v => v.id === formData.village_id);
      if (selectedVillage) {
        const workItems = getWorksForVillageAndCategory(selectedVillage.village_name, formData.work_category);
        setAvailableWorks(workItems);
      }
    }
  }, [formData.village_id, formData.work_category, villages, workNamesMap]);

  const getWorksForVillageAndCategory = (village: string, category: string) => {
    return workNamesMap?.[village]?.[category] || [];
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVillage = villages.find(v => v.id === formData.village_id);
    if (selectedVillage) {
      const baseWorkData = {
        village_id: formData.village_id,
        village_name: selectedVillage.village_name,
        gram_panchayat: selectedVillage.gram_panchayat,
        taluka: selectedVillage.block,
        district: selectedVillage.district,
        work_category: formData.work_category,
        work_name: formData.work_name,
        work_type: workType,
        status: formData.status,
        start_date: formData.start_date === '' ? null : formData.start_date,
        completion_date: formData.completion_date === '' ? null : formData.completion_date,
      };
      let workDataToSend;
      if (workType === 'financial') {
        workDataToSend = {
          ...(editingWork ? { id: editingWork.id } : {}),
          ...baseWorkData,
          estimated_amount: formData.estimated_amount || 0,
          sanctioned_amount: formData.sanctioned_amount || 0,
          released_amount: formData.released_amount || 0,
          expenditure: formData.expenditure || 0,
          physical_progress: formData.physical_progress || 0,
          financial_progress: formData.financial_progress || 0,
          previous_expenditure: formData.previous_expenditure || 0,
          current_expenditure: formData.current_expenditure || 0,
          cumulative_expenditure: formData.cumulative_expenditure || 0,
          remaining_funds: formData.remaining_funds || 0,
        };
      } else {
        workDataToSend = {
          ...(editingWork ? { id: editingWork.id } : {}),
          ...baseWorkData,
          sanctioned_works: formData.sanctioned_works || 0,
          completed_works: formData.completed_works || 0,
          progress_works: formData.progress_works || 0,
          not_started_works: formData.not_started_works || 0,
          physical_progress: formData.physical_progress || 0,
        };
      }
      onSave(workDataToSend as any);
      alert(t('submittedSuccessfully'));
    }
  };

  const handleChange = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div
          className={`p-6 rounded-t-3xl ${
            workType === 'financial'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {readonly
                  ? t('viewWork')
                  : editingWork
                  ? t('editWork')
                  : t('addWork')}{' '}
                - {workType === 'financial' ? t('financial') : t('physical')}
              </h2>
            </div>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Village Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('pesaVillageName')}
              </label>
              <select
                value={formData.village_id}
                disabled={readonly}
                onChange={e => !readonly && handleChange('village_id', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                required
              >
                <option value="">{t('selectVillage')}</option>
                {villages.map(village => (
                  <option key={village.id} value={village.id}>
                    {language === 'mr' ? village.village_name_mr || village.village_name : village.village_name}
                  </option>
                ))}
              </select>
            </div>
            {/* Work Category */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">{t('workCategory')}</label>
              <select
                value={formData.work_category}
                disabled={readonly}
                onChange={e => !readonly && handleChange('work_category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                required
              >
                {workCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {language === 'mr' ? category.name_mr : category.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Work Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">{t('workName')}</label>
              <input
                type="text"
                value={formData.work_name}
                readOnly={readonly}
                onChange={e => !readonly && handleChange('work_name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                required
              />
            </div>
            {/* --- Financial fields --- */}
            {workType === 'financial' && (
              <>
                {/* Approved Fund */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('sanctionedAmount')}</label>
                  <input
                    type="number"
                    value={formData.sanctioned_amount ?? ''}
                    readOnly={readonly}
                    onChange={e => !readonly && handleChange('sanctioned_amount', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                    min={undefined}
                    onWheel={e => e.currentTarget.blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
                {/* Received Fund */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('releasedAmount')}</label>
                  <input
                    type="number"
                    value={formData.released_amount ?? ''}
                    readOnly={readonly}
                    onChange={e => !readonly && handleChange('released_amount', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                    min={undefined}
                    onWheel={e => e.currentTarget.blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
                {/* Previous Month Expenditure */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('previousExpenditure')}</label>
                  <input
                    type="number"
                    value={formData.previous_expenditure ?? ''}
                    readOnly={readonly}
                    onChange={e => !readonly && handleChange('previous_expenditure', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                    min={undefined}
                    onWheel={e => e.currentTarget.blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
                {/* Current Month Expenditure */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('currentExpenditure')}</label>
                  <input
                    type="number"
                    value={formData.current_expenditure ?? ''}
                    readOnly={readonly}
                    onChange={e => !readonly && handleChange('current_expenditure', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                    min={undefined}
                    onWheel={e => e.currentTarget.blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
                {/* Cumulative Expenditure */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('cumulativeExpenditure')}</label>
                  <input
                    type="number"
                    value={formData.cumulative_expenditure ?? ''}
                    readOnly={true}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-100"
                  />
                </div>
                {/* Remaining Funds */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('remainingFunds')}</label>
                  <input
                    type="number"
                    value={formData.remaining_funds ?? ''}
                    readOnly={true}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-100"
                  />
                </div>
              </>
            )}
            {/* --- Physical fields --- */}
            {workType === 'physical' && (
              <>
                {/* Sanctioned Works (count) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('sanctionedWorks')}</label>
                  <input
                    type="number"
                    value={formData.sanctioned_works ?? ''}
                    readOnly={readonly}
                    onChange={e => !readonly && handleChange('sanctioned_works', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                    min={undefined}
                    onWheel={e => e.currentTarget.blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
                {/* Completed Works (count) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('completedWorks')}</label>
                  <input
                    type="number"
                    value={formData.completed_works ?? ''}
                    readOnly={readonly}
                    onChange={e => !readonly && handleChange('completed_works', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                    min={undefined}
                    onWheel={e => e.currentTarget.blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
                {/* Progress Works (count) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('ongoingWorks')}</label>
                  <input
                    type="number"
                    value={formData.progress_works ?? ''}
                    readOnly={readonly}
                    onChange={e => !readonly && handleChange('progress_works', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                    min={undefined}
                    onWheel={e => e.currentTarget.blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
                {/* Not Started Works (count) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('pendingWorks')}</label>
                  <input
                    type="number"
                    value={formData.not_started_works ?? ''}
                    readOnly={readonly}
                    onChange={e => !readonly && handleChange('not_started_works', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                    min={undefined}
                    onWheel={e => e.currentTarget.blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
              </>
            )}
          </div>
          {/* Footer Actions */}
          {!readonly && (
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingWork ? t('edit') : t('addWork')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
