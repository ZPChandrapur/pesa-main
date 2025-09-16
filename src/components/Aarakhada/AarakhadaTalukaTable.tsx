import React from 'react';
import { DollarSign, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AarakhadaTalukaTableProps {
  works: any[];
  workType: 'financial' | 'physical';
  loading: boolean;
}

export function AarakhadaTalukaTable({ works, workType, loading }: AarakhadaTalukaTableProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
      <table className="w-full text-sm text-left text-gray-600">
        {/* Headers */}
        <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 text-xs uppercase">
          {workType === 'financial' ? (
            <tr>
              <th className="px-4 py-3">{t('srNo')}</th>
              <th className="px-4 py-3">{t('pesaVillageName')}</th>
              <th className="px-4 py-3">{t('pesaVillageCount')}</th>
              <th className="px-4 py-3">{t('annualApprovedFund')}</th>
              <th className="px-4 py-3">{t('annualReceivedFund')}</th>
              <th className="px-4 py-3">{t('receivedInterest')}</th>
              <th className="px-4 py-3">{t('totalReceivedFund')}</th>
              <th className="px-4 py-3">{t('previousExpenditure')}</th>
              <th className="px-4 py-3">{t('currentExpenditure')}</th>
              <th className="px-4 py-3">{t('cumulativeExpenditure')}</th>
              <th className="px-4 py-3">{t('remainingFunds')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          ) : (
            <tr>
              <th className="px-4 py-3">{t('srNo')}</th>
              <th className="px-4 py-3">{t('pesaVillageName')}</th>
              <th className="px-4 py-3">{t('pesaVillageCount')}</th>
              <th className="px-4 py-3">{t('approvedWorks')}</th>
              <th className="px-4 py-3">{t('sanctionedWorks')}</th>
              <th className="px-4 py-3">{t('completedWorks')}</th>
              <th className="px-4 py-3">{t('ongoingWorks')}</th>
              <th className="px-4 py-3">{t('pendingWorks')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          )}
          
        </thead>

        {/* Body */}
        <tbody>
          {works.length === 0 ? (
            <tr>
              <td
                colSpan={workType === 'financial' ? 11 : 8}
                className="px-4 py-8 text-center text-gray-500"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-lg font-medium">
                    {t('noRecords') || (useLanguage().language === 'mr' ? 'कोणतीही नोंद उपलब्ध नाही' : 'No records found')}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            works.map((work, index) => (
              <tr key={work.id} className="border-t hover:bg-gray-50 transition-colors duration-200">
                <td className="px-4 py-3 font-medium">{index + 1}</td>
                <td className="px-4 py-3">{work.pesa_village_name}</td>
                <td className="px-4 py-3">{work.pesa_village_count}</td>

                {workType === 'financial' ? (
                  <>
                    <td className="px-4 py-3">₹{work.annual_approved_fund?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{work.annual_received_fund?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{work.received_interest?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{work.total_received_fund?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{work.previous_expenditure?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{work.current_expenditure?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-green-600">₹{work.cumulative_expenditure?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{work.remaining_funds?.toLocaleString()}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">{work.approved_works || 0}</td>
                    <td className="px-4 py-3">{work.sanctioned_works || 0}</td>
                    <td className="px-4 py-3">{work.completed_works || 0}</td>
                    <td className="px-4 py-3">{work.ongoing_works || 0}</td>
                    <td className="px-4 py-3">{work.pending_works || 0}</td>
                  </>
                )}
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-blue-500 hover:text-blue-700">
                    <Eye size={18} />
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
