import React, { useState, useEffect } from 'react';
import { DollarSign, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { pesaWorkOperations } from '../../utils/supabase'; // Assuming this or similar is available to fetch all works

interface AarakhadaTalukaTableProps {
  works: any[];
  workType: 'financial' | 'physical';
  loading: boolean;
  userId?: string;
  roleName?: string;
  allowedGramPanchayats?: string[];
}

export function AarakhadaTalukaTable({
  works,
  workType,
  loading,
  userId,
  roleName,
  allowedGramPanchayats = [],
}: AarakhadaTalukaTableProps) {
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
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter works where work.gram_panchayat matches any item in allowedGramPanchayats
  const filteredWorks = ['district', 'developer', 'super_admin'].includes(roleName?.trim().toLowerCase())
    ? works // show all works for district-level
    : works.filter(work =>
      allowedGramPanchayats.some(
        gp => gp.trim().toLowerCase() === (work.gram_panchayat || '').trim().toLowerCase()
      )
    );


  const PAGE_WINDOW = 5;

  const getVisiblePages = () => {
    if (totalPages <= PAGE_WINDOW) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(PAGE_WINDOW / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + PAGE_WINDOW - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < PAGE_WINDOW) {
      start = Math.max(1, end - PAGE_WINDOW + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const totalPages = Math.ceil(filteredWorks.length / rowsPerPage);
  const paginatedWorks = filteredWorks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="table-container overflow-x-auto bg-white rounded-2xl shadow-lg">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 text-xs uppercase">
          {workType === 'financial' ? (
            <tr>
              <th className="px-4 py-3">{t('srNo')}</th>
              <th className="px-4 py-3">{t('gramPanchayat')}</th>
              <th className="px-4 py-3">{t('workCategory')}</th>
              <th className="px-4 py-3">{t('pesaVillageCount')}</th>
              <th className="px-4 py-3">{t('annualApprovedFund')}</th>
              <th className="px-4 py-3">{t('annualReceivedFund')}</th>
              <th className="px-4 py-3">{t('receivedInterest')}</th>
              <th className="px-4 py-3">{t('totalReceivedFund')}</th>
              <th className="px-4 py-3">{t('previousExpenditure')}</th>
              <th className="px-4 py-3">{t('currentExpenditure')}</th>
              <th className="px-4 py-3">{t('cumulativeExpenditure')}</th>
              <th className="px-4 py-3">{t('remainingFunds')}</th>
              {/* <th className="px-4 py-3">{t('actions')}</th> */}
            </tr>
          ) : (
            <tr>
              <th className="px-4 py-3">{t('srNo')}</th>
              <th className="px-4 py-3">{t('gramPanchayat')}</th>
              <th className="px-4 py-3">{t('workCategory')}</th>
              <th className="px-4 py-3">{t('pesaVillageCount')}</th>
              <th className="px-4 py-3">{t('sanctionedWorks')}</th>
              <th className="px-4 py-3">{t('completedWorks')}</th>
              <th className="px-4 py-3">{t('ongoingWorks')}</th>
              <th className="px-4 py-3">{t('pendingWorks')}</th>
              {/* <th className="px-4 py-3">{t('actions')}</th> */}
            </tr>
          )}
        </thead>
        <tbody>
          {paginatedWorks.length === 0 ? (
            <tr>
              <td colSpan={workType === 'financial' ? 13 : 9} className="px-4 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-lg font-medium">{t('noRecords') || 'No records found'}</p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedWorks.map((work, index) => {
              const completedNames =
                workType === 'physical'
                  ? allWorks
                    .filter(
                      item =>
                        item?.pesa_grampanchayat?.trim() === (work.gram_panchayat || '').trim() &&
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
                        item?.pesa_grampanchayat?.trim() === (work.gram_panchayat || '').trim() &&
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
                        item?.pesa_grampanchayat?.trim() === (work.gram_panchayat || '').trim() &&
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
                  <td className="px-4 py-3">{work.gram_panchayat || '-'}</td>
                  <td className="px-4 py-3">{work.work_category || 0}</td>
                  <td className="px-4 py-3">{work.pesa_village_count || 0}</td>
                  {workType === 'financial' ? (
                    <>
                      <td className="px-4 py-3">₹{work.annual_approved_fund?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3">₹{work.annual_received_fund?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3">₹{work.received_interest?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3">₹{work.total_received_fund?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3">₹{work.previous_expenditure?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3">₹{work.current_expenditure?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3 font-bold text-green-600">
                        ₹{work.cumulative_expenditure?.toLocaleString() ?? 0}
                      </td>
                      <td className="px-4 py-3">₹{work.remaining_funds?.toLocaleString() ?? 0}</td>
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
        <div className="flex justify-center items-center gap-2 mt-4 mb-4">

          {/* Prev */}
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            {t("prev")}
          </button>

          {/* First page */}
          {currentPage > 3 && (
            <>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              <span className="px-1">…</span>
            </>
          )}

          {/* Middle pages */}
          {getVisiblePages().map(page => (
            <button
              key={page}
              className={`px-3 py-1 border rounded ${currentPage === page ? "bg-gray-200 font-semibold" : ""
                }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          {/* Last page */}
          {currentPage < totalPages - 2 && (
            <>
              <span className="px-1">…</span>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next */}
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
}
