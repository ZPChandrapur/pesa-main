import html2pdf from 'html2pdf.js';
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
  // Improved PDF generation with better Marathi font support and Excel-like formatting
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

    // Generate HTML content
    let htmlContent = '';

    if (activeTab === 'financial') {
      htmlContent = await generateFinancialHtml(works, selectedCategory, language, logoBase64, monthName, year);
    } else {
      htmlContent = await generatePhysicalHtml(works, selectedCategory, language, logoBase64, monthName, year);
    }

    // Create a temporary container for html2pdf
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.padding = '10px';
    element.style.fontFamily = "'Noto Sans Devanagari', 'Arial Unicode MS', Arial, sans-serif";
    element.style.width = '100%';
    element.style.maxWidth = '1050px';
    element.style.margin = '0 auto';
    element.style.backgroundColor = '#ffffff';
    element.style.fontSize = '12px';

    // Add Google Fonts for Marathi support with preload
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Wait for fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    const fileName = `District_${activeTab}_Report_${monthName}_${year}.pdf`;
    
    const options = {
      margin: [5 as const, 5 as const, 5 as const, 5 as const] as [number, number, number, number],
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.99 },
      html2canvas: { 
        scale: 2,
        useCORS: true, 
        logging: false, 
        backgroundColor: '#ffffff',
        letterRendering: true,
        allowTaint: true,
        foreignObjectRendering: true
      },
      jsPDF: { orientation: 'landscape' as const, unit: 'mm', format: 'a4', compress: false },
      pagebreak: { mode: ['avoid-all'] }
    };

    html2pdf().set(options).from(element).save();
    
    // Clean up
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Failed to generate PDF report.');
    return false;
  }
};

