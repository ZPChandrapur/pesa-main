import React, { useState, useEffect } from 'react';
import { Target, DollarSign, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { pesaWorkOperations } from '../../utils/supabase'; // Assuming this or similar is available for fetching all works

interface AarakhadaDistrictTableProps {
  works: any[];
  workType: 'financial' | 'physical';
  loading: boolean;
}

export function AarakhadaDistrictTable({ works, workType, loading }: AarakhadaDistrictTableProps) {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [allWorks, setAllWorks] = useState<any[]>([]);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchAllWorks = async () => {
      try {
        const allWorksData = await pesaWorkOperations.getAll(); // fetch all works data
        setAllWorks(allWorksData);
      } catch (error) {
        console.error('Error loading all works:', error);
        setAllWorks([]);
      }
    };
    fetchAllWorks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedWorks = [...works].sort((a, b) => {
    const talukaA = (a.taluka_name || '').toLowerCase();
    const talukaB = (b.taluka_name || '').toLowerCase();
    if (talukaA !== talukaB) return talukaA.localeCompare(talukaB);
    return (a.work_category || '').localeCompare(b.work_category || '');
  });

  const totalPages = Math.ceil(sortedWorks.length / rowsPerPage);
  const paginatedWorks = sortedWorks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="table-container overflow-x-auto bg-white rounded-2xl shadow-lg">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 text-gray-700 text-xs uppercase">
          {workType === 'financial' ? (
            <tr>
              <th className="px-4 py-3">{t('srNo')}</th>
              <th className="px-4 py-3">{t('talukaName')}</th>
              <th className="px-4 py-3">{t('workCategory')}</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">{t('pesaGramPanchayatCount')}</th>
              <th className="px-4 py-3">{t('pesaVillageCount')}</th>
              <th className="px-4 py-3">{t('annualApprovedFund')}</th>
              <th className="px-4 py-3">{t('annualReceivedFund')}</th>
              <th className="px-4 py-3">{t('receivedInterest')}</th>
              <th className="px-4 py-3">{t('remainingFunds')}</th>
            </tr>
          ) : (
            <tr>
              <th className="px-4 py-3">{t('srNo')}</th>
              <th className="px-4 py-3">{t('talukaName')}</th>
              <th className="px-4 py-3">{t('workCategory')}</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">{t('pesaGramPanchayatCount')}</th>
              <th className="px-4 py-3">{t('pesaVillageCount')}</th>
              <th className="px-4 py-3">{t('sanctionedWorks')}</th>
              <th className="px-4 py-3">{t('completedWorks')}</th>
              <th className="px-4 py-3">{t('ongoingWorks')}</th>
              <th className="px-4 py-3">{t('pendingWorks')}</th>
            </tr>
          )}
        </thead>
        <tbody>
          {paginatedWorks.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-lg font-medium">{t('noRecords') || 'No records found'}</p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedWorks.map((work, index) => {
              // Filter allWorks for this taluka and work category, grouped by current_status
              const completedNames =
                workType === 'physical'
                  ? allWorks
                      .filter(
                        item =>
                          item?.taluka?.trim() === (work.taluka_name || '').trim() &&
                          item?.work_category === work.work_category &&
                          item?.current_status === 'completed'
                      )
                      .map(item => item.work_name)
                      .filter(Boolean)
                  : [];

              const ongoingNames =
                workType === 'physical'
                  ? allWorks
                      .filter(
                        item =>
                          item?.taluka?.trim() === (work.taluka_name || '').trim() &&
                          item?.work_category === work.work_category &&
                          item?.current_status === 'in_progress'
                      )
                      .map(item => item.work_name)
                      .filter(Boolean)
                  : [];

              const pendingNames =
                workType === 'physical'
                  ? allWorks
                      .filter(
                        item =>
                          item?.taluka?.trim() === (work.taluka_name || '').trim() &&
                          item?.work_category === work.work_category &&
                          item?.current_status === 'pending'
                      )
                      .map(item => item.work_name)
                      .filter(Boolean)
                  : [];

              const completedTitle = completedNames.length ? completedNames.join('\n') : undefined;
              const ongoingTitle = ongoingNames.length ? ongoingNames.join('\n') : undefined;
              const pendingTitle = pendingNames.length ? pendingNames.join('\n') : undefined;

              return (
                <tr key={work.id} className="border-t hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-3 font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td className="px-4 py-3">{work.taluka_name}</td>
                  <td className="px-4 py-3">{work.work_category || 0}</td>
                  <td className="px-4 py-3">
                    {work.year ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{work.year}</span>
                    ) : '-'}
                  </td>
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
                      <td className="px-4 py-3">{work.sanctioned_works || 0}</td>
                      <td className="px-4 py-3" title={completedTitle}>
                        {work.completed_works || 0}
                      </td>
                      <td className="px-4 py-3" title={ongoingTitle}>
                        {work.ongoing_works || 0}
                      </td>
                      <td className="px-4 py-3" title={pendingTitle}>
                        {work.pending_works || 0}
                      </td>
                    </>
                  )}
                  {/* <td className="px-4 py-3 flex gap-2">
                    <button className="text-blue-500 hover:text-blue-700" title={t('view')}>
                      <Eye size={18} />
                    </button>
                  </td> */}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 mb-4">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            {t('prev')}
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-gray-200' : ''}`}
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
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}