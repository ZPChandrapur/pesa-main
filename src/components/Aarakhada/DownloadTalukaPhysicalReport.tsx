import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { pesaSupabase } from '../../utils/supabase';

interface DownloadTalukaPhysicalReportProps {
    selectedTaluka?: string;
    selectedGramPanchayat?: string;
    selectedCategory?: string;
    selectedYear?: string;
    language?: 'en' | 'mr';
}

export const handleDownloadTalukaPhysicalExcel = async ({
    selectedTaluka,
    selectedGramPanchayat,
    selectedCategory,
    selectedYear,
    language = 'en',
}: DownloadTalukaPhysicalReportProps): Promise<boolean> => {
    try {
        let query = pesaSupabase.from('taluka_aarakhada_physical').select('*');

        if (selectedTaluka) query = query.eq('taluka_name', selectedTaluka);
        if (selectedGramPanchayat) query = query.eq('gram_panchayat', selectedGramPanchayat);
        if (selectedCategory) query = query.eq('work_category', selectedCategory);
        if (selectedYear) query = query.eq('year', selectedYear);

        const { data: physicalWorks, error } = await query;

        if (error) {
            console.error('Failed to fetch physical data:', error);
            alert(`${language === 'mr' ? 'भौतिक डेटा प्राप्त करण्यात अयशस्वी' : 'Failed to fetch physical report data'}: ${error.message}`);
            return false;
        }

        if (!physicalWorks || physicalWorks.length === 0) {
            alert(language === 'mr' ? 'निवडलेल्या फिल्टरसाठी डेटा उपलब्ध नाही' : 'No data available for the selected filters');
            return false;
        }

        const parseNumeric = (val: any): number => {
            if (val == null) return 0;
            return Number(String(val).replace(/[^\d.-]/g, '')) || 0;
        };

        const currentDate = new Date();
        const monthNames = language === 'mr'
            ? ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर']
            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[currentDate.getMonth()];
        const year = currentDate.getFullYear();

        /* ===== GROUP BY GRAM PANCHAYAT + CATEGORY ===== */
        const gpMap = new Map<string, Map<string, any>>();

        physicalWorks.forEach(work => {
            if (!work.gram_panchayat) return;
            const key = `${work.gram_panchayat}|${work.work_category}`;

            if (!gpMap.has(key)) {
                gpMap.set(key, new Map([
                    ['gram_panchayat', work.gram_panchayat],
                    ['taluka_name', work.taluka_name],
                    ['pesa_village_count', work.pesa_village_count || 0],
                ]));
            }

            const entry = gpMap.get(key)!;
            const cat = work.work_category;
            entry.set(`${cat}_sanctioned`, (entry.get(`${cat}_sanctioned`) || 0) + parseNumeric(work.sanctioned_works));
            entry.set(`${cat}_completed`, (entry.get(`${cat}_completed`) || 0) + parseNumeric(work.completed_works));
            entry.set(`${cat}_ongoing`, (entry.get(`${cat}_ongoing`) || 0) + parseNumeric(work.ongoing_works));
            entry.set(`${cat}_pending`, (entry.get(`${cat}_pending`) || 0) + parseNumeric(work.pending_works));
        });

        const categoryLabels = language === 'mr'
            ? {
                A: '(अ) पायाभूत सुविधा',
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

        const workStatusLabels = language === 'mr'
            ? ['मंजुर कामे', 'पुर्ण झालेली कामे', 'प्रगती पथावरील कामे', 'अद्याप सुरु न झालेली कामे']
            : ['Sanctioned', 'Completed', 'Ongoing', 'Pending'];

        const wsData: any[][] = [];

        const titleText = language === 'mr'
            ? `पेसा 5% थेट निधी योजना भौतिक प्रगती अहवाल सन - ${year} (प्रपत्र क्र.- 3)`
            : `PESA Taluka Physical Works Report - ${monthName} ${year}`;

        wsData.push([titleText]);
        wsData.push([]);

        /* ===== HEADER ROW 1 ===== */
        const headerRow1: any[] = [
            language === 'mr' ? 'अ.क्र.' : 'Sr. No.',
            language === 'mr' ? 'ग्रामपंचायत' : 'Gram Panchayat',
            language === 'mr' ? 'पेसा गावांची संख्या' : 'PESA Villages',
        ];

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                headerRow1.push(categoryLabels[cat as keyof typeof categoryLabels], '', '', '');
            }
        });

        if (!selectedCategory) {
            headerRow1.push(language === 'mr' ? 'एकूण' : 'Total', '', '', '');
        }

        wsData.push(headerRow1);

        /* ===== HEADER ROW 2 ===== */
        const headerRow2: any[] = ['', '', ''];

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                workStatusLabels.forEach(label => headerRow2.push(label));
            }
        });

        if (!selectedCategory) {
            workStatusLabels.forEach(label => headerRow2.push(label));
        }

        wsData.push(headerRow2);

        /* ===== DATA ROWS ===== */
        const dataRowsArray = Array.from(gpMap.values());

        dataRowsArray.forEach((entry, idx) => {
            const row: any[] = [
                idx + 1,
                entry.get('gram_panchayat'),
                parseNumeric(entry.get('pesa_village_count')),
            ];

            let totals = [0, 0, 0, 0];

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

        /* ===== TOTAL ROW ===== */
        const totalRow: any[] = [
            language === 'mr' ? 'एकूण' : 'Total',
            '',
            dataRowsArray.reduce((s, e) => s + parseNumeric(e.get('pesa_village_count')), 0),
        ];

        let grand = [0, 0, 0, 0];

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                const s = dataRowsArray.reduce((sum, e) => sum + (e.get(`${cat}_sanctioned`) || 0), 0);
                const c = dataRowsArray.reduce((sum, e) => sum + (e.get(`${cat}_completed`) || 0), 0);
                const o = dataRowsArray.reduce((sum, e) => sum + (e.get(`${cat}_ongoing`) || 0), 0);
                const p = dataRowsArray.reduce((sum, e) => sum + (e.get(`${cat}_pending`) || 0), 0);
                totalRow.push(s, c, o, p);
                if (!selectedCategory) { grand[0] += s; grand[1] += c; grand[2] += o; grand[3] += p; }
            }
        });

        if (!selectedCategory) totalRow.push(...grand);

        wsData.push([]);
        wsData.push([]);
        wsData.push([]);
        wsData.push(totalRow);

        const totalColumns = headerRow1.length;
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Physical Report');

        const colWidths: { width: number }[] = [];
        colWidths.push({ width: 8 }, { width: 22 }, { width: 18 });
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

        [1, 2, 3].forEach(col => {
            ws.mergeCells(3, col, 4, col);
        });

        let startCol = 4;
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

        const fileNameParts = ['PESA_Taluka_Physical_Report', String(year)];
        if (selectedTaluka) fileNameParts.push(selectedTaluka);
        if (selectedGramPanchayat) fileNameParts.push(selectedGramPanchayat);
        if (selectedCategory) fileNameParts.push(`Cat_${selectedCategory}`);

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${fileNameParts.join('_')}.xlsx`);
        return true;

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Error generating taluka physical report:', error);
        alert(`${language === 'mr' ? 'भौतिक अहवाल तयार करण्यात अयशस्वी' : 'Failed to generate physical report'}: ${msg}`);
        return false;
    }
};