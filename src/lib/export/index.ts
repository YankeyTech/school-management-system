import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  key: keyof T | string;
  width?: number;
  formatter?: (value: any, row: T) => string | number;
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = 'Sheet1'
): void {
  const worksheetData = [
    // Header row
    columns.map((col) => col.header),
    // Data rows
    ...data.map((row) =>
      columns.map((col) => {
        const keys = (col.key as string).split('.');
        let value = row;
        for (const k of keys) {
          value = value?.[k];
        }
        return col.formatter ? col.formatter(value, row) : (value ?? '');
      })
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Column widths
  ws['!cols'] = columns.map((col) => ({ wch: col.width ?? 15 }));

  // Style header row (basic)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2563EB' } },
      alignment: { horizontal: 'center' },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const rows = [
    columns.map((col) => col.header).join(','),
    ...data.map((row) =>
      columns
        .map((col) => {
          const keys = (col.key as string).split('.');
          let value = row;
          for (const k of keys) value = value?.[k];
          const formatted = col.formatter ? col.formatter(value, row) : (value ?? '');
          // Escape commas and quotes
          const str = String(formatted);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Pre-built export configs
export const STUDENT_EXPORT_COLUMNS: ExportColumn<any>[] = [
  { header: 'Student ID', key: 'student_id', width: 15 },
  { header: 'First Name', key: 'first_name', width: 15 },
  { header: 'Last Name', key: 'last_name', width: 15 },
  { header: 'Admission No.', key: 'admission_number', width: 18 },
  { header: 'Class', key: 'classes.name', width: 12 },
  { header: 'Gender', key: 'gender', width: 10, formatter: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) },
  { header: 'Date of Birth', key: 'date_of_birth', width: 14 },
  { header: 'Status', key: 'is_active', width: 10, formatter: (v) => v ? 'Active' : 'Inactive' },
  { header: 'Boarding', key: 'is_boarding', width: 10, formatter: (v) => v ? 'Yes' : 'No' },
  { header: 'Guardian Name', key: 'guardian_name', width: 20 },
  { header: 'Guardian Phone', key: 'guardian_phone', width: 16 },
  { header: 'Address', key: 'address', width: 30 },
  { header: 'Admission Date', key: 'admission_date', width: 14 },
];

export const ATTENDANCE_EXPORT_COLUMNS: ExportColumn<any>[] = [
  { header: 'Student ID', key: 'student_id', width: 15 },
  { header: 'Student Name', key: 'student_name', width: 25 },
  { header: 'Class', key: 'class_name', width: 12 },
  { header: 'Total Days', key: 'total_days', width: 12 },
  { header: 'Present', key: 'days_present', width: 10 },
  { header: 'Absent', key: 'days_absent', width: 10 },
  { header: 'Late', key: 'days_late', width: 10 },
  { header: 'Attendance %', key: 'attendance_percentage', width: 15, formatter: (v) => `${v?.toFixed(1)}%` },
];

export const FINANCE_EXPORT_COLUMNS: ExportColumn<any>[] = [
  { header: 'Invoice No.', key: 'invoice_number', width: 20 },
  { header: 'Student Name', key: 'student_name', width: 25 },
  { header: 'Student ID', key: 'student_id', width: 15 },
  { header: 'Class', key: 'class_name', width: 12 },
  { header: 'Total Amount', key: 'total_amount', width: 15, formatter: (v) => `₵${v?.toFixed(2)}` },
  { header: 'Amount Paid', key: 'amount_paid', width: 15, formatter: (v) => `₵${v?.toFixed(2)}` },
  { header: 'Balance', key: 'balance', width: 15, formatter: (v) => `₵${v?.toFixed(2)}` },
  { header: 'Status', key: 'status', width: 12, formatter: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) },
  { header: 'Due Date', key: 'due_date', width: 14 },
];

export const EXAM_RESULTS_EXPORT_COLUMNS: ExportColumn<any>[] = [
  { header: 'Student ID', key: 'student_id', width: 15 },
  { header: 'Student Name', key: 'student_name', width: 25 },
  { header: 'Subject', key: 'subject_name', width: 20 },
  { header: 'Marks', key: 'marks_obtained', width: 10 },
  { header: 'Total', key: 'total_marks', width: 10 },
  { header: 'Percentage', key: 'percentage', width: 12, formatter: (v) => `${v?.toFixed(1)}%` },
  { header: 'Grade', key: 'grade', width: 8 },
  { header: 'Position', key: 'position', width: 10 },
  { header: 'Absent', key: 'is_absent', width: 10, formatter: (v) => v ? 'Yes' : 'No' },
];
