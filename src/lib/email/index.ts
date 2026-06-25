import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? 'EduCore <noreply@educore.app>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(opts: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Skipped — RESEND_API_KEY not configured');
    console.log('[Email] Would send:', { to: opts.to, subject: opts.subject });
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });

    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[Email] Failed to send:', err);
    return { success: false, error: err.message };
  }
}

// ─── Email Templates ──────────────────────────────────────────

export function getWelcomeEmailHTML(opts: {
  name: string;
  role: string;
  schoolName: string;
  loginUrl: string;
  tempPassword?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 36px 40px; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 36px 40px; }
    .body p { color: #374151; line-height: 1.6; font-size: 15px; }
    .btn { display: inline-block; background: #2563EB; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .info-box { background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
    .info-box p { margin: 4px 0; font-size: 13px; color: #64748b; }
    .info-box strong { color: #1e293b; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Welcome to EduCore</h1>
      <p>${opts.schoolName}</p>
    </div>
    <div class="body">
      <p>Hello <strong>${opts.name}</strong>,</p>
      <p>Your <strong>${opts.role}</strong> account has been created on EduCore for <strong>${opts.schoolName}</strong>. You can now log in and access your dashboard.</p>
      
      <div class="info-box">
        <p><strong>Your Login Details:</strong></p>
        <p>🌐 Portal: <strong>${opts.loginUrl}</strong></p>
        ${opts.tempPassword ? `<p>🔑 Temporary Password: <strong>${opts.tempPassword}</strong></p>` : ''}
        <p>⚠️ Please change your password after your first login.</p>
      </div>

      <a href="${opts.loginUrl}" class="btn">Access Your Account →</a>

      <p>If you have any questions, contact your school administrator.</p>
      <p>Best regards,<br><strong>EduCore Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EduCore · School Management System</p>
    </div>
  </div>
</body>
</html>`;
}

export function getFeeReminderEmailHTML(opts: {
  studentName: string;
  guardianName: string;
  schoolName: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  paymentUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #f59e0b; padding: 28px 40px; }
    .header h1 { color: white; margin: 0; font-size: 20px; }
    .body { padding: 32px 40px; }
    .body p { color: #374151; line-height: 1.6; font-size: 15px; }
    .amount-card { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 16px 0; }
    .amount-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #78350f; }
    .amount-row.total { font-weight: 700; font-size: 16px; border-top: 1px solid #f59e0b; padding-top: 10px; margin-top: 6px; }
    .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Fee Payment Reminder</h1>
    </div>
    <div class="body">
      <p>Dear <strong>${opts.guardianName}</strong>,</p>
      <p>This is a friendly reminder that school fees for <strong>${opts.studentName}</strong> at <strong>${opts.schoolName}</strong> are due.</p>
      
      <div class="amount-card">
        <div class="amount-row"><span>Invoice #${opts.invoiceNumber}</span></div>
        <div class="amount-row"><span>Total Fees</span><span>₵${opts.amount.toFixed(2)}</span></div>
        <div class="amount-row"><span>Amount Paid</span><span>₵${opts.amountPaid.toFixed(2)}</span></div>
        <div class="amount-row total"><span>Balance Due</span><span>₵${opts.balance.toFixed(2)}</span></div>
        <div class="amount-row"><span>Due Date</span><span><strong>${opts.dueDate}</strong></span></div>
      </div>

      <p>Please make payment before the due date to avoid late fees. You can pay via:</p>
      <ul>
        <li>Cash at the school bursar's office</li>
        <li>MTN MoMo / Telecel Cash / AirtelTigo</li>
        <li>Bank transfer</li>
      </ul>

      ${opts.paymentUrl ? `<a href="${opts.paymentUrl}" class="btn">View Invoice →</a>` : ''}

      <p>Thank you for your continued support of your child's education.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${opts.schoolName} · Powered by EduCore</p>
    </div>
  </div>
</body>
</html>`;
}

export function getAttendanceAlertEmailHTML(opts: {
  guardianName: string;
  studentName: string;
  schoolName: string;
  date: string;
  status: string;
  className: string;
}): string {
  const isAbsent = opts.status === 'absent';
  const color = isAbsent ? '#dc2626' : '#f59e0b';
  const icon = isAbsent ? '❌' : '⏰';

  return `
<!DOCTYPE html>
<html>
<body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;">
    <div style="background:${color};padding:24px 36px;">
      <h1 style="color:white;margin:0;font-size:18px;">${icon} Attendance Alert — ${opts.schoolName}</h1>
    </div>
    <div style="padding:28px 36px;">
      <p style="color:#374151;font-size:15px;">Dear <strong>${opts.guardianName}</strong>,</p>
      <p style="color:#374151;font-size:15px;">
        This is to inform you that <strong>${opts.studentName}</strong> (${opts.className}) was marked 
        <strong style="color:${color};">${opts.status.toUpperCase()}</strong> on <strong>${opts.date}</strong>.
      </p>
      <p style="color:#374151;font-size:15px;">If this is an error or your ward was excused, please contact the school immediately.</p>
      <p style="color:#374151;font-size:15px;">Thank you.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 36px;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} ${opts.schoolName} · Powered by EduCore</p>
    </div>
  </div>
</body>
</html>`;
}

// Convenience wrappers
export async function sendWelcomeEmail(to: string, opts: Parameters<typeof getWelcomeEmailHTML>[0]) {
  return sendEmail({
    to,
    subject: `Welcome to EduCore — ${opts.schoolName}`,
    html: getWelcomeEmailHTML(opts),
  });
}

export async function sendFeeReminder(to: string, opts: Parameters<typeof getFeeReminderEmailHTML>[0]) {
  return sendEmail({
    to,
    subject: `Fee Payment Reminder — ${opts.invoiceNumber}`,
    html: getFeeReminderEmailHTML(opts),
  });
}

export async function sendAttendanceAlert(to: string, opts: Parameters<typeof getAttendanceAlertEmailHTML>[0]) {
  return sendEmail({
    to,
    subject: `Attendance Alert — ${opts.studentName}`,
    html: getAttendanceAlertEmailHTML(opts),
  });
}
