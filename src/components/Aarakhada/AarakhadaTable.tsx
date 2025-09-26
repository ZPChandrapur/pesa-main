import React, { useState } from "react";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { AarakhadaWork } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { AarakhadaWorkForm } from './AarakhadaWorkForm';
import { workService } from "../../utils/supabase";

interface AarakhadaTableProps {
  works: AarakhadaWork[];
  workType: "financial" | "physical";
  loading: boolean;
  onEdit: (work: AarakhadaWork) => void;
  onView: (work: AarakhadaWork) => void;
  onDelete: (work: AarakhadaWork) => void;
  villages: any[];                  // Add villages prop
  workCategories: any[];            // Add workCategories prop
  workNamesMap: Record<string, Record<string, string[]>>;
  loadAllWorks:()=>void;
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
  loadAllWorks
}: AarakhadaTableProps) {
  const { t, language } = useLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<AarakhadaWork | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>("");


  const handleAddClick = (work: AarakhadaWork) => {debugger;
    const now = new Date();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const cm = `${months[now.getMonth()]}-${now.getFullYear()}`;
    // prefill with existing work but reset month for new row
    setEditingWork({
    ...work,
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
  const newWork = {
    ...savedWork,
    id: undefined, // force insert, not update
    added_month: currentMonth,
    work_type: workType,
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

  return (
    <div>
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mt-6">
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
            {works.length === 0 ? (
              <tr>
                <td colSpan={workType === "financial" ? 13 : 9} className="px-4 py-6 text-center text-gray-500">
                  {language === "mr" ? "कोणतीही कामे आढळली नाहीत" : "No works found"}
                </td>
              </tr>
            ) : (
              works.map((work, index) => (
                <tr key={work.id} className="border-t">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{work.village_name}</td>
                  <td className="px-4 py-3">{work.work_category}</td>
                  <td className="px-4 py-3">{work.year}</td>
                  <td className="px-4 py-3">{getDisplayMonth(work.added_month)}</td>
                  {workType === "financial" ? (
                    <>
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
                          title={t("addWork")}
                        >
                          <Plus size={18} />
                        </button>
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
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => window.confirm(t("confirmDelete")) && onDelete(work)}
                          title={t("delete")}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">{work.sanctioned_works ?? 0}</td>
                      <td className="px-4 py-3">{work.completed_works ?? 0}</td>
                      <td className="px-4 py-3">{work.ongoing_works ?? 0}</td>
                      <td className="px-4 py-3">{work.pending_works ?? 0}</td>
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
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => window.confirm(t("confirmDelete")) && onDelete(work)}
                          title={t("delete")}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Add form modal */}
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
