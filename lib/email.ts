import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Rabet <no-reply@rabet.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Email Verification ──────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = `${APP_URL}/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your Rabet email address",
    html: `
      <h2>Welcome to Rabet!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;">
        Verify Email
      </a>
      <p>Or copy this link: ${link}</p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

// ─── Admin Welcome ───────────────────────────────────────

export async function sendAdminWelcomeEmail(
  to: string,
  fullName: string,
  tempPassword: string,
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "You've been added as a Rabet Administrator",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Welcome to the Rabet Admin Team</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>You have been granted administrator access to the Rabet platform by a fellow admin.</p>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Email:</strong> ${to}</p>
          <p style="margin:0"><strong>Temporary Password:</strong> <code style="background:#ede9fe;padding:2px 6px;border-radius:4px;font-size:14px">${tempPassword}</code></p>
        </div>
        <p style="color:#dc2626;font-size:13px">⚠️ Please log in and change your password immediately.</p>
        <a href="${APP_URL}/login" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;margin:8px 0">
          Go to Admin Dashboard
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">If you were not expecting this email, please ignore it or contact support.</p>
      </div>
    `,
  });
}

// ─── Password Reset ──────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = `${APP_URL}/auth/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Rabet password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;">
        Reset Password
      </a>
      <p>Or copy this link: ${link}</p>
      <p>This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
    `,
  });
}
