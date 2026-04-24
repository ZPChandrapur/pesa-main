import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pesaSupabase } from '../../utils/supabase';
import GovtLogo from '../../assets/govtMH logo.png';

interface DownloadDistrictPdfProps {
  selectedDistrict?: string;
  selectedTaluka?: string;
  selectedCategory?: string;
  language?: 'en' | 'mr';
  activeTab: 'financial' | 'physical';
}

const loadImageAsBase64 = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });

const parseNumeric = (val: any): number => {
  if (val == null) return 0;
  return Number(String(val).replace(/[^\d.-]/g, '')) || 0;
};

export const handleDownloadDistrictPdf = async ({
  selectedDistrict,
  selectedTaluka,
  selectedCategory,
  language = 'en',
  activeTab,
}: DownloadDistrictPdfProps) => {
  try {
    const tableName = activeTab === 'financial' ? 'district_aarakhada_financial' : 'district_aarakhada_physical';
    let query = pesaSupabase.from(tableName).select('*');

    if (selectedDistrict) query = query.eq('district_name', selectedDistrict);
    if (selectedTaluka) query = query.eq('taluka_name', selectedTaluka);
    if (selectedCategory) query = query.eq('work_category', selectedCategory);

    const { data: works, error } = await query;
    if (error) {
      alert('Failed to fetch data');
      return;
    }
    if (!works || works.length === 0) {
      alert(language === 'mr' ? 'निवडलेल्या फिल्टरसाठी डेटा उपलब्ध नाही' : 'No data available for selected filters');
      return;
    }

    const logoBase64 = await loadImageAsBase64(GovtLogo);

    const currentDate = new Date();
    const monthNames = language === 'mr'
      ? ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const headerColor: [number, number, number] = [26, 78, 148];
    doc.setFillColor(...headerColor);
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.addImage(logoBase64, 'PNG', 8, 3, 26, 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(
      language === 'mr' ? 'जिल्हा परिषद, चंद्रपूर' : 'Zilla Parishad, Chandrapur',
      pageWidth / 2, 12, { align: 'center' }
    );

    doc.setFontSize(10);
    doc.text(
      language === 'mr'
        ? `पेसा 5% थेट निधी योजना - जिल्हा स्तरीय अहवाल - ${monthName} ${year}`
        : `PESA 5% Direct Fund Scheme - District Level Report - ${monthName} ${year}`,
      pageWidth / 2, 20, { align: 'center' }
    );

    const tabLabel = activeTab === 'financial'
      ? (language === 'mr' ? 'आर्थिक प्रगती अहवाल (प्रपत्र क्र.- 4)' : 'Financial Progress Report')
      : (language === 'mr' ? 'भौतिक प्रगती अहवाल (प्रपत्र क्र.- 3)' : 'Physical Progress Report');
    doc.setFontSize(9);
    doc.text(tabLabel, pageWidth / 2, 27, { align: 'center' });

    let startY = 36;

    if (activeTab === 'financial') {
      generateFinancialTable(doc, works, selectedCategory, language, startY);
    } else {
      generatePhysicalTable(doc, works, selectedCategory, language, startY);
    }

    const fileName = `District_${activeTab}_Report_${monthName}_${year}.pdf`;
    doc.save(fileName);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Failed to generate PDF report.');
    return false;
  }
};

function generateFinancialTable(
  doc: jsPDF,
  works: any[],
  selectedCategory: string | undefined,
  language: string,
  startY: number
) {
  const grouped = new Map<string, any>();

  works.forEach(work => {
    const key = `${work.district_name}|${work.taluka_name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        taluka_name: work.taluka_name,
        pesa_gp_count: parseNumeric(work.pesa_gram_panchayat_count),
        pesa_village_count: parseNumeric(work.pesa_village_count),
        A: { approved: 0, received: 0, interest: 0, total_received: 0, prev: 0, curr: 0, total_exp: 0, remaining: 0 },
        B: { approved: 0, received: 0, interest: 0, total_received: 0, prev: 0, curr: 0, total_exp: 0, remaining: 0 },
        C: { approved: 0, received: 0, interest: 0, total_received: 0, prev: 0, curr: 0, total_exp: 0, remaining: 0 },
        D: { approved: 0, received: 0, interest: 0, total_received: 0, prev: 0, curr: 0, total_exp: 0, remaining: 0 },
      });
    }
    const entry = grouped.get(key)!;
    const cat = work.work_category;
    if (entry[cat]) {
      entry[cat].approved = parseNumeric(work.annual_approved_fund);
      entry[cat].received = parseNumeric(work.annual_received_fund);
      entry[cat].interest = parseNumeric(work.received_interest);
      entry[cat].total_received = parseNumeric(work.annual_received_fund);
      entry[cat].prev = parseNumeric(work.previous_expenditure);
      entry[cat].curr = parseNumeric(work.current_expenditure);
      entry[cat].total_exp = parseNumeric(work.cumulative_expenditure);
      entry[cat].remaining = parseNumeric(work.remaining_funds);
    }
  });

  const finLabels = language === 'mr'
    ? ['प्राप्त', 'मागील', 'चालू', 'एकूण', 'उर्वरित']
    : ['Received', 'Prev', 'Current', 'Total', 'Remaining'];

  const catLabels: Record<string, string> = language === 'mr'
    ? { A: '(अ)', B: '(ब)', C: '(क)', D: '(ड)' }
    : { A: '(A)', B: '(B)', C: '(C)', D: '(D)' };

  const categories = selectedCategory ? [selectedCategory] : ['A', 'B', 'C', 'D'];

  const headerRow1: any[] = [
    { content: language === 'mr' ? 'अ.क्र.' : 'Sr.', rowSpan: 2 },
    { content: language === 'mr' ? 'तालुका' : 'Taluka', rowSpan: 2 },
    { content: language === 'mr' ? 'ग्रा.पं.' : 'GP', rowSpan: 2 },
    { content: language === 'mr' ? 'गावे' : 'Villages', rowSpan: 2 },
    { content: language === 'mr' ? 'मंजूर निधी' : 'Approved', rowSpan: 2 },
    { content: language === 'mr' ? 'प्राप्त निधी' : 'Received', rowSpan: 2 },
    { content: language === 'mr' ? 'व्याज' : 'Interest', rowSpan: 2 },
  ];
  categories.forEach(cat => {
    headerRow1.push({ content: catLabels[cat], colSpan: 5 });
  });
  if (!selectedCategory) {
    headerRow1.push({ content: language === 'mr' ? 'एकूण' : 'Total', colSpan: 5 });
  }

  const headerRow2: any[] = [];
  const subCols = categories.length + (selectedCategory ? 0 : 1);
  for (let i = 0; i < subCols; i++) {
    finLabels.forEach(l => headerRow2.push(l));
  }

  const dataRows = Array.from(grouped.values());
  const body: any[][] = [];

  dataRows.forEach((entry, idx) => {
    const totalApproved = ['A', 'B', 'C', 'D'].reduce((s, c) => s + entry[c].approved, 0);
    const totalReceived = ['A', 'B', 'C', 'D'].reduce((s, c) => s + entry[c].received, 0);
    const totalInterest = ['A', 'B', 'C', 'D'].reduce((s, c) => s + entry[c].interest, 0);

    const row: any[] = [
      idx + 1,
      entry.taluka_name,
      entry.pesa_gp_count,
      entry.pesa_village_count,
      totalApproved.toLocaleString('en-IN'),
      totalReceived.toLocaleString('en-IN'),
      totalInterest.toLocaleString('en-IN'),
    ];
    let grandTotal = [0, 0, 0, 0, 0];
    categories.forEach(cat => {
      const d = entry[cat];
      const vals = [d.total_received, d.prev, d.curr, d.total_exp, d.remaining];
      vals.forEach((v, i) => grandTotal[i] += v);
      row.push(...vals.map(v => v.toLocaleString('en-IN')));
    });
    if (!selectedCategory) {
      row.push(...grandTotal.map(v => v.toLocaleString('en-IN')));
    }
    body.push(row);
  });

  // Total row
  const totalRow: any[] = [
    { content: language === 'mr' ? 'एकूण' : 'Total', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + e.pesa_gp_count, 0), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + e.pesa_village_count, 0), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + ['A','B','C','D'].reduce((ss, c) => ss + e[c].approved, 0), 0).toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + ['A','B','C','D'].reduce((ss, c) => ss + e[c].received, 0), 0).toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + ['A','B','C','D'].reduce((ss, c) => ss + e[c].interest, 0), 0).toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
  ];

  let grandTotals = [0, 0, 0, 0, 0];
  categories.forEach(cat => {
    const catTotals = [0, 0, 0, 0, 0];
    dataRows.forEach(e => {
      catTotals[0] += e[cat].total_received;
      catTotals[1] += e[cat].prev;
      catTotals[2] += e[cat].curr;
      catTotals[3] += e[cat].total_exp;
      catTotals[4] += e[cat].remaining;
    });
    catTotals.forEach((v, i) => grandTotals[i] += v);
    catTotals.forEach(v => totalRow.push({ content: v.toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }));
  });
  if (!selectedCategory) {
    grandTotals.forEach(v => totalRow.push({ content: v.toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }));
  }
  body.push(totalRow);

  autoTable(doc, {
    startY,
    head: [headerRow1, headerRow2],
    body,
    theme: 'grid',
    styles: { fontSize: 5.5, cellPadding: 1.2, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [26, 78, 148], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 5.5 },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 22, halign: 'left' } },
    margin: { left: 4, right: 4 },
    didDrawPage: () => addFooter(doc, language),
  });
}

function generatePhysicalTable(
  doc: jsPDF,
  works: any[],
  selectedCategory: string | undefined,
  language: string,
  startY: number
) {
  const grouped = new Map<string, any>();

  works.forEach(work => {
    const key = `${work.district_name}|${work.taluka_name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        taluka_name: work.taluka_name,
        pesa_gp_count: parseNumeric(work.pesa_gram_panchayat_count),
        pesa_village_count: parseNumeric(work.pesa_village_count),
        A: { sanctioned: 0, completed: 0, ongoing: 0, pending: 0 },
        B: { sanctioned: 0, completed: 0, ongoing: 0, pending: 0 },
        C: { sanctioned: 0, completed: 0, ongoing: 0, pending: 0 },
        D: { sanctioned: 0, completed: 0, ongoing: 0, pending: 0 },
      });
    }
    const entry = grouped.get(key)!;
    const cat = work.work_category;
    if (entry[cat]) {
      entry[cat].sanctioned = parseNumeric(work.sanctioned_works);
      entry[cat].completed = parseNumeric(work.completed_works);
      entry[cat].ongoing = parseNumeric(work.ongoing_works);
      entry[cat].pending = parseNumeric(work.pending_works);
    }
  });

  const statusLabels = language === 'mr'
    ? ['मंजूर', 'पूर्ण', 'चालू', 'प्रलंबित']
    : ['Sanctioned', 'Completed', 'Ongoing', 'Pending'];

  const catLabels: Record<string, string> = language === 'mr'
    ? { A: '(अ)', B: '(ब)', C: '(क)', D: '(ड)' }
    : { A: '(A)', B: '(B)', C: '(C)', D: '(D)' };

  const categories = selectedCategory ? [selectedCategory] : ['A', 'B', 'C', 'D'];

  const headerRow1: any[] = [
    { content: language === 'mr' ? 'अ.क्र.' : 'Sr.', rowSpan: 2 },
    { content: language === 'mr' ? 'तालुका' : 'Taluka', rowSpan: 2 },
    { content: language === 'mr' ? 'ग्रा.पं.' : 'GP', rowSpan: 2 },
    { content: language === 'mr' ? 'गावे' : 'Villages', rowSpan: 2 },
    { content: language === 'mr' ? 'मंजूर कामे' : 'Sanctioned', rowSpan: 2 },
  ];
  categories.forEach(cat => {
    headerRow1.push({ content: catLabels[cat], colSpan: 4 });
  });
  if (!selectedCategory) {
    headerRow1.push({ content: language === 'mr' ? 'एकूण' : 'Total', colSpan: 4 });
  }

  const headerRow2: any[] = [];
  const subCols = categories.length + (selectedCategory ? 0 : 1);
  for (let i = 0; i < subCols; i++) {
    statusLabels.forEach(l => headerRow2.push(l));
  }

  const dataRows = Array.from(grouped.values());
  const body: any[][] = [];

  dataRows.forEach((entry, idx) => {
    const totalSanctioned = ['A', 'B', 'C', 'D'].reduce((s, c) => s + entry[c].sanctioned, 0);
    const row: any[] = [idx + 1, entry.taluka_name, entry.pesa_gp_count, entry.pesa_village_count, totalSanctioned];
    let grandTotal = [0, 0, 0, 0];
    categories.forEach(cat => {
      const d = entry[cat];
      const vals = [d.sanctioned, d.completed, d.ongoing, d.pending];
      vals.forEach((v, i) => grandTotal[i] += v);
      row.push(...vals);
    });
    if (!selectedCategory) row.push(...grandTotal);
    body.push(row);
  });

  const totalRow: any[] = [
    { content: language === 'mr' ? 'एकूण' : 'Total', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + e.pesa_gp_count, 0), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + e.pesa_village_count, 0), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + ['A','B','C','D'].reduce((ss, c) => ss + e[c].sanctioned, 0), 0), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
  ];

  let grandTotals = [0, 0, 0, 0];
  categories.forEach(cat => {
    const catTotals = [0, 0, 0, 0];
    dataRows.forEach(e => {
      catTotals[0] += e[cat].sanctioned;
      catTotals[1] += e[cat].completed;
      catTotals[2] += e[cat].ongoing;
      catTotals[3] += e[cat].pending;
    });
    catTotals.forEach((v, i) => grandTotals[i] += v);
    catTotals.forEach(v => totalRow.push({ content: v, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }));
  });
  if (!selectedCategory) {
    grandTotals.forEach(v => totalRow.push({ content: v, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }));
  }
  body.push(totalRow);

  autoTable(doc, {
    startY,
    head: [headerRow1, headerRow2],
    body,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [26, 78, 148], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 25, halign: 'left' } },
    margin: { left: 5, right: 5 },
    didDrawPage: () => addFooter(doc, language),
  });
}

function addFooter(doc: jsPDF, language: string) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(26, 78, 148);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(
    language === 'mr' ? 'जिल्हा परिषद, चंद्रपूर - पेसा कक्ष' : 'Zilla Parishad, Chandrapur - PESA Cell',
    pageWidth / 2, pageHeight - 3, { align: 'center' }
  );
}
