import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pesaSupabase } from '../../utils/supabase';
import GovtLogo from '../../assets/govtMH logo.png';

interface DownloadGrampanchayatPdfProps {
  selectedTaluka?: string;
  selectedGramPanchayat?: string;
  selectedCategory?: string;
  selectedYear?: string;
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

export const handleDownloadGrampanchayatPdf = async ({
  selectedTaluka,
  selectedGramPanchayat,
  selectedCategory,
  selectedYear,
  language = 'en',
  activeTab,
}: DownloadGrampanchayatPdfProps) => {
  try {
    const tableName = activeTab === 'financial' ? 'aarakhada_financial' : 'aarakhada_physical';
    let query = pesaSupabase.from(tableName).select('*');

    if (selectedTaluka) query = query.eq('taluka', selectedTaluka);
    if (selectedGramPanchayat) query = query.eq('gram_panchayat', selectedGramPanchayat);
    if (selectedCategory) query = query.eq('work_category', selectedCategory);
    if (selectedYear) query = query.eq('year', selectedYear);

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

    // Header with logo
    const headerColor: [number, number, number] = [26, 78, 148];
    doc.setFillColor(...headerColor);
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.addImage(logoBase64, 'PNG', 8, 3, 26, 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(
      language === 'mr'
        ? 'जिल्हा परिषद, चंद्रपूर'
        : 'Zilla Parishad, Chandrapur',
      pageWidth / 2, 12, { align: 'center' }
    );

    doc.setFontSize(10);
    doc.text(
      language === 'mr'
        ? `पेसा 5% थेट निधी योजना - ग्रामपंचायत स्तरीय अहवाल - ${monthName} ${year}`
        : `PESA 5% Direct Fund Scheme - Gram Panchayat Level Report - ${monthName} ${year}`,
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

    const fileName = `GP_${activeTab}_Report_${monthName}_${year}.pdf`;
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
    if (!work.village_name) return;
    const key = `${work.village_name}|${work.work_category}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        village_name: work.village_name,
        A: { received: 0, prev: 0, curr: 0, total: 0, remaining: 0 },
        B: { received: 0, prev: 0, curr: 0, total: 0, remaining: 0 },
        C: { received: 0, prev: 0, curr: 0, total: 0, remaining: 0 },
        D: { received: 0, prev: 0, curr: 0, total: 0, remaining: 0 },
      });
    }
    const entry = grouped.get(key)!;
    const cat = work.work_category;
    if (entry[cat]) {
      entry[cat].received = parseNumeric(work.released_amount);
      entry[cat].prev = parseNumeric(work.previous_expenditure);
      entry[cat].curr = parseNumeric(work.current_expenditure);
      entry[cat].total = parseNumeric(work.cumulative_expenditure);
      entry[cat].remaining = parseNumeric(work.remaining_funds);
    }
  });

  const finLabels = language === 'mr'
    ? ['एकूण प्राप्त', 'मागील खर्च', 'चालू खर्च', 'एकूण खर्च', 'उर्वरित']
    : ['Received', 'Prev Exp', 'Curr Exp', 'Total Exp', 'Remaining'];

  const catLabels: Record<string, string> = language === 'mr'
    ? { A: '(अ)', B: '(ब)', C: '(क)', D: '(ड)' }
    : { A: '(A)', B: '(B)', C: '(C)', D: '(D)' };

  const categories = selectedCategory ? [selectedCategory] : ['A', 'B', 'C', 'D'];

  const headerRow1: any[] = [
    { content: language === 'mr' ? 'अ.क्र.' : 'Sr.', rowSpan: 2 },
    { content: language === 'mr' ? 'गावाचे नाव' : 'Village Name', rowSpan: 2 },
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
  const totals = Array((categories.length + (selectedCategory ? 0 : 1)) * 5).fill(0);

  dataRows.forEach((entry, idx) => {
    const row: any[] = [idx + 1, entry.village_name];
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
    row.forEach((v, i) => {
      if (i >= 2) totals[i - 2] += parseNumeric(v.toString().replace(/,/g, ''));
    });
    body.push(row);
  });

  const totalRow: any[] = [
    { content: language === 'mr' ? 'एकूण' : 'Total', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    ...totals.map(v => ({ content: v.toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }))
  ];
  body.push(totalRow);

  autoTable(doc, {
    startY,
    head: [headerRow1, headerRow2],
    body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, halign: 'center', valign: 'middle', overflow: 'linebreak' },
    headStyles: { fillColor: [26, 78, 148], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 28, halign: 'left' } },
    margin: { left: 6, right: 6 },
    didDrawPage: (data) => addFooter(doc, language),
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
    if (!work.village_name) return;
    const key = `${work.village_name}|${work.work_category}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        village_name: work.village_name,
        A: { sanctioned: 0, completed: 0, ongoing: 0, pending: 0 },
        B: { sanctioned: 0, completed: 0, ongoing: 0, pending: 0 },
        C: { sanctioned: 0, completed: 0, ongoing: 0, pending: 0 },
        D: { sanctioned: 0, completed: 0, ongoing: 0, pending: 0 },
      });
    }
    const entry = grouped.get(key)!;
    const cat = work.work_category;
    if (entry[cat]) {
      entry[cat].sanctioned += parseNumeric(work.sanctioned_works);
      entry[cat].completed += parseNumeric(work.completed_works);
      entry[cat].ongoing += parseNumeric(work.progress_works || work.ongoing_works);
      entry[cat].pending += parseNumeric(work.not_started_works || work.pending_works);
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
    { content: language === 'mr' ? 'गावाचे नाव' : 'Village Name', rowSpan: 2 },
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
  const totals = Array((categories.length + (selectedCategory ? 0 : 1)) * 4).fill(0);

  dataRows.forEach((entry, idx) => {
    const row: any[] = [idx + 1, entry.village_name];
    let grandTotal = [0, 0, 0, 0];
    categories.forEach(cat => {
      const d = entry[cat];
      const vals = [d.sanctioned, d.completed, d.ongoing, d.pending];
      vals.forEach((v, i) => grandTotal[i] += v);
      row.push(...vals);
    });
    if (!selectedCategory) {
      row.push(...grandTotal);
    }
    row.forEach((v, i) => {
      if (i >= 2) totals[i - 2] += Number(v) || 0;
    });
    body.push(row);
  });

  const totalRow: any[] = [
    { content: language === 'mr' ? 'एकूण' : 'Total', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
    ...totals.map(v => ({ content: v, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }))
  ];
  body.push(totalRow);

  autoTable(doc, {
    startY,
    head: [headerRow1, headerRow2],
    body,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.3, halign: 'center', valign: 'middle', overflow: 'linebreak' },
    headStyles: { fillColor: [26, 78, 148], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, cellPadding: 2.3 },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 32, halign: 'left' } },
    margin: { left: 6, right: 6 },
    didDrawPage: (data) => addFooter(doc, language),
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
