import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pesaSupabase } from '../../utils/supabase';
import GovtLogo from '../../assets/govtMH logo.png';

interface DownloadTalukaPdfProps {
  selectedTaluka?: string;
  selectedGramPanchayat?: string;
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

export const handleDownloadTalukaPdf = async ({
  selectedTaluka,
  selectedGramPanchayat,
  selectedCategory,
  language = 'en',
  activeTab,
}: DownloadTalukaPdfProps) => {
  try {
    const tableName = activeTab === 'financial' ? 'taluka_aarakhada_financial' : 'taluka_aarakhada_physical';
    let query = pesaSupabase.from(tableName).select('*');

    if (selectedTaluka) query = query.eq('taluka_name', selectedTaluka);
    if (selectedGramPanchayat) query = query.eq('gram_panchayat', selectedGramPanchayat);
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
        ? `पेसा 5% थेट निधी योजना - तालुका स्तरीय अहवाल - ${monthName} ${year}`
        : `PESA 5% Direct Fund Scheme - Taluka Level Report - ${monthName} ${year}`,
      pageWidth / 2, 20, { align: 'center' }
    );

    const tabLabel = activeTab === 'financial'
      ? (language === 'mr' ? 'आर्थिक प्रगती अहवाल' : 'Financial Progress Report')
      : (language === 'mr' ? 'भौतिक प्रगती अहवाल' : 'Physical Progress Report');
    doc.setFontSize(9);
    doc.text(tabLabel, pageWidth / 2, 27, { align: 'center' });

    let startY = 36;

    if (activeTab === 'financial') {
      generateFinancialTable(doc, works, selectedCategory, language, startY);
    } else {
      generatePhysicalTable(doc, works, selectedCategory, language, startY);
    }

    const fileName = `Taluka_${activeTab}_Report_${monthName}_${year}.pdf`;
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
    if (!work.gram_panchayat) return;
    const key = `${work.gram_panchayat}|${work.work_category}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        gram_panchayat: work.gram_panchayat,
        pesa_village_count: work.pesa_village_count || 0,
        annual_approved_fund: parseNumeric(work.annual_approved_fund),
        annual_received_fund: parseNumeric(work.annual_received_fund),
        received_interest: parseNumeric(work.received_interest),
        A: { received: 0, prev: 0, curr: 0, total: 0, remaining: 0 },
        B: { received: 0, prev: 0, curr: 0, total: 0, remaining: 0 },
        C: { received: 0, prev: 0, curr: 0, total: 0, remaining: 0 },
        D: { received: 0, prev: 0, curr: 0, total: 0, remaining: 0 },
      });
    }
    const entry = grouped.get(key)!;
    const cat = work.work_category;
    if (entry[cat]) {
      entry[cat].received = parseNumeric(work.annual_received_fund);
      entry[cat].prev = parseNumeric(work.previous_expenditure);
      entry[cat].curr = parseNumeric(work.current_expenditure);
      entry[cat].total = parseNumeric(work.cumulative_expenditure);
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
    { content: language === 'mr' ? 'ग्रामपंचायत' : 'Gram Panchayat', rowSpan: 2 },
    { content: language === 'mr' ? 'पेसा गावे' : 'PESA Villages', rowSpan: 2 },
    { content: language === 'mr' ? 'मंजूर निधी' : 'Approved Fund', rowSpan: 2 },
    { content: language === 'mr' ? 'प्राप्त निधी' : 'Received Fund', rowSpan: 2 },
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
    const row: any[] = [
      idx + 1,
      entry.gram_panchayat,
      entry.pesa_village_count,
      entry.annual_approved_fund.toLocaleString('en-IN'),
      entry.annual_received_fund.toLocaleString('en-IN'),
      entry.received_interest.toLocaleString('en-IN'),
    ];
    let grandTotal = [0, 0, 0, 0, 0];
    categories.forEach(cat => {
      const d = entry[cat];
      const vals = [d.received, d.prev, d.curr, d.total, d.remaining];
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
    { content: dataRows.reduce((s, e) => s + parseNumeric(e.pesa_village_count), 0), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + e.annual_approved_fund, 0).toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + e.annual_received_fund, 0).toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    { content: dataRows.reduce((s, e) => s + e.received_interest, 0).toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
  ];

  let grandTotals = Array(5).fill(0);
  categories.forEach(cat => {
    const catTotals = [0, 0, 0, 0, 0];
    dataRows.forEach(e => {
      catTotals[0] += e[cat].received;
      catTotals[1] += e[cat].prev;
      catTotals[2] += e[cat].curr;
      catTotals[3] += e[cat].total;
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
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 25, halign: 'left' } },
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
    if (!work.gram_panchayat) return;
    const key = `${work.gram_panchayat}|${work.work_category}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        gram_panchayat: work.gram_panchayat,
        pesa_village_count: work.pesa_village_count || 0,
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
    { content: language === 'mr' ? 'ग्रामपंचायत' : 'Gram Panchayat', rowSpan: 2 },
    { content: language === 'mr' ? 'पेसा गावे' : 'Villages', rowSpan: 2 },
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
    const row: any[] = [idx + 1, entry.gram_panchayat, entry.pesa_village_count];
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
    { content: dataRows.reduce((s, e) => s + parseNumeric(e.pesa_village_count), 0), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
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
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 30, halign: 'left' } },
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
