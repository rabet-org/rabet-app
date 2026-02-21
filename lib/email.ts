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