async function generateFinancialHtml(
  works: any[],
  selectedCategory: string | undefined,
  language: string,
  logoBase64: string,
  monthName: string,
  year: number
): Promise<string> {
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

  const catLabels: Record<string, string> = language === 'mr'
    ? { A: '(अ)', B: '(ब)', C: '(क)', D: '(ड)' }
    : { A: '(A)', B: '(B)', C: '(C)', D: '(D)' };

  const categories = selectedCategory ? [selectedCategory] : ['A', 'B', 'C', 'D'];
  const dataRows = Array.from(grouped.values());

  let tableHtml = `
    <div style="font-family: 'Noto Sans Devanagari', 'Arial Unicode MS', Arial, sans-serif; margin-bottom: 20px; width: 100%;">
      <div style="text-align: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 3px solid #003d99;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 10px;">
          <img src="${logoBase64}" style="height: 70px; width: auto;" />
          <div style="text-align: center;">
            <h1 style="margin: 0 0 8px 0; color: #003d99; font-size: 20px; font-weight: 700; font-family: 'Noto Sans Devanagari', 'Arial Unicode MS', Arial, sans-serif;">${language === 'mr' ? 'जिल्हा परिषद, चंद्रपूर' : 'Zilla Parishad, Chandrapur'}</h1>
            <h2 style="margin: 0 0 6px 0; color: #003d99; font-size: 16px; font-weight: 600; font-family: 'Noto Sans Devanagari', 'Arial Unicode MS', Arial, sans-serif;">${language === 'mr' ? 'पेसा 5% थेट निधी योजना' : 'PESA 5% Direct Fund Scheme'}</h2>
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #333; font-family: 'Noto Sans Devanagari', 'Arial Unicode MS', Arial, sans-serif;">${language === 'mr' ? 'जिल्हा स्तरीय आर्थिक प्रगती अहवाल' : 'District Level Financial Progress Report'}</p>
            <p style="margin: 0; font-size: 12px; color: #666; font-family: 'Noto Sans Devanagari', 'Arial Unicode MS', Arial, sans-serif;">${monthName} ${year}</p>
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: 'Noto Sans Devanagari', 'Arial Unicode MS', Arial, sans-serif;">
        <thead>
        <tr style="background-color: #003d99; color: white; font-weight: bold; height: 25px;">
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 30px;">Sr.</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 80px;">${language === 'mr' ? 'तालुका' : 'Taluka'}</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 50px;">${language === 'mr' ? 'ग्रा.पं.' : 'GP'}</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 60px;">${language === 'mr' ? 'गावे' : 'Villages'}</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 70px;">${language === 'mr' ? 'मंजूर' : 'Approved'}</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 70px;">${language === 'mr' ? 'प्राप्त' : 'Received'}</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 60px;">${language === 'mr' ? 'व्याज' : 'Interest'}</th>
          ${categories.map(cat => `
            <th colspan="5" style="border: 1px solid #999999; padding: 6px 2px; text-align: center; background-color: #004da6; font-size: 10px;">${catLabels[cat]}</th>
          `).join('')}
          ${!selectedCategory ? `
            <th colspan="5" style="border: 1px solid #999999; padding: 6px 2px; text-align: center; background-color: #004da6; font-size: 10px;">${language === 'mr' ? 'एकूण' : 'Total'}</th>
          ` : ''}
        </tr>
        <tr style="background-color: #0055b8; color: white; font-weight: bold; height: 22px;">
          <th colspan="7" style="border: 1px solid #999999; padding: 0;"></th>
          ${categories.map(() => `
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'प्र.' : 'Rec'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'मा.' : 'Prv'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'cha.' : 'Cur'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'ए.' : 'Tot'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'उ.' : 'Rem'}</th>
          `).join('')}
          ${!selectedCategory ? `
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'प्र.' : 'Rec'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'मा.' : 'Prv'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'cha.' : 'Cur'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'ए.' : 'Tot'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'उ.' : 'Rem'}</th>
          ` : ''}
        </tr>
      </thead>
      <tbody>
  `;

  dataRows.forEach((entry, idx) => {
    const totalApproved = ['A', 'B', 'C', 'D'].reduce((s, c) => s + entry[c].approved, 0);
    const totalReceived = ['A', 'B', 'C', 'D'].reduce((s, c) => s + entry[c].received, 0);
    const totalInterest = ['A', 'B', 'C', 'D'].reduce((s, c) => s + entry[c].interest, 0);
    const bgColor = idx % 2 === 0 ? '#f5f5f5' : '#ffffff';

    tableHtml += `
      <tr style="background-color: ${bgColor}; height: 22px;">
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${idx + 1}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: left; font-size: 10px;">${entry.taluka_name}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${entry.pesa_gp_count}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${entry.pesa_village_count}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 10px; font-weight: bold;">${totalApproved.toLocaleString('en-IN')}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 10px; font-weight: bold;">${totalReceived.toLocaleString('en-IN')}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 10px; font-weight: bold;">${totalInterest.toLocaleString('en-IN')}</td>
        ${categories.map(cat => {
          const d = entry[cat];
          return `
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px;">${d.total_received.toLocaleString('en-IN')}</td>
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px;">${d.prev.toLocaleString('en-IN')}</td>
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px;">${d.curr.toLocaleString('en-IN')}</td>
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px;">${d.total_exp.toLocaleString('en-IN')}</td>
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px;">${d.remaining.toLocaleString('en-IN')}</td>
          `;
        }).join('')}
        ${!selectedCategory ? categories.reduce((html, cat, catIdx) => {
          if (catIdx === 0) {
            let grandTotal = [0, 0, 0, 0, 0];
            categories.forEach(c => {
              grandTotal[0] += entry[c].total_received;
              grandTotal[1] += entry[c].prev;
              grandTotal[2] += entry[c].curr;
              grandTotal[3] += entry[c].total_exp;
              grandTotal[4] += entry[c].remaining;
            });
            return html + `
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px; font-weight: bold;">${grandTotal[0].toLocaleString('en-IN')}</td>
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px; font-weight: bold;">${grandTotal[1].toLocaleString('en-IN')}</td>
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px; font-weight: bold;">${grandTotal[2].toLocaleString('en-IN')}</td>
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px; font-weight: bold;">${grandTotal[3].toLocaleString('en-IN')}</td>
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 9px; font-weight: bold;">${grandTotal[4].toLocaleString('en-IN')}</td>
            `;
          }
          return html;
        }, '') : ''}
      </tr>
    `;
  });

  // Add total row
  const totalRow = `
    <tr style="background-color: #e8e8e8; font-weight: bold; height: 24px;">
      <td colspan="2" style="border: 1px solid #999999; padding: 6px 4px; text-align: center; font-size: 11px; font-weight: bold;">${language === 'mr' ? 'एकूण' : 'TOTAL'}</td>
      <td style="border: 1px solid #999999; padding: 6px 4px; text-align: center; font-size: 11px; font-weight: bold;">${dataRows.reduce((s, e) => s + e.pesa_gp_count, 0)}</td>
      <td style="border: 1px solid #999999; padding: 6px 4px; text-align: center; font-size: 11px; font-weight: bold;">${dataRows.reduce((s, e) => s + e.pesa_village_count, 0)}</td>
      <td style="border: 1px solid #999999; padding: 6px 4px; text-align: right; font-size: 11px; font-weight: bold;">${dataRows.reduce((s, e) => s + ['A','B','C','D'].reduce((ss, c) => ss + e[c].approved, 0), 0).toLocaleString('en-IN')}</td>
      <td style="border: 1px solid #999999; padding: 6px 4px; text-align: right; font-size: 11px; font-weight: bold;">${dataRows.reduce((s, e) => s + ['A','B','C','D'].reduce((ss, c) => ss + e[c].received, 0), 0).toLocaleString('en-IN')}</td>
      <td style="border: 1px solid #999999; padding: 6px 4px; text-align: right; font-size: 11px; font-weight: bold;">${dataRows.reduce((s, e) => s + ['A','B','C','D'].reduce((ss, c) => ss + e[c].interest, 0), 0).toLocaleString('en-IN')}</td>
      ${categories.map(cat => {
        const catTotals = [0, 0, 0, 0, 0];
        dataRows.forEach(e => {
          catTotals[0] += e[cat].total_received;
          catTotals[1] += e[cat].prev;
          catTotals[2] += e[cat].curr;
          catTotals[3] += e[cat].total_exp;
          catTotals[4] += e[cat].remaining;
        });
        return `
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${catTotals[0].toLocaleString('en-IN')}</td>
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${catTotals[1].toLocaleString('en-IN')}</td>
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${catTotals[2].toLocaleString('en-IN')}</td>
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${catTotals[3].toLocaleString('en-IN')}</td>
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${catTotals[4].toLocaleString('en-IN')}</td>
        `;
      }).join('')}
      ${!selectedCategory ? categories.reduce((html, cat, catIdx) => {
        if (catIdx === 0) {
          let grandTotals = [0, 0, 0, 0, 0];
          categories.forEach(c => {
            dataRows.forEach(e => {
              grandTotals[0] += e[c].total_received;
              grandTotals[1] += e[c].prev;
              grandTotals[2] += e[c].curr;
              grandTotals[3] += e[c].total_exp;
              grandTotals[4] += e[c].remaining;
            });
          });
          return html + `
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${grandTotals[0].toLocaleString('en-IN')}</td>
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${grandTotals[1].toLocaleString('en-IN')}</td>
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${grandTotals[2].toLocaleString('en-IN')}</td>
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${grandTotals[3].toLocaleString('en-IN')}</td>
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: right; font-size: 10px; font-weight: bold;">${grandTotals[4].toLocaleString('en-IN')}</td>
          `;
        }
        return html;
      }, '') : ''}
    </tr>
  `;

  tableHtml += totalRow + `</tbody></table></div>`;

  return tableHtml;
}

