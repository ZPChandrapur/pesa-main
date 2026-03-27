import React, { useEffect, useState } from "react";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { AarakhadaWork } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { AarakhadaWorkForm } from './AarakhadaWorkForm';
import { pesaWorkOperations, workService } from "../../utils/supabase";

interface AarakhadaTableProps {
  works: AarakhadaWork[];
  workType: "financial" | "physical";
  loading: boolean;
  onEdit: (work: AarakhadaWork) => void;
  onView: (work: AarakhadaWork) => void;
  onDelete: (work: AarakhadaWork) => void;
  villages: any[];
  workCategories: any[];
  workNamesMap: Record<string, Record<string, string[]>>;
  loadAllWorks: () => void;
  userId?: string;
  roleName?: string;
}

export function AarakhadaTable({
  works,
  workType,
  loading,
  onEdit,
  onView,
  onDelete,
  villages,
  workCategories,
  workNamesMap,
  loadAllWorks,
  userId,
  roleName
}: AarakhadaTableProps) {
  const { t, language } = useLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<AarakhadaWork | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [allWorks, setAllWorks] = useState<AarakhadaWork[]>([]);
  // Pagination state
  const rowsPerPage = 10; // adjust as needed
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchAllWorks = async () => {
      try {
        const allWorksData = await pesaWorkOperations.getAll();
        setAllWorks(allWorksData);
      } catch (error) {
        console.error("Error loading works:", error);
        setAllWorks([]);
      }
    };
    fetchAllWorks();
  }, []);

  const handleAddClick = (work: AarakhadaWork) => {
    const now = new Date();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const cm = `${months[now.getMonth()]}-${now.getFullYear()}`;
    const duplicateExists = works.some(w =>
      w.work_type === 'financial' &&
      (w.village_name || '').trim() === (work.village_name || '').trim() &&
      w.work_category === work.work_category &&
      (w.work_name || '').trim() === (work.work_name || '').trim() &&
      w.added_month === cm
    );
    if (duplicateExists) {
      return;
    }
    setEditingWork({
      ...work,
      // remove id so the form treats this as "add new entry" (not editing existing row)
      id: undefined,
      added_month: cm,
      previous_expenditure: work.cumulative_expenditure,
      current_expenditure: '',
    });
    setCurrentMonth(cm);
    setIsAddOpen(true);
  };

  const handleCloseForm = () => {
    setIsAddOpen(false);
    setEditingWork(null);
    setCurrentMonth("");
  };

  const handleSaveWork = async (savedWork: AarakhadaWork) => {
    // Prefer the month chosen/edited in the form; fallback to currentMonth
    const newWork = {
      ...savedWork,
      id: undefined,
      work_type: workType,
      added_month: savedWork.added_month || currentMonth,
    };
    await workService.insert(newWork);
    setIsAddOpen(false);
    loadAllWorks()
  };

  const getDisplayMonth = (addedMonth: string) => {
    if (!addedMonth) return "-";
    return addedMonth;
  };

  if (loading)
    return (
      <div className="text-center py-10">
        {t("loading...")}
      </div>
    );

  // Filter works based on access
  const filteredWorks = ['district', 'developer', 'super_admin','admin'].includes(roleName?.trim().toLowerCase())
    ? works // show all works, skip userId check
    : ['taluka'].includes(roleName?.trim().toLowerCase())
      ? works.filter(work => {
        if (!userId) return true;
        return villages.some(v => v.gram_panchayat === work.gram_panchayat);
      })
      : works.filter(work => {
        if (!userId) return true;
        const allowed = villages.some(v =>
          (v.gram_user_access && v.gram_user_access === userId && work.gram_panchayat === v.gram_panchayat) ||
          (v.tal_user_access && v.tal_user_access === userId && work.taluka === v.taluka)
        );
        return allowed;
      });


  // PAGINATION:
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
    <div>
      <div className="table-container overflow-x-auto bg-white rounded-2xl shadow-lg mt-6">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">{t("srNo")}</th>
              <th className="px-4 py-3">{t("villageName")}</th>
              <th className="px-4 py-3">{t("workCategory")}</th>
              <th className="px-4 py-3">{t("year")}</th>
              <th className="px-4 py-3">{t("month")}</th>
              {workType === "financial" && (
                <>
                  <th className="px-4 py-3">{t("workName")}</th>
                  <th className="px-4 py-3">{t("sanctionedAmount")}</th>
                  <th className="px-4 py-3">{t("releasedAmount")}</th>
                  <th className="px-4 py-3">{t("previousMonthExpenditure")}</th>
                  <th className="px-4 py-3">{t("currentMonthExpenditure")}</th>
                  <th className="px-4 py-3">{t("cumulativeExpenditure")}</th>
                  <th className="px-4 py-3">{t("remainingFunds")}</th>
                  <th className="px-4 py-3">{t("actions")}</th>
                </>
              )}
              {workType === "physical" && (
                <>
                  <th className="px-4 py-3">{t("sanctionedWorks")}</th>
                  <th className="px-4 py-3">{t("completedWorks")}</th>
                  <th className="px-4 py-3">{t("ongoingWorks")}</th>
                  <th className="px-4 py-3">{t("pendingWorks")}</th>
                  <th className="px-4 py-3">{t("action")}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedWorks.length === 0 ? (
              <tr>
                <td colSpan={workType === "financial" ? 13 : 9} className="px-4 py-6 text-center text-gray-500">
                  {language === "mr" ? "कोणतीही कामे आढळली नाहीत" : "No works found"}
                </td>
              </tr>
            ) : (
              paginatedWorks.map((work, index) => {
                const completedNames = allWorks
                  .filter(item =>
                    item?.village?.village_name?.trim() === work.village_name?.trim() &&
                    item?.work_category === work.work_category &&
                    item?.current_status === "completed"
                  )
                  .map(item => item.work_name)
                  .filter(Boolean);

                const ongoingNames = allWorks
                  .filter(item =>
                    item?.village?.village_name?.trim() === work.village_name?.trim() &&
                    item?.work_category === work.work_category &&
                    item?.current_status === "in_progress"
                  )
                  .map(item => item.work_name)
                  .filter(Boolean);

                const pendingNames = allWorks
                  .filter(item =>
                    item?.village?.village_name?.trim() === work.village_name?.trim() &&
                    item?.work_category === work.work_category &&
                    item?.current_status === "pending"
                  )
                  .map(item => item.work_name)
                  .filter(Boolean);

                const completedTitle = completedNames.length ? completedNames.join("\n") : undefined;
                const ongoingTitle = ongoingNames.length ? ongoingNames.join("\n") : undefined;
                const pendingTitle = pendingNames.length ? pendingNames.join("\n") : undefined;

                return (
                  <tr key={work.id} className="border-t">
                    <td className="px-4 py-3">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="px-4 py-3">{work.village_name}</td>
                    <td className="px-4 py-3">{work.work_category}</td>
                    <td className="px-4 py-3">{work.year}</td>
                    <td className="px-4 py-3">{getDisplayMonth(work.added_month)}</td>
                    {workType === "financial" ? (
                      <>
                        <td className="px-4 py-3 text-xs">{work.work_name}</td>
                        <td className="px-4 py-3">{work.sanctioned_amount?.toLocaleString() ?? 0}</td>
                        <td className="px-4 py-3">{work.released_amount?.toLocaleString() ?? 0}</td>
                        <td className="px-4 py-3">{work.previous_expenditure?.toLocaleString() ?? 0}</td>
                        <td className="px-4 py-3">{work.current_expenditure?.toLocaleString() ?? 0}</td>
                        <td className="px-4 py-3">{work.cumulative_expenditure?.toLocaleString() ?? 0}</td>
                        <td className="px-4 py-3">{work.remaining_funds?.toLocaleString() ?? 0}</td>
                        <td className="px-4 py-3 flex gap-2 items-center">
                          <button
                            className="text-purple-600 hover:text-purple-800"
                            onClick={() => handleAddClick(work)}
                            title={
                              work.released_amount === 0
                                ? t('releaseAmountTitle')
                                : (() => {
                                  const now = new Date();
                                  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                  const cm = `${months[now.getMonth()]}-${now.getFullYear()}`;
                                  const exists = works.some(w => w.work_type === 'financial' && (w.village_name || '').trim() === (work.village_name || '').trim() && w.work_category === work.work_category && (w.work_name || '').trim() === (work.work_name || '').trim() && w.added_month === cm);
                                  return exists ? t('sameMonthEntryTitle') : t('addWork');
                                })()
                            }
                            disabled={
                              work.released_amount === 0 || (() => {
                                const now = new Date();
                                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                const cm = `${months[now.getMonth()]}-${now.getFullYear()}`;
                                const exists = works.some(w => w.work_type === 'financial' && (w.village_name || '').trim() === (work.village_name || '').trim() && w.work_category === work.work_category && (w.work_name || '').trim() === (work.work_name || '').trim() && w.added_month === cm);
                                return exists;
                              })()
                            }
                          >
                            <Plus size={18} />
                          </button>

                          <button
                            className="text-green-500 hover:text-green-700"
                            onClick={() => {
                              const status = (work.status || '').trim();
                              if (status === 'pending') {
                                return;
                              }
                              onEdit(work);
                            }}
                            title={((work.status || '').trim() === 'pending')
                              ? t('pendingTitle')
                              : t('edit')}
                            disabled={(work.status || '').trim() === 'pending'}
                          >
                            <Edit size={18} />
                          </button>


                          <button
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => onView(work)}
                            title={t("view")}
                          >
                            <Eye size={18} />
                          </button>
                          {/* {roleName?.trim().toLowerCase() != 'grampanchayat' &&(
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => window.confirm(t("confirmDelete")) && onDelete(work)}
                              title={t("delete")}
                            >
                              <Trash2 size={18} />
                            </button>
                          )} */}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">{work.sanctioned_works ?? 0}</td>
                        <td className="px-4 py-3" title={completedTitle}>{work.completed_works ?? 0}</td>
                        <td className="px-4 py-3" title={ongoingTitle}>{work.ongoing_works ?? 0}</td>
                        <td className="px-4 py-3" title={pendingTitle}>{work.pending_works ?? 0}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            className="text-green-500 hover:text-green-700"
                            onClick={() => onEdit(work)}
                            title={t("edit")}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => onView(work)}
                            title={t("view")}
                          >
                            <Eye size={18} />
                          </button>
                          {/* {roleName?.trim().toLowerCase() != 'grampanchayat' && (
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => window.confirm(t("confirmDelete")) && onDelete(work)}
                              title={t("delete")}
                            >
                              <Trash2 size={18} />
                            </button>
                          )} */}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* PAGINATION UI */}
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
      {isAddOpen && (
        <AarakhadaWorkForm
          isOpen={isAddOpen}
          onClose={handleCloseForm}
          onSave={handleSaveWork}
          workType={workType}
          villages={villages}
          workCategories={workCategories}
          editingWork={editingWork}
          workNamesMap={workNamesMap}
          currentMonth={currentMonth}
        />
      )}
    </div>
  );
}
