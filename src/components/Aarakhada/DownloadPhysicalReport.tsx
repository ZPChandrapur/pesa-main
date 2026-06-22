import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { pesaSupabase } from '../../utils/supabase';

interface DownloadPhysicalReportProps {
    selectedDistrict?: string;
    selectedTaluka?: string;
    selectedCategory?: string;
    selectedYear?: number | string;
    language?: 'en' | 'mr';
}

export const handleDownloadPhysicalExcel = async ({
    selectedDistrict,
    selectedTaluka,
    selectedCategory,
    selectedYear,
    language = 'en',
}: DownloadPhysicalReportProps) => {
    try {
        let physicalQuery = pesaSupabase
            .from('district_aarakhada_physical')
            .select('*');

        if (selectedDistrict) physicalQuery = physicalQuery.eq('district_name', selectedDistrict);
        if (selectedTaluka) physicalQuery = physicalQuery.eq('taluka_name', selectedTaluka);
        if (selectedCategory) physicalQuery = physicalQuery.eq('work_category', selectedCategory);
        if (selectedYear) physicalQuery = physicalQuery.eq('year', selectedYear);

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

        // DEBUG: Log total records fetched
        console.log('Total records fetched for Excel:', physicalWorks.length);
        let sumFromExcel = 0;

        physicalWorks.forEach(work => {
            const key = `${work.district_name}|${work.taluka_name}`;
            if (!districtsByTaluka.has(key)) {
                districtsByTaluka.set(key, new Map([
                    ['taluka_name', work.taluka_name],
                    ['pesa_gram_panchayat_count', work.pesa_gram_panchayat_count],
                    ['pesa_village_count', work.pesa_village_count],
                    ['total_sanctioned', parseNumeric(work.sanctioned_works)],
                ]));
            }
            const entry = districtsByTaluka.get(key)!;
            const category = work.work_category;
            entry.set(`${category}_sanctioned`, (entry.get(`${category}_sanctioned`) || 0) + parseNumeric(work.sanctioned_works));
            entry.set(`${category}_approved`, (entry.get(`${category}_approved`) || 0) + parseNumeric(work.approved_works));
            entry.set(`${category}_completed`, (entry.get(`${category}_completed`) || 0) + parseNumeric(work.completed_works));
            entry.set(`${category}_ongoing`, (entry.get(`${category}_ongoing`) || 0) + parseNumeric(work.ongoing_works));
            entry.set(`${category}_pending`, (entry.get(`${category}_pending`) || 0) + parseNumeric(work.pending_works));
            sumFromExcel += parseNumeric(work.sanctioned_works);
        });

        console.log('Sum from individual records:', sumFromExcel);
        console.log('Total unique talukas:', districtsByTaluka.size);

        const wsData: any[][] = [];

        const titleText = language === 'mr'
            ? ` पेसा 5% थेट निधी योजना भौतिक प्रगती अहवाल सन - ${year} (प्रपत्र क्र.- 3 जिल्हा परिषद स्तरीय अहवाल)`
            : `PESA Physical Works Report - ${monthName} ${year}`;

        wsData.push([titleText]);
        wsData.push([]);

        const categoryLabels = language === 'mr'
            ? { A: 'पायाभूत सुविधा', B: 'वनहक्क अधिनियम (FRA) व पेसा अंमलबजावणी', C: 'आरोग्य, स्वच्छता व शिक्षण', D: 'वनीकरण, वन्यजीव संवर्धन, जलसंधारण, वनतळी, वन्यजीव पर्यटन व वन उपजिविका' }
            : { A: 'Infrastructure', B: 'Forest Rights Act (FRA) and PESA Implementation', C: 'Health, Sanitation and Education', D: 'Afforestation, Wildlife Conservation, Water Conservation, Forest Ponds, Wildlife Tourism, and Forest Livelihood' };

        const workStatusLabels = language === 'mr'
            ? ['मंजुर कामे', 'पुर्ण झालेली कामे', 'प्रगती पथावरील कामे', 'अद्याप सुरु न झालेली कामे']
            : ['Sanctioned', 'Completed', 'Ongoing', 'Pending'];

        const headerRow1 = [
            language === 'mr' ? 'अ.क्र.' : 'Sr. No.',
            language === 'mr' ? 'तालुका' : 'Taluka',
            language === 'mr' ? 'पेसा ग्रा.पं. संख्या' : 'PESA GP',
            language === 'mr' ? 'पेसा गावांची संख्या' : 'PESA Villages',
            language === 'mr' ? 'चालू वर्षातील मंजूर कामांची संख्या 2024-25' : 'Sanctioned Works in Current Year 2024-25',
        ];

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                headerRow1.push(categoryLabels[cat as keyof typeof categoryLabels]);
                headerRow1.push('', '', '');

            }
        });

        if (!selectedCategory) {
            headerRow1.push(language === 'mr' ? 'एकूण' : 'Total');
            headerRow1.push('', '');
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
                entry.get('taluka_name') || '',
                parseNumeric(entry.get('pesa_gram_panchayat_count')),
                parseNumeric(entry.get('pesa_village_count')),
                parseNumeric(entry.get('A_sanctioned')) +
                parseNumeric(entry.get('B_sanctioned')) +
                parseNumeric(entry.get('C_sanctioned')) +
                parseNumeric(entry.get('D_sanctioned')),
            ];

            let totalSanctioned = 0;
            let totalCompleted = 0;
            let totalOngoing = 0;
            let totalPending = 0;

            ['A', 'B', 'C', 'D'].forEach(cat => {
                if (!selectedCategory || selectedCategory === cat) {
                    const sanctioned = entry.get(`${cat}_sanctioned`) || 0;
                    const completed = entry.get(`${cat}_completed`) || 0;
                    const ongoing = entry.get(`${cat}_ongoing`) || 0;
                    const pending = entry.get(`${cat}_pending`) || 0;

                    row.push(sanctioned, completed, ongoing, pending);

                    if (!selectedCategory) {
                        totalSanctioned += sanctioned;
                        totalCompleted += completed;
                        totalOngoing += ongoing;
                        totalPending += pending;
                    }
                }
            });

            if (!selectedCategory) {
                row.push(totalSanctioned, totalCompleted, totalOngoing, totalPending);
            }

            wsData.push(row);
        });

        const totalRow = [
            language === 'mr' ? 'एकूण' : 'Total',
            '',
            dataRowsArray.reduce((sum, entry) => sum + parseNumeric(entry.get('pesa_gram_panchayat_count')), 0),
            dataRowsArray.reduce((sum, entry) => sum + parseNumeric(entry.get('pesa_village_count')), 0),
            dataRowsArray.reduce((sum, entry) => sum + (
                parseNumeric(entry.get('A_sanctioned')) +
                parseNumeric(entry.get('B_sanctioned')) +
                parseNumeric(entry.get('C_sanctioned')) +
                parseNumeric(entry.get('D_sanctioned'))
            ), 0),
        ];


        let grandTotalSanctioned = 0;
        let grandTotalCompleted = 0;
        let grandTotalOngoing = 0;
        let grandTotalPending = 0;

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                const catSanctioned = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_sanctioned`) || 0), 0);
                const catCompleted = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_completed`) || 0), 0);
                const catOngoing = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_ongoing`) || 0), 0);
                const catPending = dataRowsArray.reduce((sum, entry) => sum + (entry.get(`${cat}_pending`) || 0), 0);

                totalRow.push(catSanctioned, catCompleted, catOngoing, catPending);

                if (!selectedCategory) {
                    grandTotalSanctioned += catSanctioned;
                    grandTotalCompleted += catCompleted;
                    grandTotalOngoing += catOngoing;
                    grandTotalPending += catPending;
                }
            }
        });

        if (!selectedCategory) {
            totalRow.push(grandTotalSanctioned, grandTotalCompleted, grandTotalOngoing, grandTotalPending);
        }

        wsData.push([]);
        wsData.push([]);
        wsData.push([]);
        wsData.push(totalRow);

        const totalColumns = headerRow1.length;
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Physical Works Report');

        const colWidths: { width: number }[] = [];
        colWidths.push({ width: 8 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 35 });
        const numCategories = selectedCategory ? 1 : 4;
        for (let i = 0; i < numCategories * 4; i++) {
            colWidths.push({ width: 14 });
        }
        if (!selectedCategory) {
            for (let i = 0; i < 4; i++) {
                colWidths.push({ width: 14 });
            }
        }
        ws.columns = colWidths;

        wsData.forEach(rowData => {
            ws.addRow(rowData);
        });

        ws.mergeCells(1, 1, 1, totalColumns);

        let colIdx = 6;
        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                ws.mergeCells(3, colIdx, 3, colIdx + 3);
                colIdx += 4;
            }
        });
        if (!selectedCategory) {
            ws.mergeCells(3, colIdx, 3, colIdx + 3);
        }

        ws.mergeCells(3, 1, 4, 1);
        ws.mergeCells(3, 2, 4, 2);
        ws.mergeCells(3, 3, 4, 3);
        ws.mergeCells(3, 4, 4, 4);
        ws.mergeCells(3, 5, 4, 5);

        const lastRowNum = wsData.length;
        ws.mergeCells(lastRowNum, 1, lastRowNum, 2);

        ws.getRow(1).height = 30;
        ws.getRow(3).height = 55;
        ws.getRow(4).height = 30;

        const thinBorder = {
            top: { style: 'thin' as const, color: { argb: 'FF000000' } },
            bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
            left: { style: 'thin' as const, color: { argb: 'FF000000' } },
            right: { style: 'thin' as const, color: { argb: 'FF000000' } },
        };

        wsData.forEach((rowData, rowIdx) => {
            const R = rowIdx;
            const excelRow = ws.getRow(R + 1);

            rowData.forEach((cellValue: any, colIdx: number) => {
                const cell = excelRow.getCell(colIdx + 1);
                const C = colIdx;

                cell.font = { name: 'Calibri', size: 11 };
                cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };

                if (R === 0) {
                    cell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
                } else if (R === 2 || R === 3) {
                    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
                    cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
                    cell.border = thinBorder;
                } else if (R === lastRowNum - 1) {
                    cell.font = { name: 'Calibri', size: 12, bold: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
                    cell.border = {
                        top: { style: 'medium', color: { argb: 'FF000000' } },
                        bottom: { style: 'medium', color: { argb: 'FF000000' } },
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };
                    if (C >= 3) {
                        cell.alignment = { horizontal: 'right', vertical: 'center' };
                        cell.numFmt = '#,##0';
                    }
                } else if (R > 3) {
                    if (R % 2 === 0) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                    }
                    cell.border = thinBorder;
                    if (C === 0) {
                        cell.alignment = { horizontal: 'center', vertical: 'center' };
                    } else if (C <= 2) {
                        cell.alignment = { horizontal: 'left', vertical: 'center' };
                    } else {
                        cell.alignment = { horizontal: 'right', vertical: 'center' };
                    }
                    if (C >= 3 && R < lastRowNum - 1) {
                        cell.numFmt = '#,##0';
                    }
                }
            });
        });

        const fileName = `Physical_Works_Report_${monthName}_${year}_${selectedDistrict ? `${selectedDistrict}_` : ''
            }${selectedTaluka ? `${selectedTaluka}_` : ''
            }${selectedCategory ? `Category_${selectedCategory}_` : ''
            }.xlsx`;

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), fileName);

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
    selectedYear,
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
            selectedYear,
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