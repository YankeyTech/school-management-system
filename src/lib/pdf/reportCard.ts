import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import type { ReportCard } from '@/types';

const COLORS = {
  primary: rgb(0.145, 0.388, 0.922),  // #2563EB
  dark: rgb(0.07, 0.09, 0.12),
  gray: rgb(0.44, 0.52, 0.58),
  lightGray: rgb(0.95, 0.96, 0.97),
  border: rgb(0.88, 0.90, 0.93),
  white: rgb(1, 1, 1),
  success: rgb(0.035, 0.588, 0.420),
  warning: rgb(0.851, 0.467, 0.024),
  danger: rgb(0.863, 0.149, 0.149),
};

export async function generateReportCardPDF(reportCard: ReportCard): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  let y = height - 40;

  // ─── Header ───────────────────────────────────────────────

  // Blue header band
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width,
    height: 120,
    color: COLORS.primary,
  });

  // School name
  page.drawText('EduCore School', {
    x: 40,
    y: height - 50,
    size: 20,
    font: boldFont,
    color: COLORS.white,
  });

  // Report card label
  page.drawText('STUDENT REPORT CARD', {
    x: 40,
    y: height - 75,
    size: 10,
    font: regularFont,
    color: rgb(0.8, 0.87, 0.99),
  });

  // Term & Year
  page.drawText(`${reportCard.term.name} | ${reportCard.academic_year.name}`, {
    x: 40,
    y: height - 95,
    size: 9,
    font: regularFont,
    color: rgb(0.8, 0.87, 0.99),
  });

  // Right side — overall stats
  drawText(page, boldFont, `${reportCard.overall_grade}`, width - 100, height - 60, 32, COLORS.white);
  drawText(page, regularFont, 'Overall Grade', width - 115, height - 80, 8, rgb(0.8, 0.87, 0.99));
  drawText(page, regularFont, `${reportCard.total_percentage.toFixed(1)}% | Pos: ${reportCard.overall_position}/${reportCard.total_students}`, width - 140, height - 95, 8, rgb(0.8, 0.87, 0.99));

  y = height - 140;

  // ─── Student Info ─────────────────────────────────────────

  page.drawRectangle({ x: 30, y: y - 70, width: width - 60, height: 75, color: COLORS.lightGray, borderColor: COLORS.border, borderWidth: 0.5 });

  const student = reportCard.student;
  drawText(page, boldFont, `${student.first_name} ${student.other_names ?? ''} ${student.last_name}`.trim(), 45, y - 20, 14, COLORS.dark);

  const infoItems = [
    ['Student ID', student.student_id],
    ['Class', reportCard.class.name + (reportCard.class.section ? ` (${reportCard.class.section})` : '')],
    ['Admission No.', student.admission_number],
    ['Gender', student.gender.charAt(0).toUpperCase() + student.gender.slice(1)],
  ];

  infoItems.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? 45 : width / 2;
    const row = i < 2 ? y - 42 : y - 58;
    drawText(page, regularFont, `${label}: `, col, row, 8, COLORS.gray);
    drawText(page, boldFont, value, col + 70, row, 8, COLORS.dark);
  });

  y -= 90;

  // ─── Attendance Summary ───────────────────────────────────

  const att = reportCard.attendance;
  const attItems = [
    { label: 'Total Days', value: att.total_days.toString() },
    { label: 'Present', value: att.days_present.toString() },
    { label: 'Absent', value: att.days_absent.toString() },
    { label: 'Late', value: att.days_late.toString() },
    { label: 'Attendance %', value: `${att.percentage.toFixed(1)}%` },
  ];

  drawText(page, boldFont, 'ATTENDANCE SUMMARY', 30, y, 9, COLORS.primary);
  y -= 15;

  const attColW = (width - 60) / attItems.length;
  attItems.forEach((item, i) => {
    const x = 30 + i * attColW;
    page.drawRectangle({ x, y: y - 35, width: attColW - 2, height: 38, color: COLORS.lightGray, borderColor: COLORS.border, borderWidth: 0.5 });
    drawText(page, boldFont, item.value, x + attColW / 2 - 10, y - 15, 12, COLORS.dark);
    drawText(page, regularFont, item.label, x + attColW / 2 - 18, y - 28, 7, COLORS.gray);
  });

  y -= 50;

  // ─── Results Table ────────────────────────────────────────

  drawText(page, boldFont, 'ACADEMIC RESULTS', 30, y, 9, COLORS.primary);
  y -= 15;

  // Table header
  const cols = { subject: 30, scores: 200, final: 370, grade: 420, pos: 470, comment: 500 };
  const colWidths = { subject: 165, scores: 165, final: 45, grade: 45, pos: 25, comment: 75 };

  page.drawRectangle({ x: 30, y: y - 18, width: width - 60, height: 20, color: COLORS.primary });

  const headers = [
    { text: 'Subject', x: cols.subject + 5 },
    { text: 'Class Score / Exam Score', x: cols.scores + 5 },
    { text: 'Total', x: cols.final + 5 },
    { text: 'Grade', x: cols.grade + 5 },
    { text: 'Pos', x: cols.pos + 2 },
  ];

  headers.forEach(h => drawText(page, boldFont, h.text, h.x, y - 12, 7.5, COLORS.white));
  y -= 22;

  // Table rows
  reportCard.results.forEach((result, idx) => {
    const rowColor = idx % 2 === 0 ? COLORS.white : COLORS.lightGray;
    page.drawRectangle({ x: 30, y: y - 16, width: width - 60, height: 18, color: rowColor, borderColor: COLORS.border, borderWidth: 0.3 });

    drawText(page, boldFont, result.subject.name, cols.subject + 5, y - 10, 8, COLORS.dark);

    // Scores breakdown
    const scoreStr = result.scores.map(s => `${s.marks_obtained}/${s.total}`).join(' | ');
    drawText(page, regularFont, scoreStr, cols.scores + 5, y - 10, 7.5, COLORS.gray);

    drawText(page, boldFont, `${result.final_score.toFixed(1)}%`, cols.final + 5, y - 10, 8, COLORS.dark);

    const gradeColor = result.grade.startsWith('A') ? COLORS.success
      : result.grade.startsWith('B') ? COLORS.primary
      : result.grade.startsWith('C') ? COLORS.warning
      : COLORS.danger;

    drawText(page, boldFont, result.grade, cols.grade + 10, y - 10, 9, gradeColor);
    drawText(page, regularFont, result.position?.toString() ?? '-', cols.pos + 5, y - 10, 8, COLORS.dark);

    y -= 18;
  });

  // Table border
  page.drawRectangle({ x: 30, y, width: width - 60, height: (reportCard.results.length * 18) + 22, color: rgb(0,0,0), opacity: 0 });

  y -= 15;

  // ─── GPA & Summary ────────────────────────────────────────

  page.drawRectangle({ x: 30, y: y - 40, width: width - 60, height: 45, color: COLORS.primary, opacity: 0.08, borderColor: COLORS.primary, borderWidth: 0.5 });

  drawText(page, boldFont, `GPA: ${reportCard.gpa.toFixed(2)}`, 45, y - 15, 11, COLORS.primary);
  drawText(page, boldFont, `Overall Average: ${reportCard.total_percentage.toFixed(2)}%`, 150, y - 15, 11, COLORS.dark);
  drawText(page, boldFont, `Position: ${reportCard.overall_position} / ${reportCard.total_students}`, 330, y - 15, 11, COLORS.dark);
  drawText(page, boldFont, `Grade: ${reportCard.overall_grade}`, 470, y - 15, 11, gradeColorFromGrade(reportCard.overall_grade));

  if (reportCard.promotion_status) {
    const promotionLabels: Record<string, string> = { promoted: '✓ PROMOTED', repeated: '↻ REPEATED', transferred: '→ TRANSFERRED' };
    drawText(page, boldFont, promotionLabels[reportCard.promotion_status] ?? '', 45, y - 30, 9, COLORS.success);
  }

  y -= 55;

  // ─── Comments ─────────────────────────────────────────────

  if (reportCard.class_teacher_comment || reportCard.principal_comment) {
    drawText(page, boldFont, 'REMARKS', 30, y, 9, COLORS.primary);
    y -= 15;

    if (reportCard.class_teacher_comment) {
      page.drawRectangle({ x: 30, y: y - 40, width: (width - 70) / 2, height: 45, color: COLORS.lightGray, borderColor: COLORS.border, borderWidth: 0.5 });
      drawText(page, boldFont, "Class Teacher's Remarks:", 40, y - 12, 8, COLORS.gray);
      drawWrappedText(page, regularFont, reportCard.class_teacher_comment, 40, y - 24, (width - 70) / 2 - 20, 7.5, COLORS.dark);
    }

    if (reportCard.principal_comment) {
      const x2 = 40 + (width - 70) / 2;
      page.drawRectangle({ x: x2 - 10, y: y - 40, width: (width - 70) / 2, height: 45, color: COLORS.lightGray, borderColor: COLORS.border, borderWidth: 0.5 });
      drawText(page, boldFont, "Head Teacher's Remarks:", x2, y - 12, 8, COLORS.gray);
      drawWrappedText(page, regularFont, reportCard.principal_comment, x2, y - 24, (width - 70) / 2 - 20, 7.5, COLORS.dark);
    }

    y -= 55;
  }

  // ─── Signature Lines ──────────────────────────────────────

  y -= 10;
  const sigItems = ["Class Teacher's Signature", "Head Teacher's Signature", "Parent/Guardian's Signature"];
  const sigW = (width - 80) / 3;

  sigItems.forEach((label, i) => {
    const x = 30 + i * (sigW + 10);
    page.drawLine({ start: { x, y }, end: { x: x + sigW, y }, thickness: 0.8, color: COLORS.border });
    drawText(page, regularFont, label, x, y - 12, 7, COLORS.gray);
  });

  // ─── Footer ───────────────────────────────────────────────

  y -= 30;
  page.drawRectangle({ x: 0, y: 0, width, height: 30, color: COLORS.primary, opacity: 0.07 });
  drawText(page, regularFont, `Generated by EduCore on ${new Date().toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 30, 10, 7, COLORS.gray);
  drawText(page, regularFont, 'This is an official school document', width - 200, 10, 7, COLORS.gray);

  return doc.save();
}

// ─── Helpers ──────────────────────────────────────────────────

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size: number, color: ReturnType<typeof rgb>) {
  page.drawText(text, { x, y, size, font, color });
}

function drawWrappedText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, maxWidth: number, size: number, color: ReturnType<typeof rgb>) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      line = word;
      currentY -= size + 2;
    } else {
      line = testLine;
    }
  }
  if (line) page.drawText(line, { x, y: currentY, size, font, color });
}

function gradeColorFromGrade(grade: string) {
  if (grade.startsWith('A')) return COLORS.success;
  if (grade.startsWith('B')) return COLORS.primary;
  if (grade.startsWith('C')) return COLORS.warning;
  return COLORS.danger;
}
