import { describe, expect, it } from "vitest";
import {
  AUTH_COOKIE_NAME,
  createDashboardSessionValue,
  isAuthorizedCronRequest,
  verifyDashboardSessionValue,
} from "@/app/lib/auth";

describe("dashboard auth cookies", () => {
  it("creates signed cookie values that can be verified later", () => {
    const issuedAt = new Date("2026-03-27T12:00:00Z");
    const value = createDashboardSessionValue("test-secret", issuedAt, 60 * 60);

    expect(AUTH_COOKIE_NAME).toBe("dashboard-auth");
    expect(
      verifyDashboardSessionValue(
        value,
        "test-secret",
        new Date("2026-03-27T12:30:00Z")
      )
    ).toBe(true);
  });

  it("rejects tampered cookie values", () => {
    const value = createDashboardSessionValue(
      "test-secret",
      new Date("2026-03-27T12:00:00Z"),
      60 * 60
    );
    const [payload, signature] = value.split(".");
    const tamperedPayload = `${payload.slice(0, -1)}x`;

    expect(
      verifyDashboardSessionValue(
        `${tamperedPayload}.${signature}`,
        "test-secret",
        new Date("2026-03-27T12:30:00Z")
      )
    ).toBe(false);
  });

  it("rejects expired cookie values", () => {
    const value = createDashboardSessionValue(
      "test-secret",
      new Date("2026-03-27T12:00:00Z"),
      60 * 60
    );

    expect(
      verifyDashboardSessionValue(
        value,
        "test-secret",
        new Date("2026-03-27T13:01:00Z")
      )
    ).toBe(false);
  });
});

describe("cron authorization", () => {
  it("fails closed when the configured secret is missing", () => {
    expect(isAuthorizedCronRequest("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorizedCronRequest("Bearer anything", "")).toBe(false);
  });

  it("only accepts the exact configured bearer token", () => {
    expect(isAuthorizedCronRequest("Bearer expected-secret", "expected-secret")).toBe(
      true
    );
    expect(isAuthorizedCronRequest("Bearer wrong-secret", "expected-secret")).toBe(
      false
    );
    expect(isAuthorizedCronRequest(null, "expected-secret")).toBe(false);
  });
});