async function generatePhysicalHtml(
  works: any[],
  selectedCategory: string | undefined,
  language: string,
  logoBase64: string,
  monthName: string,
  year: number
): Promise<string> {
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

  const catLabels: Record<string, string> = language === 'mr'
    ? { A: '(अ)', B: '(ब)', C: '(क)', D: '(ड)' }
    : { A: '(A)', B: '(B)', C: '(C)', D: '(D)' };

  const categories = selectedCategory ? [selectedCategory] : ['A', 'B', 'C', 'D'];
  const dataRows = Array.from(grouped.values());

  let tableHtml = `
    <div style="font-family: 'Noto Sans Devanagari', Arial, sans-serif; margin-bottom: 20px;">
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #003d99;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px;">
          <img src="${logoBase64}" style="height: 60px; width: auto;" />
          <div style="text-align: center;">
            <h1 style="margin: 0 0 5px 0; color: #003d99; font-size: 18px; font-weight: bold;">${language === 'mr' ? 'जिल्हा परिषद, चंद्रपूर' : 'Zilla Parishad, Chandrapur'}</h1>
            <h2 style="margin: 0 0 5px 0; color: #003d99; font-size: 14px; font-weight: bold;">${language === 'mr' ? 'पेसा 5% थेट निधी योजना' : 'PESA 5% Direct Fund Scheme'}</h2>
            <p style="margin: 0 0 3px 0; font-size: 12px; color: #333;">${language === 'mr' ? 'जिल्हा स्तरीय भौतिक प्रगती अहवाल' : 'District Level Physical Progress Report'}</p>
            <p style="margin: 0; font-size: 11px; color: #666;">${monthName} ${year}</p>
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 10px; font-family: 'Noto Sans Devanagari', Arial, sans-serif;">
      <thead>
      <thead>
        <tr style="background-color: #003d99; color: white; font-weight: bold; height: 25px;">
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 30px;">Sr.</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 80px;">${language === 'mr' ? 'तालुका' : 'Taluka'}</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 50px;">${language === 'mr' ? 'ग्रा.पं.' : 'GP'}</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 60px;">${language === 'mr' ? 'गावे' : 'Villages'}</th>
          <th style="border: 1px solid #999999; padding: 6px 4px; text-align: center; min-width: 70px;">${language === 'mr' ? 'मंजूर' : 'Sanctioned'}</th>
          ${categories.map(cat => `
            <th colspan="4" style="border: 1px solid #999999; padding: 6px 2px; text-align: center; background-color: #004da6; font-size: 10px;">${catLabels[cat]}</th>
          `).join('')}
          ${!selectedCategory ? `
            <th colspan="4" style="border: 1px solid #999999; padding: 6px 2px; text-align: center; background-color: #004da6; font-size: 10px;">${language === 'mr' ? 'एकूण' : 'Total'}</th>
          ` : ''}
        </tr>
        <tr style="background-color: #0055b8; color: white; font-weight: bold; height: 22px;">
          <th colspan="5" style="border: 1px solid #999999; padding: 0;"></th>
          ${categories.map(() => `
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'मंजूर' : 'San'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'पूर्ण' : 'Com'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'चालू' : 'Ong'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'प्रलंबित' : 'Pen'}</th>
          `).join('')}
          ${!selectedCategory ? `
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'मंजूर' : 'San'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'पूर्ण' : 'Com'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'चालू' : 'Ong'}</th>
            <th style="border: 1px solid #999999; padding: 3px 2px; text-align: center; font-size: 9px; background-color: #0055b8;">${language === 'mr' ? 'प्रलंबित' : 'Pen'}</th>
          ` : ''}
        </tr>
      </thead>
      <tbody>
  `;

  dataRows.forEach((entry, idx) => {
    const totalSanctioned = ['A', 'B', 'C', 'D'].reduce((s, c) => s + entry[c].sanctioned, 0);
    const bgColor = idx % 2 === 0 ? '#f5f5f5' : '#ffffff';

    tableHtml += `
      <tr style="background-color: ${bgColor}; height: 22px;">
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${idx + 1}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: left; font-size: 10px;">${entry.taluka_name}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${entry.pesa_gp_count}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${entry.pesa_village_count}</td>
        <td style="border: 1px solid #cccccc; padding: 4px; text-align: right; font-size: 10px; font-weight: bold;">${totalSanctioned}</td>
        ${categories.map(cat => {
          const d = entry[cat];
          return `
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${d.sanctioned}</td>
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${d.completed}</td>
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${d.ongoing}</td>
            <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px;">${d.pending}</td>
          `;
        }).join('')}
        ${!selectedCategory ? categories.reduce((html, cat, catIdx) => {
          if (catIdx === 0) {
            let grandTotal = [0, 0, 0, 0];
            categories.forEach(c => {
              grandTotal[0] += entry[c].sanctioned;
              grandTotal[1] += entry[c].completed;
              grandTotal[2] += entry[c].ongoing;
              grandTotal[3] += entry[c].pending;
            });
            return html + `
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px; font-weight: bold;">${grandTotal[0]}</td>
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px; font-weight: bold;">${grandTotal[1]}</td>
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px; font-weight: bold;">${grandTotal[2]}</td>
              <td style="border: 1px solid #cccccc; padding: 4px; text-align: center; font-size: 10px; font-weight: bold;">${grandTotal[3]}</td>
            `;
          }
          return html;
        }, '') : ''}
      </tr>
    `;
  });

  // Add total row
  const totalRow = `
    <tr style="background-color: #e8e8e8; font-weight: bold; height: 24px;">
      <td colspan="2" style="border: 1px solid #999999; padding: 6px 4px; text-align: center; font-size: 11px; font-weight: bold;">${language === 'mr' ? 'एकूण' : 'TOTAL'}</td>
      <td style="border: 1px solid #999999; padding: 6px 4px; text-align: center; font-size: 11px; font-weight: bold;">${dataRows.reduce((s, e) => s + e.pesa_gp_count, 0)}</td>
      <td style="border: 1px solid #999999; padding: 6px 4px; text-align: center; font-size: 11px; font-weight: bold;">${dataRows.reduce((s, e) => s + e.pesa_village_count, 0)}</td>
      <td style="border: 1px solid #999999; padding: 6px 4px; text-align: right; font-size: 11px; font-weight: bold;">${dataRows.reduce((s, e) => s + ['A','B','C','D'].reduce((ss, c) => ss + e[c].sanctioned, 0), 0)}</td>
      ${categories.map(cat => {
        const catTotals = [0, 0, 0, 0];
        dataRows.forEach(e => {
          catTotals[0] += e[cat].sanctioned;
          catTotals[1] += e[cat].completed;
          catTotals[2] += e[cat].ongoing;
          catTotals[3] += e[cat].pending;
        });
        return `
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: center; font-size: 10px; font-weight: bold;">${catTotals[0]}</td>
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: center; font-size: 10px; font-weight: bold;">${catTotals[1]}</td>
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: center; font-size: 10px; font-weight: bold;">${catTotals[2]}</td>
          <td style="border: 1px solid #999999; padding: 6px 2px; text-align: center; font-size: 10px; font-weight: bold;">${catTotals[3]}</td>
        `;
      }).join('')}
      ${!selectedCategory ? categories.reduce((html, cat, catIdx) => {
        if (catIdx === 0) {
          let grandTotals = [0, 0, 0, 0];
          categories.forEach(c => {
            dataRows.forEach(e => {
              grandTotals[0] += e[c].sanctioned;
              grandTotals[1] += e[c].completed;
              grandTotals[2] += e[c].ongoing;
              grandTotals[3] += e[c].pending;
            });
          });
          return html + `
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: center; font-size: 10px; font-weight: bold;">${grandTotals[0]}</td>
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: center; font-size: 10px; font-weight: bold;">${grandTotals[1]}</td>
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: center; font-size: 10px; font-weight: bold;">${grandTotals[2]}</td>
            <td style="border: 1px solid #999999; padding: 6px 2px; text-align: center; font-size: 10px; font-weight: bold;">${grandTotals[3]}</td>
          `;
        }
        return html;
      }, '') : ''}
    </tr>
  `;

  tableHtml += totalRow + `</tbody></table></div>`;

  return tableHtml;
}
