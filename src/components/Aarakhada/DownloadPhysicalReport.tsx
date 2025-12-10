import * as XLSX from 'xlsx';
import { pesaSupabase } from '../../utils/supabase';

interface DownloadPhysicalReportProps {
  selectedDistrict?: string;
  selectedTaluka?: string;
  selectedCategory?: string;
  language?: 'en' | 'mr';
}

export const handleDownloadPhysicalExcel = async ({
  selectedDistrict,
  selectedTaluka,
  selectedCategory,
  language = 'en',
}: DownloadPhysicalReportProps) => {
  try {
    let physicalQuery = pesaSupabase
      .from('district_aarakhada_physical')
      .select('*');

    if (selectedDistrict) physicalQuery = physicalQuery.eq('district_name', selectedDistrict);
    if (selectedTaluka) physicalQuery = physicalQuery.eq('taluka_name', selectedTaluka);
    if (selectedCategory) physicalQuery = physicalQuery.eq('work_category', selectedCategory);

    const { data: physicalWorks, error: physicalError } = await physicalQuery;

    if (physicalError) {
      console.error('Failed to fetch physical data:', physicalError);
      alert('Failed to fetch physical report data');
      return;
    }

    if (!physicalWorks || physicalWorks.length === 0) {
      alert('No data available for the selected filters');
      return;
    }

    const parseNumeric = (val: any): number => {
      if (val == null) return 0;
      const numStr = String(val).replace(/[^\d.-]/g, '');
      return Number(numStr) || 0;
    };

    const currentDate = new Date();
    const monthNames = language === 'mr'
      ? ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    const districtsByTaluka = new Map<string, Map<string, any>>();

    physicalWorks.forEach(work => {
      const key = `${work.district_name}|${work.taluka_name}`;
      if (!districtsByTaluka.has(key)) {
        districtsByTaluka.set(key, new Map([
          ['district_name', work.district_name],
          ['taluka_name', work.taluka_name],
          ['pesa_gram_panchayat_count', work.pesa_gram_panchayat_count],
          ['pesa_village_count', work.pesa_village_count],
        ]));
      }
      const entry = districtsByTaluka.get(key)!;
      const category = work.work_category;
      entry.set(`${category}_sanctioned`, parseNumeric(work.sanctioned_works));
      entry.set(`${category}_approved`, parseNumeric(work.approved_works));
      entry.set(`${category}_completed`, parseNumeric(work.completed_works));
      entry.set(`${category}_ongoing`, parseNumeric(work.ongoing_works));
      entry.set(`${category}_pending`, parseNumeric(work.pending_works));
    });

    const wb = XLSX.utils.book_new();
    const wsData: any[][] = [];

    const titleText = language === 'mr'
      ? `पेसा कामांचा भौतिक अहवाल - ${monthName} ${year}`
      : `PESA Physical Works Report - ${monthName} ${year}`;

    wsData.push([titleText]);
    wsData.push([]);

    const categoryLabels = language === 'mr'
      ? { A: 'प्रकार अ', B: 'प्रकार ब', C: 'प्रकार क', D: 'प्रकार ड' }
      : { A: 'Category A', B: 'Category B', C: 'Category C', D: 'Category D' };

    const workStatusLabels = language === 'mr'
      ? ['मंजूर', 'चालू मंजूर', 'पूर्ण', 'प्रगतीपथावर', 'प्रलंबित']
      : ['Sanctioned', 'Approved', 'Completed', 'Ongoing', 'Pending'];

    const headerRow1 = [
      language === 'mr' ? 'अ.क्र.' : 'Sr. No.',
      language === 'mr' ? 'जिल्हा' : 'District',
      language === 'mr' ? 'तालुका' : 'Taluka',
      language === 'mr' ? 'पेसा ग्रा.पं.' : 'PESA GP',
      language === 'mr' ? 'पेसा गावे' : 'PESA Villages',
    ];

    ['A', 'B', 'C', 'D'].forEach(cat => {
      if (!selectedCategory || selectedCategory === cat) {
        headerRow1.push(categoryLabels[cat as keyof typeof categoryLabels]);
        headerRow1.push('', '', '', '');
      }
    });

    if (!selectedCategory) {
      headerRow1.push(language === 'mr' ? 'एकूण' : 'Total');
      headerRow1.push('', '', '', '');
    }

    wsData.push(headerRow1);

    const headerRow2 = ['', '', '', '', ''];
    ['A', 'B', 'C', 'D'].forEach(cat => {
      if (!selectedCategory || selectedCategory === cat) {
        workStatusLabels.forEach(label => headerRow2.push(label));
      }
    });

    if (!selectedCategory) {
      workStatusLabels.forEach(label => headerRow2.push(label));
    }

    wsData.push(headerRow2);

    const dataRowsArray = Array.from(districtsByTaluka.values());
    dataRowsArray.forEach((entry, index) => {
      const row = [
        index + 1,
        entry.get('district_name') || '',
        entry.get('taluka_name') || '',
        parseNumeric(entry.get('pesa_gram_panchayat_count')),
        parseNumeric(entry.get('pesa_village_count')),
      ];

      let totalSanctioned = 0;
      let totalApproved = 0;
      let totalCompleted = 0;
      let totalOngoing = 0;
      let totalPending = 0;

      ['A', 'B', 'C', 'D'].forEach(cat => {
        if (!selectedCategory || selectedCategory === cat) {
          const sanctioned = entry.get(`${cat}_sanctioned`) || 0;
          const approved = entry.get(`${cat}_approved`) || 0;
          const completed = entry.get(`${cat}_completed`) || 0;
          const ongoing = entry.get(`${cat}_ongoing`) || 0;
          const pending = entry.get(`${cat}_pending`) || 0;

          row.push(sanctioned, approved, completed, ongoing, pending);

          if (!selectedCategory) {
            totalSanctioned += sanctioned;
            totalApproved += approved;
            totalCompleted += completed;
            totalOngoing += ongoing;
            totalPending += pending;
          }
        }
      });

      if (!selectedCategory) {
        row.push(totalSanctioned, totalApproved, totalCompleted, totalOngoing, totalPending);
      }

      wsData.push(row);
    });

    const totalRow = [
      language === 'mr' ? 'एकूण' : 'Total',
      '', '',
      dataRowsArray.reduce((sum, entry) => sum + parseNumeric(entry.get('pesa_gram_panchayat_count')), 0),
      dataRowsArray.reduce((sum, entry) => sum + parseNumeric(entry.get('pesa_village_count')), 0),
    ];

    let grandTotalSanctioned = 0;
    let grandTotalApproved = 0;
    let grandTotalCompleted = 0;
    let grandTotalOngoing = 0;
    let grandTotalPending = 0;

    ['A', 'B', 'C', 'D'].forEach(cat => {
      if (!selectedCategory || selectedCategory === cat) {
        const catSanctioned = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_sanctioned`) || 0), 0);
        const catApproved = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_approved`) || 0), 0);
        const catCompleted = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_completed`) || 0), 0);
        const catOngoing = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_ongoing`) || 0), 0);
        const catPending = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_pending`) || 0), 0);

        totalRow.push(catSanctioned, catApproved, catCompleted, catOngoing, catPending);

        if (!selectedCategory) {
          grandTotalSanctioned += catSanctioned;
          grandTotalApproved += catApproved;
          grandTotalCompleted += catCompleted;
          grandTotalOngoing += catOngoing;
          grandTotalPending += catPending;
        }
      }
    });

    if (!selectedCategory) {
      totalRow.push(grandTotalSanctioned, grandTotalApproved, grandTotalCompleted, grandTotalOngoing, grandTotalPending);
    }

    wsData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const merges: XLSX.Range[] = [];

    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: headerRow1.length - 1 } });

    let colIndex = 5;
    ['A', 'B', 'C', 'D'].forEach(cat => {
      if (!selectedCategory || selectedCategory === cat) {
        merges.push({ s: { r: 2, c: colIndex }, e: { r: 2, c: colIndex + 4 } });
        colIndex += 5;
      }
    });

    if (!selectedCategory) {
      merges.push({ s: { r: 2, c: colIndex }, e: { r: 2, c: colIndex + 4 } });
    }

    merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 0 } });
    merges.push({ s: { r: 3, c: 1 }, e: { r: 3, c: 1 } });
    merges.push({ s: { r: 3, c: 2 }, e: { r: 3, c: 2 } });
    merges.push({ s: { r: 3, c: 3 }, e: { r: 3, c: 3 } });
    merges.push({ s: { r: 3, c: 4 }, e: { r: 3, c: 4 } });

    merges.push({ s: { r: wsData.length - 1, c: 1 }, e: { r: wsData.length - 1, c: 2 } });

    ws['!merges'] = merges;

    const columnWidths: XLSX.ColInfo[] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
    ];

    const numCategories = selectedCategory ? 1 : 4;
    for (let i = 0; i < numCategories * 5; i++) {
      columnWidths.push({ wch: 12 });
    }

    if (!selectedCategory) {
      for (let i = 0; i < 5; i++) {
        columnWidths.push({ wch: 12 });
      }
    }

    ws['!cols'] = columnWidths;

    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 25 };
    ws['!rows'][2] = { hpt: 25 };
    ws['!rows'][3] = { hpt: 25 };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: '' };
        if (!ws[cellAddress].s) ws[cellAddress].s = {};

        let cellStyle: any = {
          alignment: {
            horizontal: 'center',
            vertical: 'center',
            wrapText: true
          },
          font: {
            name: 'Calibri',
            size: 11
          }
        };

        if (R === 0) {
          cellStyle.font = { ...cellStyle.font, bold: true, size: 14, color: { rgb: 'FFFFFF' } };
          cellStyle.fill = { fgColor: { rgb: '4472C4' } };
          cellStyle.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (R === 2 || R === 3) {
          cellStyle.font = { ...cellStyle.font, bold: true, size: 10, color: { rgb: 'FFFFFF' } };
          cellStyle.fill = { fgColor: { rgb: '5B9BD5' } };
          cellStyle.border = {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          };
        } else if (R === wsData.length - 1) {
          cellStyle.font = { ...cellStyle.font, bold: true };
          cellStyle.fill = { fgColor: { rgb: 'D9D9D9' } };
          cellStyle.border = {
            top: { style: 'medium', color: { rgb: '000000' } },
            bottom: { style: 'medium', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          };
          if (C >= 3) {
            cellStyle.alignment = { horizontal: 'right', vertical: 'center' };
          }
        } else if (R > 3) {
          cellStyle.border = {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          };
          if (C === 0) {
            cellStyle.alignment = { horizontal: 'center', vertical: 'center' };
          } else if (C <= 2) {
            cellStyle.alignment = { horizontal: 'left', vertical: 'center' };
          } else {
            cellStyle.alignment = { horizontal: 'right', vertical: 'center' };
          }
        }

        if (C >= 3 && R > 3 && R < wsData.length - 1) {
          ws[cellAddress].z = '#,##0';
        }

        ws[cellAddress].s = cellStyle;
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Physical Works Report');

    const fileName = `Physical_Works_Report_${monthName}_${year}_${
      selectedDistrict ? `${selectedDistrict}_` : ''
    }${
      selectedTaluka ? `${selectedTaluka}_` : ''
    }${
      selectedCategory ? `Category_${selectedCategory}_` : ''
    }.xlsx`;

    XLSX.writeFile(wb, fileName);

    return true;
  } catch (error) {
    console.error('Error generating physical report:', error);
    alert('Failed to generate physical report. Please try again.');
    return false;
  }
};

export const DownloadPhysicalReportButton = ({
  selectedDistrict,
  selectedTaluka,
  selectedCategory,
  language,
  className = '',
  children
}: DownloadPhysicalReportProps & {
  className?: string;
  children?: React.ReactNode;
}) => {
  const handleClick = async () => {
    await handleDownloadPhysicalExcel({
      selectedDistrict,
      selectedTaluka,
      selectedCategory,
      language,
    });
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
};
