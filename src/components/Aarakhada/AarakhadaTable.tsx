import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { AarakhadaWork } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface AarakhadaTableProps {
  works: AarakhadaWork[];
  workType: 'financial' | 'physical';
  loading: boolean;
  onEdit: (work: AarakhadaWork) => void;
  onView: (work: AarakhadaWork) => void;
  onDelete: (work: AarakhadaWork) => void;
}
export function AarakhadaTable({ works, workType, loading, onEdit, onView, onDelete }: AarakhadaTableProps) {
  const { t, language } = useLanguage();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusText = (status: string) => {
    const statusMap = {
      completed: language === 'mr' ? 'पूर्ण' : 'Completed',
      ongoing: language === 'mr' ? 'चालू' : 'Ongoing',
      pending: language === 'mr' ? 'प्रलंबित' : 'Pending',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };
  // Utility for formatting month as "Month-YYYY"
  const getDisplayMonth = (added_month: string) => {
    if (!added_month) return '-';
    return added_month;
  };
  if (loading) {
    return <div className="text-center py-10">{t('loading')}...</div>;
  }
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mt-6">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">{t('srNo')}</th>
            <th className="px-4 py-3">{t('villageName')}</th>
            <th className="px-4 py-3">{t('workCategory')}</th>
            <th className="px-4 py-3">{t('year')}</th>
            <th className="px-4 py-3">{t('month')}</th>
            {workType === 'financial' && (
              <>
                <th className="px-4 py-3">{t('sanctionedAmount')}</th>
                <th className="px-4 py-3">{t('releasedAmount')}</th>
                <th className="px-4 py-3">{t('previousMonthExpenditure') || 'Previous Month Expenditure'}</th>
                <th className="px-4 py-3">{t('currentMonthExpenditure') || 'Current Month Expenditure'}</th>
                <th className="px-4 py-3">{t('cumulativeExpenditure')}</th>
                <th className="px-4 py-3">{t('remainingFunds')}</th>
              </>
            )}
            {workType === 'physical' && (
              <>
                <th className="px-4 py-3">{t('sanctionedWorks')}</th>
                <th className="px-4 py-3">{t('completedWorks')}</th>
                <th className="px-4 py-3">{t('ongoingWorks')}</th>
                <th className="px-4 py-3">{t('pendingWorks')}</th>
              </>
            )}
            <th className="px-4 py-3">{t('status')}</th>
            <th className="px-4 py-3">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {works && works.length === 0 ? (
            <tr>
              <td
                colSpan={workType === 'financial' ? 12 : 11}
                className="px-4 py-6 text-center text-gray-500"
              >
                {language === 'mr' ? 'कोणतीही कामे सापडली नाहीत' : 'No works found'}
              </td>
            </tr>
          ) : (
            works.map((work, index) => (
              <tr key={work.id} className="border-t">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{work.village_name}</td>
                <td className="px-4 py-3">{work.work_category}</td>
                <td className="px-4 py-3">{work.year || '-'}</td>
                <td className="px-4 py-3">{getDisplayMonth(work.added_month)}</td>
                {workType === 'financial' && (
                  <>
                    <td className="px-4 py-3">
                      ₹{work.sanctioned_amount?.toLocaleString?.() || 0}
                    </td>
                    <td className="px-4 py-3">
                      ₹{work.released_amount?.toLocaleString?.() || 0}
                    </td>
                    <td className="px-4 py-3">
                      ₹{work.current_expenditure?.toLocaleString?.() || 0}
                    </td>
                    <td className="px-4 py-3">
                      ₹{work.monthly_expenditure?.toLocaleString?.() || 0}
                    </td>
                    <td className="px-4 py-3">
                      ₹{work.cumulative_expenditure?.toLocaleString?.() || 0}
                    </td>
                    <td className="px-4 py-3">
                      ₹{work.remaining_funds?.toLocaleString?.() || 0}
                    </td>
                  </>
                )}
                {workType === 'physical' && (
                  <>
                    <td className="px-4 py-3">{work.sanctioned_works || 0}</td>
                    <td className="px-4 py-3">{work.completed_works || 0}</td>
                    <td className="px-4 py-3">{work.progress_works || 0}</td>
                    <td className="px-4 py-3">{work.not_started_works || 0}</td>
                  </>
                )}
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      work.status
                    )}`}
                  >
                    {getStatusText(work.status)}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => onView(work)}
                    title={t('view')}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="text-green-500 hover:text-green-700"
                    onClick={() => onEdit(work)}
                    title={t('edit')}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      if (
                        window.confirm(
                          t('confirmDelete') || 'Are you sure you want to delete this?'
                        )
                      ) {
                        onDelete(work);
                      }
                    }}
                    title={t('delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
