import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(
  to: string,
  magicLink: string
): Promise<void> {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@example.com",
    to,
    subject: "Sign in to TimApp",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f172a;">Sign in to TimApp</h2>
        <p>Click the button below to sign in. This link expires in 24 hours.</p>
        <a href="${magicLink}"
           style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Sign In
        </a>
        <p style="color: #64748b; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export { resend };
