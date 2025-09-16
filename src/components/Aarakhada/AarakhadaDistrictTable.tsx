import React from 'react';
import { Target, DollarSign, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AarakhadaDistrictTableProps {
  works: any[];
  workType: 'financial' | 'physical';
  loading: boolean;
}

export function AarakhadaDistrictTable({ works, workType, loading }: AarakhadaDistrictTableProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 text-gray-700 text-xs uppercase">
          {workType === 'financial' ? (
            <tr>
              <th className="px-4 py-3">{t('srNo')}</th>
              <th className="px-4 py-3">{t('talukaName')}</th>
              <th className="px-4 py-3">{t('pesaGramPanchayatCount')}</th>
              <th className="px-4 py-3">{t('pesaVillageCount')}</th>
              <th className="px-4 py-3">{t('annualApprovedFund')}</th>
              <th className="px-4 py-3">{t('annualReceivedFund')}</th>
              <th className="px-4 py-3">{t('receivedInterest')}</th>
              <th className="px-4 py-3">{t('remainingFunds')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          ) : (
            <tr>
              <th className="px-4 py-3">{t('srNo')}</th>
              <th className="px-4 py-3">{t('talukaName')}</th>
              <th className="px-4 py-3">{t('pesaGramPanchayatCount')}</th>
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
        <tbody>
          {works.length === 0 ? (
            <tr>
              <td
                colSpan={workType === 'financial' ? 9 : 10}
                className="px-4 py-8 text-center text-gray-500"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-lg font-medium">
                    {t('noRecords') || 'No records found'}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            works.map((work, index) => (
              <tr key={work.id} className="border-t hover:bg-gray-50 transition-colors duration-200">
                <td className="px-4 py-3 font-medium">{index + 1}</td>
                <td className="px-4 py-3">{work.taluka_name}</td>
                <td className="px-4 py-3">{work.pesa_gram_panchayat_count}</td>
                <td className="px-4 py-3">{work.pesa_village_count}</td>

                {workType === 'financial' ? (
                  <>
                    <td className="px-4 py-3">₹{work.annual_approved_fund?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{work.annual_received_fund?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{work.received_interest?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-green-600">₹{work.remaining_funds?.toLocaleString()}</td>
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
