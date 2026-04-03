import { Resend } from "resend";
import type { Status, Indicator } from "./types";
import { ACTION_GUIDANCE } from "./traffic-light";

const STATUS_COLORS: Record<Status, string> = {
  GREEN: "#2ecc71",
  AMBER: "#f0c040",
  RED: "#e74c3c",
};

export async function sendStatusChangeEmail(
  previousStatus: Status,
  newStatus: Status,
  indicators: Indicator[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;

  if (!apiKey || !alertEmail) {
    console.warn("Email not configured — skipping alert");
    return;
  }

  const resend = new Resend(apiKey);
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
          <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}"
             style="color: ${color}; text-decoration: underline;">
            View Dashboard →
          </a>
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Paraguay Dashboard <onboarding@resend.dev>",
    to: alertEmail,
    subject: `[${newStatus}] Paraguay Dashboard: ${previousStatus} → ${newStatus}`,
    html,
  });
}

export async function sendFetchErrorEmail(
  errors: Array<{ fetcherName: string; error: string }>
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;

  if (!apiKey || !alertEmail) {
    console.warn("Email not configured — skipping fetch error alert");
    return;
  }

  const resend = new Resend(apiKey);

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
          <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}"
             style="color: #e74c3c; text-decoration: underline;">
            View Dashboard →
          </a>
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Paraguay Dashboard <onboarding@resend.dev>",
    to: alertEmail,
    subject: `[ERROR] Paraguay Dashboard: ${errors.length} fetch failure(s)`,
    html,
  });
}

export async function sendMissedRefreshEmail(
  lastRefresh: string,
  ageMs: number
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;

  if (!apiKey || !alertEmail) {
    console.warn("Email not configured — skipping missed refresh alert");
    return;
  }

  const resend = new Resend(apiKey);
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
          <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}"
             style="color: #e74c3c; text-decoration: underline;">
            View Dashboard →
          </a>
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Paraguay Dashboard <onboarding@resend.dev>",
    to: alertEmail,
    subject: `[STALE] Paraguay Dashboard: No refresh for ${ageHours}h`,
    html,
  });
}
