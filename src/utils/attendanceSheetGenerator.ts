import { Program } from '../types';

type AttendeeEntry = { name: string; remark?: string };

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

// Approx A4 portrait in pixels
const PAGE_WIDTH = 990;
const PAGE_HEIGHT = 1400;

const drawPage = async (
  ctx: CanvasRenderingContext2D,
  params: { departmentName: string; program: Program; attendees: AttendeeEntry[] },
  startIndex: number,
  count: number
) => {
  const { departmentName, program, attendees } = params;
  // Background and border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, PAGE_WIDTH - 48, PAGE_HEIGHT - 48);
  

  // Header band
  const headerY = 60;
  const headerHeight = 160;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(48, headerY, PAGE_WIDTH - 96, headerHeight);

  // Load logos
  let nssImg: HTMLImageElement | null = null;
  let collegeImg: HTMLImageElement | null = null;
  try { nssImg = await loadImage('/download.png'); } catch {}
  try {
    try { collegeImg = await loadImage('/mamo-logo.png'); }
    catch { try { collegeImg = await loadImage('/mamo%20logo.png'); } catch { collegeImg = await loadImage('/college-logo.png'); } }
  } catch {}

  // Draw logos
  const leftLogoX = 90, leftLogoY = headerY + headerHeight / 2, leftR = 70;
  if (collegeImg) {
    ctx.save();
    ctx.beginPath(); ctx.arc(leftLogoX, leftLogoY, leftR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(collegeImg, leftLogoX - leftR, leftLogoY - leftR, leftR * 2, leftR * 2);
    ctx.restore();
  }
  const rightLogoX = PAGE_WIDTH - 90, rightLogoY = headerY + headerHeight / 2, rightR = 55;
  if (nssImg) {
    ctx.save();
    ctx.beginPath(); ctx.arc(rightLogoX, rightLogoY, rightR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(nssImg, rightLogoX - rightR, rightLogoY - rightR, rightR * 2, rightR * 2);
    ctx.restore();
  }

  // Header text
  const centerX = PAGE_WIDTH / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 28px serif';
  ctx.fillText('MUHAMMED ABDURAHIMAN MEMORIAL   ', centerX, headerY + 56);
  ctx.fillText('ORPHANAGE (MAMO) COLLEGE, MANASSERY', centerX, headerY + 86);
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('National Service Scheme (NSS)', centerX, headerY + 118);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 30px serif';
  ctx.fillText('Department-wise Attendance Sheet', centerX, headerY + 150);

  // Meta info: department, program, date/time
  const metaStartY = headerY + headerHeight + 30;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px serif';
  ctx.fillText(`Department: ${departmentName}`, 80, metaStartY);
  ctx.fillText(`Program: ${program.title}`, 80, metaStartY + 34);
  ctx.font = '18px serif';
  const programDateStr = new Date(program.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillText(`Date: ${programDateStr}   Time: ${program.time}`, 80, metaStartY + 64);
  ctx.fillText(`Venue: ${program.venue}`, 80, metaStartY + 92);

  // Table header
  const tableStartY = metaStartY + 120;
  const tableLeftX = 80;
  const colNumW = 60;
  const colRemarkW = 280;
  const colNameW = Math.max(300, PAGE_WIDTH - tableLeftX - colNumW - colRemarkW - 80);
  const rowH = 36;

  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('#', tableLeftX + 10, tableStartY);
  ctx.fillText('Student Name', tableLeftX + colNumW + 10, tableStartY);
  ctx.fillText('Remark', tableLeftX + colNumW + colNameW + 10, tableStartY);

  // Divider line under header
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tableLeftX, tableStartY + 8);
  ctx.lineTo(PAGE_WIDTH - 80, tableStartY + 8);
  ctx.stroke();

  // Rows
  ctx.fillStyle = '#111827';
  ctx.font = '16px serif';
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const a = attendees[idx];
    const y = tableStartY + 20 + rowH * (i + 1);
    ctx.fillText(String(idx + 1), tableLeftX + 10, y);
    const name = a.name;
    ctx.fillText(name, tableLeftX + colNumW + 10, y);
    if (a.remark) {
      ctx.fillStyle = '#374151';
      ctx.fillText(a.remark, tableLeftX + colNumW + colNameW + 10, y);
      ctx.fillStyle = '#111827';
    }
  }

  // Signature block at bottom-right
  const signY = PAGE_HEIGHT - 160;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#374151';
  ctx.font = '16px serif';
  ctx.fillText('Signature & Seal of NSS Officer', PAGE_WIDTH - 80, signY);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6b7280';
  ctx.font = 'italic 16px serif';
  ctx.fillText('NSS MAMO COLLEGE', centerX, PAGE_HEIGHT - 40);
};

export const generateAttendanceSheetDataUrl = async (
  params: {
    departmentName: string;
    program: Program;
    attendees: AttendeeEntry[];
  }
): Promise<string | string[]> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;

  // Pagination: compute rows per page
  const headerY = 60;
  const headerHeight = 160;
  const metaStartY = headerY + headerHeight + 30;
  const tableStartY = metaStartY + 120;
  const rowH = 36;
  const availableHeight = PAGE_HEIGHT - tableStartY - 200; // some bottom space
  const rowsPerPage = Math.max(10, Math.floor(availableHeight / rowH));

  if (params.attendees.length <= rowsPerPage) {
    await drawPage(ctx, params, 0, params.attendees.length);
    return canvas.toDataURL('image/png');
  }

  const pages: string[] = [];
  for (let start = 0; start < params.attendees.length; start += rowsPerPage) {
    const count = Math.min(rowsPerPage, params.attendees.length - start);
    await drawPage(ctx, params, start, count);
    pages.push(canvas.toDataURL('image/png'));
  }
  return pages;
};

export const downloadAttendanceSheet = async (params: {
  departmentName: string;
  program: Program;
  attendees: AttendeeEntry[];
}) => {
  const result = await generateAttendanceSheetDataUrl(params);
  const baseName = `${params.departmentName.replace(/\s+/g, '_')}_${params.program.title.replace(/\s+/g, '_')}_Attendance`;
  if (typeof result === 'string') {
    const link = document.createElement('a');
    link.download = `${baseName}.png`;
    link.href = result;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    result.forEach((url, i) => {
      const link = document.createElement('a');
      link.download = `${baseName}_page_${i + 1}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
};

export type { AttendeeEntry };


