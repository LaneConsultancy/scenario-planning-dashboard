import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("resend", () => {
  const mockSend = vi.fn().mockRejectedValue(new Error("Resend API down"));
  class Resend {
    emails = { send: mockSend };
  }
  return { Resend };
});

describe("email resilience", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("ALERT_EMAIL", "test@example.com");
  });

  it("sendStatusChangeEmail does not throw when Resend fails", async () => {
    const { sendStatusChangeEmail } = await import("@/app/lib/email");
    await expect(
      sendStatusChangeEmail("RED", "GREEN", [])
    ).resolves.not.toThrow();
  });

  it("sendFetchErrorEmail does not throw when Resend fails", async () => {
    const { sendFetchErrorEmail } = await import("@/app/lib/email");
    await expect(
      sendFetchErrorEmail([{ fetcherName: "test", error: "fail" }])
    ).resolves.not.toThrow();
  });

  it("sendMissedRefreshEmail does not throw when Resend fails", async () => {
    const { sendMissedRefreshEmail } = await import("@/app/lib/email");
    await expect(
      sendMissedRefreshEmail("2026-04-06T08:00:00.000Z", 90000000)
    ).resolves.not.toThrow();
  });
});
