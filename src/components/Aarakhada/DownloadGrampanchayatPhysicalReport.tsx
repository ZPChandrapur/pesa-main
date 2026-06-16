import * as XLSX from 'xlsx-js-style';
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

        const wb = XLSX.utils.book_new();
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

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        const merges: XLSX.Range[] = [];

        // Title
        merges.push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: headerRow1.length - 1 },
        });

        // Static headers (row 2 & 3)
        [0, 1].forEach(col => {
            merges.push({
                s: { r: 2, c: col },
                e: { r: 3, c: col },
            });
        });

        // Category header merges
        let startCol = 2;
        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                merges.push({
                    s: { r: 2, c: startCol },
                    e: { r: 2, c: startCol + 3 },
                });
                startCol += 4;
            }
        });

        if (!selectedCategory) {
            merges.push({
                s: { r: 2, c: startCol },
                e: { r: 2, c: startCol + 3 },
            });
        }

        ws['!merges'] = merges;

        const columnWidths: XLSX.ColInfo[] = [
            { wch: 8 },
            { wch: 22 },
        ];

        // Category sub-columns (KEEP NARROW)
        const numCategories = selectedCategory ? 1 : 4;
        for (let i = 0; i < numCategories * 4; i++) {
            columnWidths.push({ wch: 14 });
        }

        // Total columns
        if (!selectedCategory) {
            for (let i = 0; i < 4; i++) {
                columnWidths.push({ wch: 14 });
            }
        }

        ws['!cols'] = columnWidths;

        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][0] = { hpt: 30 };
        ws['!rows'][2] = { hpt: 55 };
        ws['!rows'][3] = { hpt: 30 };

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
                    cellStyle.font = {
                        ...cellStyle.font,
                        bold: true,
                        size: 18,
                        color: { rgb: 'FFFFFF' }
                    };

                    cellStyle.fill = {
                        fgColor: { rgb: '1F4E78' }
                    };
                } else if (R === 2 || R === 3) {
                    cellStyle.font = {
                        ...cellStyle.font,
                        bold: true,
                        size: 12,
                        color: { rgb: 'FFFFFF' }
                    };

                    cellStyle.fill = {
                        fgColor: { rgb: '1F4E78' }
                    };

                    cellStyle.alignment = {
                        horizontal: 'center',
                        vertical: 'center',
                        wrapText: true
                    };

                    cellStyle.border = {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    };
                } else if (R === wsData.length - 1) {
                    cellStyle.font = {
                        ...cellStyle.font,
                        bold: true,
                        size: 12
                    };
                    cellStyle.fill = {
                        fgColor: { rgb: 'C6EFCE' }
                    };
                    cellStyle.border = {
                        top: { style: 'medium', color: { rgb: '000000' } },
                        bottom: { style: 'medium', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    };
                    if (C >= 2) {
                        cellStyle.alignment = { horizontal: 'right', vertical: 'center' };
                    }
                } else if (R > 3) {
                    if (R % 2 === 0) {
                        cellStyle.fill = {
                            fgColor: { rgb: 'F2F2F2' }
                        };
                    }
                    cellStyle.border = {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    };
                    if (C === 0) {
                        cellStyle.alignment = { horizontal: 'center', vertical: 'center' };
                    } else if (C === 1) {
                        cellStyle.alignment = { horizontal: 'left', vertical: 'center' };
                    } else {
                        cellStyle.alignment = { horizontal: 'right', vertical: 'center' };
                    }
                }

                if (C >= 2 && R > 3 && R < wsData.length - 1) {
                    ws[cellAddress].z = '#,##0';
                }

                ws[cellAddress].s = cellStyle;
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, 'Physical Report');

        const fileName = selectedGramPanchayat
            ? `PESA_Physical_Report_${selectedGramPanchayat}_${year}.xlsx`
            : `PESA_Physical_Report_${year}.xlsx`;

        XLSX.writeFile(wb, fileName);
    } catch (error) {
        console.error('Error generating physical report:', error);
        alert('Failed to generate physical report');
    }
};
