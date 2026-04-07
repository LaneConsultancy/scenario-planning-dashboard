import { describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "@/app/lib/auth";

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
