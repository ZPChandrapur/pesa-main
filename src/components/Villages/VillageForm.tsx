import React, { useState, useEffect } from 'react';
import { X, Save, MapPin } from 'lucide-react';
import { Village } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useYear } from '../../context/YearContext';
import { pesaSupabase, supabase } from '../../utils/supabase';
interface VillageFormProps {
  village?: Village | null;
  onSave: (village: Omit<Village, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isOpen: boolean;
  readonly?: boolean; // Added readonly prop for view mode
}

export function VillageForm({ village, onSave, onCancel, isOpen, readonly = false }: VillageFormProps) {
  const { t } = useLanguage();
  const { selectedYear } = useYear();
  const [accessUsers, setAccessUsers] = useState<{ user_id: string }[]>([]);
  const initialFormData: Omit<Village, 'id' | 'created_at' | 'updated_at'> & {
    gram_panchayat_population?: number | null;
    gram_panchayat_st_population?: number | null;
    village_population?: number | null;
    village_st_population?: number | null;
    amount_per_head_st_population?: string | null;
    is_pesa?: boolean;
    year?: string;
  } = {
    village_name: '',
    district: 'Chandrapur',
    block: '',
    gram_panchayat: '',
    gram_panchayat_population: null,
    gram_panchayat_st_population: null,
    village_population: null,
    village_st_population: null,
    amount_per_head_st_population: '',
    gram_user_access: '',
    village_code: '',
    is_pesa: false,
    year: selectedYear,
  };
  const [formData, setFormData] = useState(initialFormData);
  useEffect(() => {
    if (village) {
      setFormData({
        village_name: village.village_name,
        district: village.district,
        block: village.block,
        gram_panchayat: village.gram_panchayat,
        gram_panchayat_population: (village as any).gram_panchayat_population ?? null,
        gram_panchayat_st_population: (village as any).gram_panchayat_st_population ?? null,
        village_population: (village as any).village_population ?? null,
        village_st_population: (village as any).village_st_population ?? null,
        amount_per_head_st_population: (village as any).amount_per_head_st_population != null ? (village as any).amount_per_head_st_population.toString() : '',
        village_code: village.village_code || '',
        is_pesa: village.is_pesa ?? false,
        gram_user_access: (village as any).gram_user_access || '',
        year: (village as any).year || selectedYear,
      });
    } else {
      setFormData({ ...initialFormData, year: selectedYear });
    }
  }, [village]);

  useEffect(() => {
    const fetchAccessUsers = async () => {
      try {
        const { data: roleUsers, error: roleError } = await supabase
          .from("user_roles")
          .select("user_id, role_id, name")
          .eq("role_id", 6);

        if (roleError) {
          console.error("Error loading role users:", roleError);
          return;
        }

        if (!roleUsers || roleUsers.length === 0) {
          setAccessUsers([]);
          return;
        }

        const userIds = roleUsers.map(u => u.user_id);

        const { data: villages, error: villageError } = await pesaSupabase
          .from("villages")
          .select("gram_user_access");

        if (villageError) {
          console.error("Error loading villages:", villageError);
          return;
        }

        const accessUserIds = villages
          ?.filter(v => v.gram_user_access)
          .map(v => v.gram_user_access) || [];

        const finalList = roleUsers.map(u => ({
          user_id: u.user_id,
          name: u.name,
          has_access: accessUserIds.includes(u.user_id) // optional flag
        }));

        setAccessUsers(finalList);

      } catch (err) {
        console.error("Error loading access users:", err);
      }
    };

    fetchAccessUsers();
  }, []);


  const resetData = () => {
    setFormData(initialFormData);
  };
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const villageName = formData.village_name;
  const gpName = formData.gram_panchayat;

  const { data: existing, error } = await pesaSupabase
    .from("villages")
    .select("id, village_name, gram_panchayat")
    .eq("gram_panchayat", gpName)
    .eq("village_name", villageName);

  if (error) {
    console.error("Error checking village duplicate:", error);
  }

  const isDuplicate =
    existing &&
    existing.length > 0 &&
    existing[0].id !== (village?.id ?? null);

  if (isDuplicate) {
    alert("This village name is already present under this Gram Panchayat.");
    return;
  }

  const dataToSave = {
    ...formData,
    gram_user_access:
      formData.gram_user_access === "" ? null : formData.gram_user_access,
    gram_panchayat_population: formData.gram_panchayat_population ?? 0,
    gram_panchayat_st_population: formData.gram_panchayat_st_population ?? 0,
    village_population: formData.village_population ?? 0,
    village_st_population: formData.village_st_population ?? 0,
    amount_per_head_st_population:
      formData.amount_per_head_st_population === ""
        ? 0
        : parseFloat(formData.amount_per_head_st_population),
    is_pesa: !!formData.is_pesa,
  };

  onSave(dataToSave);
  alert(t("submittedSuccessfully"));
  resetData();
};

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {readonly
                  ? t('viewVillage')
                  : village
                    ? t('editVillage')
                    : t('addVillage')}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Village Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('villageName')}</label>
              <input
                type="text"
                value={formData.village_name}
                onChange={(e) => !readonly && handleChange('village_name', e.target.value)}
                required
                readOnly={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            {/* District */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('district')}</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => !readonly && handleChange('district', e.target.value)}
                required
                readOnly={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              />
            </div>
            {/* Block */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('block')}</label>
              <select
                value={formData.block}
                onChange={(e) => !readonly && handleChange('block', e.target.value)}
                required
                disabled={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white"
              >
                <option value="">{t('selectBlock')}</option>
                <option value="Jiwati">Jiwati</option>
                <option value="Rajura">Rajura</option>
                <option value="Korpana">Korpana</option>
              </select>
            </div>

            {/* Gram Panchayat */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('gramPanchayat')} <span className="text-gray-500 text-xs">(Optional)</span></label>
              <input
                type="text"
                value={formData.gram_panchayat}
                onChange={(e) => !readonly && handleChange('gram_panchayat', e.target.value)}
                readOnly={readonly}
                placeholder="Leave blank for villages without GP"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              />
            </div>
            {/* Year */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('year')}</label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700">
                {(formData as any).year || selectedYear}
              </div>
            </div>
            {/* Village Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">गाव कोड</label>
              <input
                type="text"
                value={formData.village_code}
                onChange={(e) => !readonly && handleChange('village_code', e.target.value)}
                readOnly={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              />
            </div>
            {/* Population Fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('gskPopulation')}</label>
              <input
                type="number"
                value={formData.gram_panchayat_population ?? ''}
                onChange={(e) => !readonly && handleChange('gram_panchayat_population', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                readOnly={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('gskStPopulation')}</label>
              <input
                type="number"
                value={formData.gram_panchayat_st_population ?? ''}
                onChange={(e) => !readonly && handleChange('gram_panchayat_st_population', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                readOnly={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('villagePopulation')}</label>
              <input
                type="number"
                value={formData.village_population ?? ''}
                onChange={(e) => !readonly && handleChange('village_population', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                readOnly={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('villageSTPopulation')}</label>
              <input
                type="number"
                value={formData.village_st_population ?? ''}
                onChange={(e) => !readonly && handleChange('village_st_population', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                readOnly={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">{t('amountPerHeadSTPopulation')}</label>
              <input
                type="number"
                step="any"
                value={formData.amount_per_head_st_population ?? ''}
                onChange={(e) => !readonly && handleChange('amount_per_head_st_population', e.target.value)}
                readOnly={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl"
                onWheel={e => e.currentTarget.blur()} // prevent scroll changing value
                onKeyDown={e => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault(); // prevent arrow keys increment/decrement
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                {t('grampanchayatAccess')}
              </label>

              <select
                value={(formData as any).gram_user_access || ""}
                onChange={(e) => !readonly && handleChange('gram_user_access', e.target.value)}
                disabled={readonly}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white mt-1"
              >
                <option value="">{t('selectAccess')}</option>
                {accessUsers.map(user => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                {t('accessNote')}
              </span>
            </div>

            {/* PESA Flag */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">PESA गाव</label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={!!formData.is_pesa}
                  onChange={(e) => !readonly && handleChange('is_pesa', e.target.checked)}
                  disabled={readonly}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-600">हे PESA गाव आहे</span>
              </div>
            </div>
          </div>
          {!readonly && (
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-medium"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 font-medium"
              >
                <Save className="w-5 h-5" />
                {t('save')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}