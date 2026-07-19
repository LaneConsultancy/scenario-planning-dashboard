import { Resend } from "resend";
import type { Status, Indicator } from "./types";
import { ACTION_GUIDANCE } from "./traffic-light";

const STATUS_COLORS: Record<Status, string> = {
  GREEN: "#2ecc71",
  AMBER: "#f0c040",
  RED: "#e74c3c",
};

function dashboardUrl(): string {
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
}

/**
 * Shared send path for all alert emails.
 *
 * The Resend SDK does NOT throw on API errors — it resolves with
 * { data, error }. Ignoring that error field means rejected sends
 * (e.g. the sandbox sender onboarding@resend.dev refusing to deliver
 * to anyone but the Resend account owner) fail silently. We check it
 * explicitly so every failed alert at least reaches the logs.
 */
async function sendAlertEmail(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;

  if (!apiKey || !alertEmail) {
    console.error(`[Email] Not configured (RESEND_API_KEY/ALERT_EMAIL missing) — alert NOT sent: ${subject}`);
    return;
  }

  // onboarding@resend.dev is Resend's sandbox sender: it only delivers to the
  // Resend account owner's own address. Set ALERT_FROM_EMAIL to an address on
  // a domain verified in Resend to alert any other recipient.
  const from = process.env.ALERT_FROM_EMAIL ?? "Paraguay Dashboard <onboarding@resend.dev>";
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({ from, to: alertEmail, subject, html });
    if (error) {
      console.error(`[Email] Resend rejected alert "${subject}":`, JSON.stringify(error));
    }
  } catch (error) {
    console.error(`[Email] Failed to send alert "${subject}":`, error instanceof Error ? error.message : error);
  }
}

export async function sendStatusChangeEmail(
  previousStatus: Status,
  newStatus: Status,
  indicators: Indicator[]
): Promise<void> {
  const triggered = indicators.filter((i) => i.triggered);
  const color = STATUS_COLORS[newStatus];

  const triggeredList = triggered
    .map((i) => `<li><strong>${i.name}</strong>: ${i.currentValue}</li>`)
    .join("\n");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Status Changed: ${previousStatus} → ${newStatus}</h1>
      </div>
      <div style="background: #1a1a2e; color: #e0e0e0; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: ${color}; font-weight: bold;">
          ${ACTION_GUIDANCE[newStatus]}
        </p>
        <h3 style="color: #999;">Triggered Indicators (${triggered.length}/${indicators.length})</h3>
        <ul style="color: #ccc;">${triggeredList || "<li>None</li>"}</ul>
        <p style="margin-top: 20px;">
          <a href="${dashboardUrl()}"
             style="color: ${color}; text-decoration: underline;">
            View Dashboard →
          </a>
        </p>
      </div>
    </div>
  `;

  await sendAlertEmail(`[${newStatus}] Paraguay Dashboard: ${previousStatus} → ${newStatus}`, html);
}

export async function sendFetchErrorEmail(
  errors: Array<{ fetcherName: string; error: string }>
): Promise<void> {
  const errorList = errors
    .map((e) => `<li><strong>${e.fetcherName}</strong>: ${e.error}</li>`)
    .join("\n");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #e74c3c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Data Fetch Failures</h1>
      </div>
      <div style="background: #1a1a2e; color: #e0e0e0; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="color: #e74c3c; font-weight: bold;">
          ${errors.length} data source(s) failed during the last refresh. These indicators may have stale data.
        </p>
        <ul style="color: #ccc;">${errorList}</ul>
        <p style="color: #999; font-size: 14px; margin-top: 16px;">
          Check API keys and service availability. Failed indicators retain their previous values but may be outdated.
        </p>
        <p style="margin-top: 20px;">
          <a href="${dashboardUrl()}"
             style="color: #e74c3c; text-decoration: underline;">
            View Dashboard →
          </a>
        </p>
      </div>
    </div>
  `;

  await sendAlertEmail(`[ERROR] Paraguay Dashboard: ${errors.length} fetch failure(s)`, html);
}

export async function sendMissedRefreshEmail(
  lastRefresh: string,
  ageMs: number
): Promise<void> {
  const ageHours = Math.round(ageMs / 3600000);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #e74c3c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Missed Dashboard Refresh</h1>
      </div>
      <div style="background: #1a1a2e; color: #e0e0e0; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="color: #e74c3c; font-weight: bold;">
          The dashboard has not been refreshed for ${ageHours} hours.
        </p>
        <p style="color: #ccc;">
          Last successful refresh: ${new Date(lastRefresh).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
        </p>
        <p style="color: #999; font-size: 14px; margin-top: 16px;">
          Check that the Cloudflare cron worker and Vercel cron are both running.
          You can trigger a manual refresh at the /api/cron/refresh endpoint.
        </p>
        <p style="margin-top: 20px;">
          <a href="${dashboardUrl()}"
             style="color: #e74c3c; text-decoration: underline;">
            View Dashboard →
          </a>
        </p>
      </div>
    </div>
  `;

  await sendAlertEmail(`[STALE] Paraguay Dashboard: No refresh for ${ageHours}h`, html);
}
