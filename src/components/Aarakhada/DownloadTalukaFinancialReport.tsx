import * as XLSX from 'xlsx';
import { pesaSupabase } from '../../utils/supabase';

interface DownloadTalukaFinancialReportProps {
    selectedTaluka?: string;
    selectedGramPanchayat?: string;
    selectedCategory?: string;
    language?: 'en' | 'mr';
}

export const handleDownloadTalukaFinancialExcel = async ({
    selectedTaluka,
    selectedGramPanchayat,
    selectedCategory,
    language = 'en',
}: DownloadTalukaFinancialReportProps): Promise<boolean> => {
    try {
        let financialQuery = pesaSupabase
            .from('taluka_aarakhada_financial')
            .select('*');

        if (selectedTaluka) financialQuery = financialQuery.eq('taluka_name', selectedTaluka);
        if (selectedGramPanchayat) financialQuery = financialQuery.eq('gram_panchayat', selectedGramPanchayat);
        if (selectedCategory) financialQuery = financialQuery.eq('work_category', selectedCategory);

        const { data: financialWorks, error: financialError } = await financialQuery;

        if (financialError) {
            console.error('Failed to fetch financial data:', financialError);
            alert(`${language === 'mr' ? 'वित्तीय डेटा प्राप्त करने में विफल' : 'Failed to fetch financial report data'}: ${financialError.message || financialError}`);
            return false;
        }

        if (!financialWorks || financialWorks.length === 0) {
            alert(language === 'mr' ? 'निवडलेल्या फिल्टरसाठी डेटा उपलब्ध नाही' : 'No data available for the selected filters');
            return false;
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

        /* ================= GROUP BY GRAM PANCHAYAT ================= */
        const districtsByTaluka = new Map<string, Map<string, any>>();

        financialWorks.forEach(work => {
            if (!work.gram_panchayat) return;

            const key = `${work.gram_panchayat}|${work.work_category}`;

            if (!districtsByTaluka.has(key)) {
                districtsByTaluka.set(
                    key,
                    new Map([
                        ['gram_panchayat', work.gram_panchayat],
                        ['pesa_village_count', work.pesa_village_count || 0],
                        ['annual_approved_fund', parseNumeric(work.annual_approved_fund)],
                        ['annual_received_fund', parseNumeric(work.annual_received_fund)],
                        ['received_interest', parseNumeric(work.received_interest)],

                        ['A_total_received', 0],
                        ['A_previous', 0],
                        ['A_current', 0],
                        ['A_total_exp', 0],
                        ['A_remaining', 0],

                        ['B_total_received', 0],
                        ['B_previous', 0],
                        ['B_current', 0],
                        ['B_total_exp', 0],
                        ['B_remaining', 0],

                        ['C_total_received', 0],
                        ['C_previous', 0],
                        ['C_current', 0],
                        ['C_total_exp', 0],
                        ['C_remaining', 0],

                        ['D_total_received', 0],
                        ['D_previous', 0],
                        ['D_current', 0],
                        ['D_total_exp', 0],
                        ['D_remaining', 0],
                    ])
                );
            }

            const entry = districtsByTaluka.get(key)!;
            const cat = work.work_category;

            entry.set(`${cat}_total_received`, parseNumeric(work.annual_received_fund));
            entry.set(`${cat}_previous`, parseNumeric(work.previous_expenditure));
            entry.set(`${cat}_current`, parseNumeric(work.current_expenditure));
            entry.set(`${cat}_total_exp`, parseNumeric(work.cumulative_expenditure));
            entry.set(`${cat}_remaining`, parseNumeric(work.remaining_funds));
        });

        const wb = XLSX.utils.book_new();
        const wsData: any[][] = [];

        const titleText =
            language === 'mr'
                ? `पेसा 5% थेट निधी योजना आर्थिक प्रगती अहवाल सन - ${year} (प्रपत्र क्र.- 4)`
                : `PESA Financial Works Report - ${monthName} ${year}`;

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

        const financeLabels =
            language === 'mr'
                ? ['एकूण प्राप्त', 'मागील खर्च', 'चालू खर्च', 'एकूण खर्च', 'उर्वरित निधी']
                : ['Total Received', 'Previous Exp', 'Current Exp', 'Total Exp', 'Remaining'];

        const headerRow1 = [
            language === 'mr' ? 'अ.क्र.' : 'Sr. No.',
            language === 'mr' ? 'पेसा ग्रामपंचायतीचे नाव' : 'PESA Gram Panchayat Name',
            language === 'mr' ? 'पेसा गावांची संख्या' : 'PESA Villages',
            language === 'mr' ? 'वार्षिक मंजूर निधी (₹)' : 'Annual Approved Fund (₹)',
            language === 'mr' ? 'वार्षिक प्राप्त निधी (₹)' : 'Annual Received Fund (₹)',
            language === 'mr' ? 'योजने अंतर्गत प्राप्त व्याजाची रक्कम' : 'Interest Received under the Scheme',
        ];

        let colPointer = headerRow1.length;

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                headerRow1[colPointer] = categoryLabels[cat as keyof typeof categoryLabels];

                for (let i = 1; i < 5; i++) {
                    headerRow1[colPointer + i] = '';
                }
                colPointer += 5;
            }
        });

        if (!selectedCategory) {
            headerRow1[colPointer] = language === 'mr' ? 'एकूण' : 'Total';
            for (let i = 1; i < 5; i++) {
                headerRow1[colPointer + i] = '';
            }
        }

        wsData.push(headerRow1);

        const headerRow2: any[] = Array(7).fill('');

        let columnPointer = 7;

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                financeLabels.forEach(label => {
                    headerRow2[columnPointer] = label;
                    columnPointer++;
                });
            }
        });

        if (!selectedCategory) {
            financeLabels.forEach(label => {
                headerRow2[columnPointer] = label;
                columnPointer++;
            });
        }

        wsData.push(headerRow2);

        /* ================= DATA ROWS ================= */
        const dataRowsArray = Array.from(districtsByTaluka.values());

        dataRowsArray.forEach((entry, index) => {
            const row: any[] = [
                index + 1,
                entry.get('gram_panchayat'),
                parseNumeric(entry.get('pesa_village_count')),
                parseNumeric(entry.get('annual_approved_fund')),
                parseNumeric(entry.get('annual_received_fund')),
                parseNumeric(entry.get('received_interest')),
            ];

            let totals = Array(5).fill(0);

            ['A', 'B', 'C', 'D'].forEach(cat => {
                if (!selectedCategory || selectedCategory === cat) {
                    const values = [
                        entry.get(`${cat}_total_received`) || 0,
                        entry.get(`${cat}_previous`) || 0,
                        entry.get(`${cat}_current`) || 0,
                        entry.get(`${cat}_total_exp`) || 0,
                        entry.get(`${cat}_remaining`) || 0,
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
            '',
            dataRowsArray.reduce((sum, entry) => sum + parseNumeric(entry.get('pesa_village_count')), 0),
            dataRowsArray.reduce((sum, entry) => sum + parseNumeric(entry.get('annual_approved_fund')), 0),
            dataRowsArray.reduce((sum, entry) => sum + parseNumeric(entry.get('annual_received_fund')), 0),
            dataRowsArray.reduce((sum, entry) => sum + parseNumeric(entry.get('received_interest')), 0),
        ];

        let grandTotalReceived = 0;
        let grandPrevious = 0;
        let grandCurrent = 0;
        let grandTotalExp = 0;
        let grandRemaining = 0;

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                const totalReceived = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_total_received`) || 0), 0);
                const previous = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_previous`) || 0), 0);
                const current = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_current`) || 0), 0);
                const totalExp = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_total_exp`) || 0), 0);
                const remaining = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_remaining`) || 0), 0);

                totalRow.push(totalReceived, previous, current, totalExp, remaining);

                if (!selectedCategory) {
                    grandTotalReceived += totalReceived;
                    grandPrevious += previous;
                    grandCurrent += current;
                    grandTotalExp += totalExp;
                    grandRemaining += remaining;
                }
            }
        });

        if (!selectedCategory) {
            totalRow.push(grandTotalReceived, grandPrevious, grandCurrent, grandTotalExp, grandRemaining);
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
        [0, 1, 2, 3, 4, 5, 6].forEach(col => {
            merges.push({
                s: { r: 2, c: col },
                e: { r: 3, c: col },
            });
        });

        // Category header merges
        let startCol = 7;
        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                merges.push({
                    s: { r: 2, c: startCol },
                    e: { r: 2, c: startCol + 4 },
                });
                startCol += 5;
            }
        });

        if (!selectedCategory) {
            merges.push({
                s: { r: 2, c: startCol },
                e: { r: 2, c: startCol + 4 },
            });
        }

        ws['!merges'] = merges;

        ws['!cols'] = [
            { wch: 6 },
            { wch: 18 },
            { wch: 14 },
            { wch: 16 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 },
            ...Array(headerRow1.length - 7).fill({ wch: 16 }),
        ];


        ws['!cols'] = Array(headerRow1.length).fill({ wch: 16 });

        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][0] = { hpt: 25 };
        ws['!rows'][2] = { hpt: 45 };
        ws['!rows'][3] = { hpt: 25 };

        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) ws[cellAddress] = { v: '' };

                let cellStyle: any = {
                    font: {
                        name: 'Calibri',
                        size: 11
                    },
                    alignment: {
                        horizontal: 'center',
                        vertical: 'center',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                };

                if (R === 0) {
                    cellStyle.font = { ...cellStyle.font, bold: true, size: 14, color: { rgb: 'FFFFFF' } };
                    cellStyle.fill = { fgColor: { rgb: '4472C4' } };
                    cellStyle.alignment = { horizontal: 'center', vertical: 'center' };
                }

                else if (R === 2 || R === 3) {
                    cellStyle.font = { ...cellStyle.font, bold: true };
                    cellStyle.fill = { fgColor: { rgb: '4472C4' } };
                    cellStyle.alignment = {
                        horizontal: 'center',
                        vertical: 'center',
                        wrapText: true
                    };
                }

                else if (R === wsData.length - 1) {
                    cellStyle.font = { ...cellStyle.font, bold: true };
                    cellStyle.fill = { fgColor: { rgb: 'D9D9D9' } };
                    cellStyle.alignment = {
                        horizontal: C >= 3 ? 'right' : 'center',
                        vertical: 'center'
                    };
                }

                else if (R > 3) {
                    cellStyle.alignment = {
                        horizontal: C >= 3 ? 'right' : 'center',
                        vertical: 'center'
                    };
                }

                if (C >= 3 && R > 3 && R < wsData.length - 1) {
                    ws[cellAddress].z = '#,##0';
                }

                ws[cellAddress].s = cellStyle;
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, 'Financial Works Report');

        // Generate clean filename
        const fileNameParts = ['Financial_Works_Report', monthName, year];
        if (selectedTaluka) fileNameParts.push(selectedTaluka);
        if (selectedGramPanchayat) fileNameParts.push(selectedGramPanchayat);
        if (selectedCategory) fileNameParts.push(selectedCategory);
        
        const fileName = `${fileNameParts.join('_')}.xlsx`;
        
        try {
          XLSX.writeFile(wb, fileName);
        } catch (writeError) {
          console.error('Error writing Excel file:', writeError);
          throw new Error(`Failed to write Excel file: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
        }

        return true;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Error generating financial report:', error);
        alert(`${language === 'mr' ? 'वित्तीय रिपोर्ट तैयार करने में विफल' : 'Failed to generate financial report'}: ${errorMsg}`);
        return false;
    }
};
