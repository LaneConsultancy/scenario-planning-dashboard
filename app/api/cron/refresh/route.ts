import { NextRequest, NextResponse } from "next/server";
import { fetchAllIndicators } from "@/app/lib/fetchers";
import { INDICATOR_DEFINITIONS } from "@/app/lib/indicators";
import { evaluateIndicatorStatus, calculateCategoryStatus, calculateOverallStatus } from "@/app/lib/traffic-light";
import { getDashboardState, saveDashboardState, appendHistory } from "@/app/lib/kv";
import { sendStatusChangeEmail } from "@/app/lib/email";
import type { Indicator, DashboardState, Category, FetchResult, GrokAssessment } from "@/app/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const previousState = await getDashboardState();
  const { results, grokAssessments } = await fetchAllIndicators();

  const fetchMap = new Map<string, FetchResult>();
  for (const r of results) fetchMap.set(r.id, r);

  const grokMap = new Map<string, GrokAssessment>();
  for (const g of grokAssessments) grokMap.set(g.id, g);

  const prevMap = new Map<string, Indicator>();
  if (previousState) {
    for (const ind of previousState.indicators) prevMap.set(ind.id, ind);
  }

  const now = new Date().toISOString();
  const indicators: Indicator[] = [];

  for (const def of INDICATOR_DEFINITIONS) {
    const fetch = fetchMap.get(def.id);
    const grok = grokMap.get(def.id);
    const prev = prevMap.get(def.id);

    let currentValue = prev?.currentValue ?? "No data";
    let numericValue: number | null = prev?.numericValue ?? null;
    let aiReasoning: string | null = prev?.aiReasoning ?? null;
    let status = prev?.status ?? ("GREEN" as const);
    let triggered = prev?.triggered ?? false;
    let lastUpdated = prev?.lastUpdated ?? now;

    if (grok) {
      currentValue = grok.currentValue;
      status = grok.status;
      triggered = grok.triggered;
      aiReasoning = grok.reasoning;
      lastUpdated = now;
    }

    if (fetch && fetch.currentValue !== "Data unavailable" && fetch.currentValue !== "Pending Grok AI assessment") {
      currentValue = fetch.currentValue;
      numericValue = fetch.numericValue;
      lastUpdated = now;

      const evaluation = evaluateIndicatorStatus(
        numericValue,
        def.thresholdValue,
        def.thresholdDirection,
        def.warningPercent
      );

      if (evaluation) {
        status = evaluation.status;
        triggered = evaluation.triggered;
      }
    }

    if (!aiReasoning && prev?.aiReasoning) {
      aiReasoning = prev.aiReasoning;
    }

    let triggerDate = prev?.triggerDate ?? null;
    if (triggered && !triggerDate) {
      triggerDate = now;
    } else if (!triggered) {
      triggerDate = null;
    }

    const history = await appendHistory(def.id, { value: numericValue, date: now });

    indicators.push({
      id: def.id,
      category: def.category,
      name: def.name,
      status,
      currentValue,
      numericValue,
      threshold: def.threshold,
      thresholdValue: def.thresholdValue,
      thresholdDirection: def.thresholdDirection,
      source: def.source,
      lastUpdated,
      triggered,
      triggerDate,
      aiReasoning,
      history,
    });
  }

  const categories = {} as DashboardState["categories"];
  const categoryNames: Category[] = ["GEOPOLITICAL", "ENERGY", "AGRICULTURE", "POLITICAL"];
  for (const cat of categoryNames) {
    const catIndicators = indicators.filter((i) => i.category === cat);
    categories[cat] = calculateCategoryStatus(catIndicators);
  }

  const triggeredCount = indicators.filter((i) => i.triggered).length;
  const overall = calculateOverallStatus(triggeredCount);
  const nextRefresh = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

  const state: DashboardState = {
    overall,
    triggeredCount,
    categories,
    indicators,
    lastRefresh: now,
    nextRefresh,
  };

  await saveDashboardState(state);

  if (previousState && previousState.overall !== overall) {
    await sendStatusChangeEmail(previousState.overall, overall, indicators);
  }

  return NextResponse.json({
    success: true,
    overall,
    triggeredCount,
    indicatorCount: indicators.length,
  });
}
