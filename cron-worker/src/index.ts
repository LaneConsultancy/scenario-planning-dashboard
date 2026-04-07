interface Env {
  DASHBOARD_URL: string;
  CRON_SECRET: string;
  TRIGGER_SECRET: string;
}

async function refreshDashboard(env: Env): Promise<{ status: number; body: string }> {
  const url = `${env.DASHBOARD_URL}/api/cron/refresh`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      "Content-Type": "application/json",
    },
  });

  const body = await res.text();
  console.log(`Dashboard refresh: ${res.status} — ${body}`);

  if (!res.ok) {
    throw new Error(`Dashboard returned ${res.status}: ${body}`);
  }

  return { status: res.status, body };
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshDashboard(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/trigger") {
      if (request.headers.get("X-Trigger-Secret") !== env.TRIGGER_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const result = await refreshDashboard(env);
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }, null, 2), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Dashboard cron worker is running.", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
