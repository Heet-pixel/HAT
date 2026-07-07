// src/utils/mailer.js — Gmail OTP mailer using nodemailer
import nodemailer from 'nodemailer';

let _transporter = null;

// Google's "Create App Password" page displays the password grouped in 4
// characters for readability (e.g. "rojj lciq uenk wldh") — but that's not
// the literal password to use, it's just how it's shown on screen. If it's
// copy-pasted straight into .env with the spaces intact, Gmail's SMTP server
// rejects it with "535-5.7.8 Username and Password not accepted", which
// looks like a wrong password even though it's really just formatting.
// Also defends against a stray trailing newline/quotes from how some editors
// save .env files.
function sanitizeEnvValue(v) {
  if (!v) return v;
  return String(v).trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '');
}

function getTransporter() {
  if (_transporter) return _transporter;
  const user = sanitizeEnvValue(process.env.GMAIL_USER);
  const pass = sanitizeEnvValue(process.env.GMAIL_APP_PASSWORD);
  if (!user || !pass) return null; // fallback to console
  if (pass.length !== 16) {
    console.warn(
      `⚠️  GMAIL_APP_PASSWORD is ${pass.length} characters after removing spaces — a Gmail ` +
      `App Password should be exactly 16. Double-check it was copied correctly from ` +
      `myaccount.google.com/apppasswords (2-Step Verification must be ON to generate one).`
    );
  }
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
  return _transporter;
}

export async function sendOtpEmail(to, otp, purpose = 'login') {
  const subjects = {
    first_login:    'SAL Portal — Activate Your Account',
    reset_password: 'SAL Portal — Reset Your Password',
    login:          'SAL Portal — Your OTP Code'
  };
  const messages = {
    first_login:    'You are activating your SAL Portal account.',
    reset_password: 'You requested a password reset.',
    login:          'Use this OTP to log in.'
  };

  const subject = subjects[purpose] || subjects.login;
  const message = messages[purpose] || messages.login;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#161b22;border:1px solid #30363d;border-radius:16px;overflow:hidden;max-width:480px;width:100%">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#00d4aa,#0099cc);padding:32px;text-align:center">
          <div style="width:56px;height:56px;background:#0d1117;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#00d4aa;margin-bottom:12px">S</div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#0d1117;letter-spacing:-0.5px">SAL Portal</h1>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(13,17,23,0.7)">Student Administration & Learning</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 8px;font-size:13px;color:#8b949e;text-transform:uppercase;letter-spacing:0.05em;font-weight:500">Your One-Time Password</p>
          <p style="margin:0 0 28px;font-size:14px;color:#e6edf3;line-height:1.6">${message} Use the OTP below — valid for <strong style="color:#00d4aa">5 minutes</strong>.</p>
          <!-- OTP Box -->
          <div style="background:#0d1117;border:2px solid #00d4aa;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
            <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#00d4aa;font-family:'Courier New',monospace">${otp}</div>
            <p style="margin:10px 0 0;font-size:12px;color:#8b949e">Do not share this OTP with anyone</p>
          </div>
          <div style="background:#1c2128;border:1px solid #30363d;border-radius:8px;padding:14px 18px">
            <p style="margin:0;font-size:12px;color:#8b949e;line-height:1.6">
              ⚠️ If you did not request this OTP, please ignore this email. Your account is safe.
            </p>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:0 40px 28px;text-align:center">
          <p style="margin:0;font-size:11px;color:#484f58">© SAL Portal · Automated message — do not reply</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = getTransporter();

  if (!transporter) {
    // No Gmail config — log to console for dev
    console.log(`\n📧 OTP for ${to}: \x1b[33m${otp}\x1b[0m (purpose: ${purpose})\n`);
    return { sent: false, fallback: true };
  }

  try {
    await transporter.sendMail({
      from: `"SAL Portal" <${sanitizeEnvValue(process.env.GMAIL_USER)}>`,
      to,
      subject,
      html
    });
    console.log(`📧 OTP email sent to ${to}`);
    return { sent: true };
  } catch (err) {
    // Never let a raw SMTP error (e.g. Gmail's "535-5.7.8 ...") escape to the
    // end user — that's an internal delivery problem, not something wrong
    // with what they typed. Log the real error server-side for the admin to
    // fix, and degrade gracefully the same way as "no Gmail config" above.
    console.error(`✖ Failed to send OTP email to ${to}:`, err.message);
    console.log(`\n📧 OTP for ${to}: \x1b[33m${otp}\x1b[0m (purpose: ${purpose}) — email delivery failed, showing here as a fallback\n`);
    return { sent: false, fallback: true, error: err.message };
  }
}
