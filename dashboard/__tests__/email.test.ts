import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => {
  class Resend {
    emails = { send: mockSend };
  }
  return { Resend };
});

describe("email resilience", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("ALERT_EMAIL", "test@example.com");
    mockSend.mockReset();
    mockSend.mockRejectedValue(new Error("Resend API down"));
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

  it("logs the Resend error field — the SDK resolves instead of throwing on API errors", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { statusCode: 403, message: "You can only send to your own address" },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { sendFetchErrorEmail } = await import("@/app/lib/email");
    await sendFetchErrorEmail([{ fetcherName: "agsi", error: "boom" }]);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Resend rejected"),
      expect.stringContaining("only send to your own address")
    );
    errorSpy.mockRestore();
  });

  it("uses ALERT_FROM_EMAIL as the sender when set", async () => {
    vi.stubEnv("ALERT_FROM_EMAIL", "Alerts <alerts@laneconsultancy.com>");
    mockSend.mockResolvedValue({ data: { id: "ok" }, error: null });

    const { sendFetchErrorEmail } = await import("@/app/lib/email");
    await sendFetchErrorEmail([{ fetcherName: "agsi", error: "boom" }]);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: "Alerts <alerts@laneconsultancy.com>" })
    );
  });
});
