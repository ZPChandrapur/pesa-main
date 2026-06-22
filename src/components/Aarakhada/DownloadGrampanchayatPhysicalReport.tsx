import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AarakhadaWork } from '../../types';

interface DownloadGrampanchayatPhysicalReportProps {
    works: AarakhadaWork[];
    selectedTaluka?: string;
    selectedGramPanchayat?: string;
    selectedCategory?: string;
    selectedYear?: string;
    language?: 'en' | 'mr';
}

export const handleDownloadGrampanchayatPhysicalExcel = async ({
    works,
    selectedTaluka,
    selectedGramPanchayat,
    selectedCategory,
    selectedYear,
    language = 'en',
}: DownloadGrampanchayatPhysicalReportProps) => {
    try {
        if (!works || works.length === 0) {
            alert('No data available for the selected filters');
            return;
        }

        const parseNumeric = (val: any): number => {
            if (val == null) return 0;
            const numStr = String(val).replace(/[^\d.-]/g, '');
            return Number(numStr) || 0;
        };

        const currentDate = new Date();
        const monthNames =
            language === 'mr'
                ? ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const monthName = monthNames[currentDate.getMonth()];
        const year = currentDate.getFullYear();

        /* ================= GROUP BY VILLAGE AND CATEGORY ================= */
        const physicalDataMap = new Map<string, Map<string, number>>();

        works.forEach(work => {
            if (!work.village_name) return;

            const key = `${work.village_name}|${work.work_category}`;

            if (!physicalDataMap.has(key)) {
                physicalDataMap.set(
                    key,
                    new Map([
                        ['village_name', 0],
                        ['A_sanctioned', 0],
                        ['A_completed', 0],
                        ['A_ongoing', 0],
                        ['A_pending', 0],
                        ['B_sanctioned', 0],
                        ['B_completed', 0],
                        ['B_ongoing', 0],
                        ['B_pending', 0],
                        ['C_sanctioned', 0],
                        ['C_completed', 0],
                        ['C_ongoing', 0],
                        ['C_pending', 0],
                        ['D_sanctioned', 0],
                        ['D_completed', 0],
                        ['D_ongoing', 0],
                        ['D_pending', 0],
                    ])
                );
            }

            const entry = physicalDataMap.get(key)!;
            const cat = work.work_category;

            entry.set(`${cat}_sanctioned`, (entry.get(`${cat}_sanctioned`) || 0) + parseNumeric(work.sanctioned_works));
            entry.set(`${cat}_completed`, (entry.get(`${cat}_completed`) || 0) + parseNumeric(work.completed_works));
            entry.set(`${cat}_ongoing`, (entry.get(`${cat}_ongoing`) || 0) + parseNumeric(work.ongoing_works));
            entry.set(`${cat}_pending`, (entry.get(`${cat}_pending`) || 0) + parseNumeric(work.pending_works));
        });

        const wsData: any[][] = [];

        const titleText =
            language === 'mr'
                ? `पेसा 5% थेट निधी योजना भौतिक प्रगती अहवाल सन - ${year} (प्रपत्र क्र.- 3)`
                : `PESA Physical Works Report - ${monthName} ${year}`;

        wsData.push([titleText]);
        wsData.push([]);

        const categoryLabels =
            language === 'mr'
                ? {
                    A: '(अ) पायाभुत सुविधा',
                    B: '(ब) वनहक्क अधिनियम (FRA) व पेसा अंमलबजावणी',
                    C: '(क) आरोग्य, स्वच्छता व शिक्षण',
                    D: '(ड) वनीकरण, वन्यजीव संवर्धन, जलसंधारण, वनतळी, वन्यजीव पर्यटन व वन उपजिविका',
                }
                : {
                    A: '(A) Infrastructure',
                    B: '(B) Forest Rights Act (FRA) and PESA Implementation',
                    C: '(C) Health, Sanitation and Education',
                    D: '(D) Afforestation, Wildlife Conservation, Water Conservation, Forest Ponds, Wildlife Tourism, and Forest Livelihood',
                };

        const workStatusLabels =
            language === 'mr'
                ? ['मंजुर कामे', 'पुर्ण झालेली कामे', 'प्रगती पथावरील कामे', 'अद्याप सुरु न झालेली कामे']
                : ['Sanctioned', 'Completed', 'Ongoing', 'Pending'];

        const headerRow1 = [
            language === 'mr' ? 'अ.क्र.' : 'Sr. No.',
            language === 'mr' ? 'गावाचे नाव' : 'Village Name',
        ];

        let colPointer = headerRow1.length;

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                headerRow1.push(categoryLabels[cat as 'A' | 'B' | 'C' | 'D']);
                colPointer += 1;
            }
        });

        if (!selectedCategory) {
            headerRow1.push(language === 'mr' ? 'एकूण' : 'Total');
        }

        wsData.push(headerRow1);

        const headerRow2: any[] = [
            '',
            '',
        ];

        colPointer = 2;
        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                workStatusLabels.forEach(label => {
                    headerRow2.push(label);
                });
                colPointer += 4;
            }
        });

        if (!selectedCategory) {
            workStatusLabels.forEach(label => {
                headerRow2.push(label);
            });
        }

        wsData.push(headerRow2);

        const dataRowsArray = Array.from(physicalDataMap.values());

        dataRowsArray.forEach((entry, idx) => {
            const villageName = Array.from(physicalDataMap.entries()).find(([, v]) => v === entry)?.[0].split('|')[0] || '';

            let totals = Array(4).fill(0);

            const row = [idx + 1, villageName];

            ['A', 'B', 'C', 'D'].forEach(cat => {
                if (!selectedCategory || selectedCategory === cat) {
                    const values = [
                        entry.get(`${cat}_sanctioned`) || 0,
                        entry.get(`${cat}_completed`) || 0,
                        entry.get(`${cat}_ongoing`) || 0,
                        entry.get(`${cat}_pending`) || 0,
                    ];
                    values.forEach((v, i) => totals[i] += v);
                    row.push(...values);
                }
            });

            if (!selectedCategory) row.push(...totals);
            wsData.push(row);
        });

        const totalRow: any[] = [
            language === 'mr' ? 'एकूण' : 'Total',
            '',
        ];

        let grandSanctioned = 0;
        let grandCompleted = 0;
        let grandOngoing = 0;
        let grandPending = 0;

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                const sanctioned = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_sanctioned`) || 0), 0);
                const completed = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_completed`) || 0), 0);
                const ongoing = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_ongoing`) || 0), 0);
                const pending = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_pending`) || 0), 0);

                totalRow.push(sanctioned, completed, ongoing, pending);

                if (!selectedCategory) {
                    grandSanctioned += sanctioned;
                    grandCompleted += completed;
                    grandOngoing += ongoing;
                    grandPending += pending;
                }
            }
        });

        if (!selectedCategory) {
            totalRow.push(grandSanctioned, grandCompleted, grandOngoing, grandPending);
        }

        wsData.push([]);
        wsData.push([]);
        wsData.push([]);
        wsData.push(totalRow);

        const totalColumns = headerRow1.length;
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Physical Report');

        const colWidths: { width: number }[] = [];
        colWidths.push({ width: 8 }, { width: 22 });
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

        [1, 2].forEach(col => {
            ws.mergeCells(3, col, 4, col);
        });

        let startCol = 3;
        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                ws.mergeCells(3, startCol, 3, startCol + 3);
                startCol += 4;
            }
        });
        if (!selectedCategory) {
            ws.mergeCells(3, startCol, 3, startCol + 3);
        }

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
                    if (C >= 2) {
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
                    } else if (C === 1) {
                        cell.alignment = { horizontal: 'left', vertical: 'center' };
                    } else {
                        cell.alignment = { horizontal: 'right', vertical: 'center' };
                    }
                    if (C >= 2 && R < lastRowNum - 1) {
                        cell.numFmt = '#,##0';
                    }
                }
            });
        });

        const fileName = selectedGramPanchayat
            ? `PESA_Physical_Report_${selectedGramPanchayat}_${year}.xlsx`
            : `PESA_Physical_Report_${year}.xlsx`;

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), fileName);
    } catch (error) {
        console.error('Error generating physical report:', error);
        alert('Failed to generate physical report');
    }
};
