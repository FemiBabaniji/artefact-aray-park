import { Resend } from "resend";

// Lazy-initialize Resend client to avoid errors when API key is not set
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export type EmailTemplate =
  | "invite"
  | "accepted"
  | "rejected"
  | "feedback"
  | "stage_advanced";

type EmailData = {
  to: string;
  memberName: string;
  communityName: string;
  programName?: string;
  portalUrl?: string;
  feedbackText?: string;
  sectionName?: string;
  mentorName?: string;
  newStage?: string;
};

const TEMPLATES: Record<EmailTemplate, (data: EmailData) => { subject: string; html: string }> = {
  invite: (data) => ({
    subject: `You're invited to join ${data.communityName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">
          ${data.communityName}
        </p>
        <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 16px;">
          You're invited
        </h1>
        <p style="color: #333; line-height: 1.6; margin-bottom: 24px;">
          Hi ${data.memberName},<br><br>
          You've been invited to join <strong>${data.programName || data.communityName}</strong>.
          Click below to create your artefact and begin your journey.
        </p>
        <a href="${data.portalUrl}"
           style="display: inline-block; background: #111; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; font-weight: 500;">
          Claim your artefact →
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          This link expires in 7 days.
        </p>
      </div>
    `,
  }),

  accepted: (data) => ({
    subject: `Welcome to ${data.communityName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">
          ${data.communityName}
        </p>
        <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 16px;">
          You've been accepted
        </h1>
        <p style="color: #333; line-height: 1.6; margin-bottom: 24px;">
          Hi ${data.memberName},<br><br>
          Congratulations! Your application to <strong>${data.programName || data.communityName}</strong> has been accepted.
          Your artefact is ready — click below to access your portal and begin.
        </p>
        <a href="${data.portalUrl}"
           style="display: inline-block; background: #22c55e; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; font-weight: 500;">
          Enter your portal →
        </a>
      </div>
    `,
  }),

  rejected: (data) => ({
    subject: `Update on your ${data.communityName} application`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">
          ${data.communityName}
        </p>
        <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 16px;">
          Application Update
        </h1>
        <p style="color: #333; line-height: 1.6; margin-bottom: 24px;">
          Hi ${data.memberName},<br><br>
          Thank you for your interest in <strong>${data.programName || data.communityName}</strong>.
          After careful review, we're unable to offer you a spot in this cohort.
          We encourage you to apply again in the future.
        </p>
        <p style="color: #666; font-size: 14px;">
          — The ${data.communityName} Team
        </p>
      </div>
    `,
  }),

  feedback: (data) => ({
    subject: `New feedback on your ${data.sectionName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">
          ${data.communityName}
        </p>
        <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 16px;">
          You have new feedback
        </h1>
        <p style="color: #333; line-height: 1.6; margin-bottom: 16px;">
          Hi ${data.memberName},<br><br>
          ${data.mentorName || "Your mentor"} left feedback on your <strong>${data.sectionName}</strong>:
        </p>
        <blockquote style="border-left: 3px solid #e5e5e5; padding-left: 16px; margin: 16px 0; color: #555; font-style: italic;">
          ${data.feedbackText}
        </blockquote>
        <a href="${data.portalUrl}"
           style="display: inline-block; background: #111; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 16px;">
          View in portal →
        </a>
      </div>
    `,
  }),

  stage_advanced: (data) => ({
    subject: `You've advanced to ${data.newStage}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">
          ${data.communityName}
        </p>
        <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 16px;">
          Congratulations!
        </h1>
        <p style="color: #333; line-height: 1.6; margin-bottom: 24px;">
          Hi ${data.memberName},<br><br>
          You've advanced to the <strong>${data.newStage}</strong> stage in ${data.programName || data.communityName}.
          Keep up the great work!
        </p>
        <a href="${data.portalUrl}"
           style="display: inline-block; background: #22c55e; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; font-weight: 500;">
          Continue in portal →
        </a>
      </div>
    `,
  }),
};

export async function sendEmail(
  template: EmailTemplate,
  data: EmailData,
  from?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();

  // Skip in development if no API key
  if (!client) {
    console.log(`[EMAIL] Would send "${template}" to ${data.to}`);
    return { success: true };
  }

  const { subject, html } = TEMPLATES[template](data);

  try {
    const { error } = await client.emails.send({
      from: from || `${data.communityName} <noreply@artefact.so>`,
      to: data.to,
      subject,
      html,
    });

    if (error) {
      console.error("[EMAIL] Failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[EMAIL] Error:", err);
    return { success: false, error: String(err) };
  }
}

// Bulk send for invites
export async function sendBulkInvites(
  invites: Array<{ email: string; name: string }>,
  communityName: string,
  programName: string,
  baseUrl: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const invite of invites) {
    const result = await sendEmail("invite", {
      to: invite.email,
      memberName: invite.name,
      communityName,
      programName,
      portalUrl: `${baseUrl}/apply?invite=true&email=${encodeURIComponent(invite.email)}`,
    });

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${invite.email}: ${result.error}`);
    }
  }

  return results;
}
