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

    const wb = XLSX.utils.book_new();

    const headers = language === 'mr'
      ? [
          'अ.क्र.',
          'जिल्हा नाव',
          'तालुका नाव',
          'कार्य प्रकार',
          'पेसा ग्रा.पं. संख्या',
          'पेसा गावे संख्या',
          'मंजूर कामे',
          'चालू मंजूर कामे',
          'पूर्ण झालेली कामे',
          'प्रगतीपथावरील कामे',
          'प्रलंबित कामे'
        ]
      : [
          'Sr. No.',
          'District Name',
          'Taluka Name',
          'Work Category',
          'PESA Gram Panchayat Count',
          'PESA Village Count',
          'Sanctioned Works',
          'Approved Works',
          'Completed Works',
          'Ongoing Works',
          'Pending Works'
        ];

    const dataRows = physicalWorks.map((work, index) => [
      index + 1,
      work.district_name || '',
      work.taluka_name || '',
      work.work_category || '',
      parseNumeric(work.pesa_gram_panchayat_count),
      parseNumeric(work.pesa_village_count),
      parseNumeric(work.sanctioned_works),
      parseNumeric(work.approved_works),
      parseNumeric(work.completed_works),
      parseNumeric(work.ongoing_works),
      parseNumeric(work.pending_works)
    ]);

    const totals = [
      language === 'mr' ? 'एकूण' : 'Total',
      '',
      '',
      '',
      physicalWorks.reduce((sum, w) => sum + parseNumeric(w.pesa_gram_panchayat_count), 0),
      physicalWorks.reduce((sum, w) => sum + parseNumeric(w.pesa_village_count), 0),
      physicalWorks.reduce((sum, w) => sum + parseNumeric(w.sanctioned_works), 0),
      physicalWorks.reduce((sum, w) => sum + parseNumeric(w.approved_works), 0),
      physicalWorks.reduce((sum, w) => sum + parseNumeric(w.completed_works), 0),
      physicalWorks.reduce((sum, w) => sum + parseNumeric(w.ongoing_works), 0),
      physicalWorks.reduce((sum, w) => sum + parseNumeric(w.pending_works), 0)
    ];

    const worksheetData = [headers, ...dataRows, totals];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 8 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 }
    ];
    ws['!cols'] = columnWidths;

    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 30 };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        if (!ws[cellAddress].s) ws[cellAddress].s = {};

        ws[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          },
          alignment: {
            horizontal: R === 0 ? 'center' : (C <= 3 ? 'left' : 'right'),
            vertical: 'center',
            wrapText: true
          },
          font: {
            bold: R === 0 || R === range.e.r,
            size: R === 0 ? 12 : 11,
            name: 'Calibri'
          },
          fill: R === 0
            ? { fgColor: { rgb: '4472C4' } }
            : R === range.e.r
            ? { fgColor: { rgb: 'E7E6E6' } }
            : undefined
        };

        if (R === 0) {
          ws[cellAddress].s.font = { ...ws[cellAddress].s.font, color: { rgb: 'FFFFFF' } };
        }

        if (C >= 4 && R > 0) {
          ws[cellAddress].z = '#,##0';
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Physical Works Report');

    const fileName = `Physical_Works_Report_${
      selectedDistrict ? `${selectedDistrict}_` : ''
    }${
      selectedTaluka ? `${selectedTaluka}_` : ''
    }${
      selectedCategory ? `Category_${selectedCategory}_` : ''
    }${new Date().toISOString().split('T')[0]}.xlsx`;

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
