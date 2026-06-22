import * as XLSX from 'xlsx';
import { pesaSupabase } from '../../utils/supabase';

interface DownloadFinancialReportProps {
    selectedDistrict?: string;
    selectedTaluka?: string;
    selectedCategory?: string;
    language?: 'en' | 'mr';
}

export const handleDownloadFinancialExcel = async ({
    selectedDistrict,
    selectedTaluka,
    selectedCategory,
    language = 'en',
}: DownloadFinancialReportProps) => {
    try {
        let financialQuery = pesaSupabase
            .from('district_aarakhada_financial')
            .select('*');

        if (selectedDistrict) financialQuery = financialQuery.eq('district_name', selectedDistrict);
        if (selectedTaluka) financialQuery = financialQuery.eq('taluka_name', selectedTaluka);
        if (selectedCategory) financialQuery = financialQuery.eq('work_category', selectedCategory);

        const { data: financialWorks, error: financialError } = await financialQuery;

        if (financialError) {
            console.error('Failed to fetch financial data:', financialError);
            alert('Failed to fetch financial report data');
            return;
        }

        if (!financialWorks || financialWorks.length === 0) {
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

        /* ================= GROUP BY TALUKA ================= */
        const districtsByTaluka = new Map<string, Map<string, any>>();

        financialWorks.forEach(work => {
            const key = `${work.district_name}|${work.taluka_name}`;

            if (!districtsByTaluka.has(key)) {
                districtsByTaluka.set(
                    key,
                    new Map([
                        ['taluka_name', work.taluka_name],
                        ['pesa_gram_panchayat_count', work.pesa_gram_panchayat_count],
                        ['pesa_village_count', work.pesa_village_count],

                        ['A_approved',
                            parseNumeric(work.A_approved) +
                            parseNumeric(work.B_approved) +
                            parseNumeric(work.C_approved) +
                            parseNumeric(work.D_approved)
                        ],

                        ['A_received',
                            parseNumeric(work.A_received) +
                            parseNumeric(work.B_received) +
                            parseNumeric(work.C_received) +
                            parseNumeric(work.D_received)
                        ],

                        ['A_interest',
                            parseNumeric(work.A_interest) +
                            parseNumeric(work.B_interest) +
                            parseNumeric(work.C_interest) +
                            parseNumeric(work.D_interest)
                        ],
                    ])
                );
            }

            const entry = districtsByTaluka.get(key)!;
            const category = work.work_category;

            entry.set(`${category}_approved`, parseNumeric(work.annual_approved_fund));
            entry.set(`${category}_received`, parseNumeric(work.annual_received_fund));
            entry.set(`${category}_interest`, parseNumeric(work.received_interest));
            entry.set(`${category}_total_received`, parseNumeric(work.annual_received_fund));
            entry.set(`${category}_previous`, parseNumeric(work.previous_expenditure));
            entry.set(`${category}_current`, parseNumeric(work.current_expenditure));
            entry.set(`${category}_total_exp`, parseNumeric(work.cumulative_expenditure));
            entry.set(`${category}_remaining`, parseNumeric(work.remaining_funds));
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
                ? { A: 'पायाभूत सुविधा', B: 'वनहक्क अधिनियम (FRA) व पेसा अंमलबजावणी', C: 'आरोग्य, स्वच्छता व शिक्षण', D: 'वनीकरण, वन्यजीव संवर्धन, जलसंधारण, वनतळी, वन्यजीव पर्यटन व वन उपजिविका' }
                : { A: 'Infrastructure', B: 'Forest Rights Act (FRA) and PESA Implementation', C: 'Health, Sanitation and Education', D: 'Afforestation, Wildlife Conservation, Water Conservation, Forest Ponds, Wildlife Tourism, and Forest Livelihood' };

        const financeLabels =
            language === 'mr'
                ? ['एकूण प्राप्त', 'मागील खर्च', 'चालू खर्च', 'एकूण खर्च', 'उर्वरित निधी']
                : ['Total Received', 'Previous Exp', 'Current Exp', 'Total Exp', 'Remaining'];

        const headerRow1 = [
            language === 'mr' ? 'अ.क्र.' : 'Sr. No.',
            language === 'mr' ? 'तालुका' : 'Taluka',
            language === 'mr' ? 'पेसा ग्रा.पं. संख्या' : 'PESA GP',
            language === 'mr' ? 'पेसा गावांची संख्या' : 'PESA Villages',
            language === 'mr' ? 'वार्षिक मंजूर निधी (₹)' : 'Annual Approved Fund (₹)',
            language === 'mr' ? 'वार्षिक प्रस्तावित निधी (₹)' : 'Annual Received Fund (₹)',
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

        // 7 static columns before categories
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
                entry.get('taluka_name'),
                parseNumeric(entry.get('pesa_gram_panchayat_count')),
                parseNumeric(entry.get('pesa_village_count')),
                parseNumeric(entry.get('A_approved')) + parseNumeric(entry.get('B_approved')) + parseNumeric(entry.get('C_approved')) + parseNumeric(entry.get('D_approved')),
                parseNumeric(entry.get('A_received')) + parseNumeric(entry.get('B_received')) + parseNumeric(entry.get('C_received')) + parseNumeric(entry.get('D_received')),
                parseNumeric(entry.get('A_interest')) + parseNumeric(entry.get('B_interest')) + parseNumeric(entry.get('C_interest')) + parseNumeric(entry.get('D_interest')),
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
            dataRowsArray.reduce((sum, entry) =>
                sum + parseNumeric(entry.get('pesa_gram_panchayat_count')), 0),
            dataRowsArray.reduce((sum, entry) =>
                sum + parseNumeric(entry.get('pesa_village_count')), 0),
            dataRowsArray.reduce((sum, entry) =>
                sum +
                parseNumeric(entry.get('A_approved')) +
                parseNumeric(entry.get('B_approved')) +
                parseNumeric(entry.get('C_approved')) +
                parseNumeric(entry.get('D_approved')), 0),
            dataRowsArray.reduce((sum, entry) =>
                sum +
                parseNumeric(entry.get('A_received')) +
                parseNumeric(entry.get('B_received')) +
                parseNumeric(entry.get('C_received')) +
                parseNumeric(entry.get('D_received')), 0),
            dataRowsArray.reduce((sum, entry) =>
                sum +
                parseNumeric(entry.get('A_interest')) +
                parseNumeric(entry.get('B_interest')) +
                parseNumeric(entry.get('C_interest')) +
                parseNumeric(entry.get('D_interest')), 0),
        ];

        let grandApproved = 0;
        let grandReceived = 0;
        let grandInterest = 0;
        let grandTotalReceived = 0;
        let grandPrevious = 0;
        let grandCurrent = 0;
        let grandTotalExp = 0;
        let grandRemaining = 0;

        ['A', 'B', 'C', 'D'].forEach(cat => {
            if (!selectedCategory || selectedCategory === cat) {
                const approved = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_approved`) || 0), 0);
                const received = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_received`) || 0), 0);
                const interest = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_interest`) || 0), 0);
                const totalReceived = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_total_received`) || 0), 0);
                const previous = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_previous`) || 0), 0);
                const current = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_current`) || 0), 0);
                const totalExp = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_total_exp`) || 0), 0);
                const remaining = dataRowsArray.reduce((s, e) => s + (e.get(`${cat}_remaining`) || 0), 0);

                totalRow.push(
                    totalReceived,
                    previous,
                    current,
                    totalExp,
                    remaining
                );

                if (!selectedCategory) {
                    grandApproved += approved;
                    grandReceived += received;
                    grandInterest += interest;
                    grandTotalReceived += totalReceived;
                    grandPrevious += previous;
                    grandCurrent += current;
                    grandTotalExp += totalExp;
                    grandRemaining += remaining;
                }
            }
        });

        if (!selectedCategory) {
            totalRow.push(
                grandTotalReceived,
                grandPrevious,
                grandCurrent,
                grandTotalExp,
                grandRemaining
            );
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

        const fileName = `Financial_Works_Report_${monthName}_${year}_${selectedDistrict ?? ''}_${selectedTaluka ?? ''}_${selectedCategory ?? ''}.xlsx`;
        XLSX.writeFile(wb, fileName);

        return true;
    } catch (error) {
        console.error('Error generating financial report:', error);
        alert('Failed to generate financial report. Please try again.');
        return false;
    }
};
