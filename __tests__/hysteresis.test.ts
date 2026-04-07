import { describe, it, expect } from "vitest";
import {
  compareSeverity,
  applyHysteresis,
} from "@/app/lib/hysteresis";
import type { Status } from "@/app/lib/types";

describe("compareSeverity", () => {
  it("returns 0 for equal statuses", () => {
    expect(compareSeverity("RED", "RED")).toBe(0);
    expect(compareSeverity("GREEN", "GREEN")).toBe(0);
  });

  it("returns positive when proposed is higher severity", () => {
    expect(compareSeverity("RED", "GREEN")).toBeGreaterThan(0);
    expect(compareSeverity("RED", "AMBER")).toBeGreaterThan(0);
    expect(compareSeverity("AMBER", "GREEN")).toBeGreaterThan(0);
  });

  it("returns negative when proposed is lower severity (downgrade)", () => {
    expect(compareSeverity("GREEN", "RED")).toBeLessThan(0);
    expect(compareSeverity("AMBER", "RED")).toBeLessThan(0);
    expect(compareSeverity("GREEN", "AMBER")).toBeLessThan(0);
  });
});

describe("applyHysteresis", () => {
  it("applies escalation immediately and resets streak", () => {
    const result = applyHysteresis({
      proposedStatus: "RED",
      proposedTriggered: true,
      currentStatus: "GREEN",
      currentTriggered: false,
      downgradeStreak: 0,
    });
    expect(result).toEqual({
      effectiveStatus: "RED",
      effectiveTriggered: true,
      downgradeStreak: 0,
      applied: true,
    });
  });

  it("applies same-severity assessment and resets streak", () => {
    const result = applyHysteresis({
      proposedStatus: "RED",
      proposedTriggered: true,
      currentStatus: "RED",
      currentTriggered: true,
      downgradeStreak: 2,
    });
    expect(result).toEqual({
      effectiveStatus: "RED",
      effectiveTriggered: true,
      downgradeStreak: 0,
      applied: true,
    });
  });

  it("holds first downgrade attempt and increments streak to 1", () => {
    const result = applyHysteresis({
      proposedStatus: "GREEN",
      proposedTriggered: false,
      currentStatus: "RED",
      currentTriggered: true,
      downgradeStreak: 0,
    });
    expect(result).toEqual({
      effectiveStatus: "RED",
      effectiveTriggered: true,
      downgradeStreak: 1,
      applied: false,
    });
  });

  it("holds second downgrade attempt and increments streak to 2", () => {
    const result = applyHysteresis({
      proposedStatus: "GREEN",
      proposedTriggered: false,
      currentStatus: "RED",
      currentTriggered: true,
      downgradeStreak: 1,
    });
    expect(result).toEqual({
      effectiveStatus: "RED",
      effectiveTriggered: true,
      downgradeStreak: 2,
      applied: false,
    });
  });

  it("applies downgrade on third consecutive attempt (streak reaches 3)", () => {
    const result = applyHysteresis({
      proposedStatus: "GREEN",
      proposedTriggered: false,
      currentStatus: "RED",
      currentTriggered: true,
      downgradeStreak: 2,
    });
    expect(result).toEqual({
      effectiveStatus: "GREEN",
      effectiveTriggered: false,
      downgradeStreak: 0,
      applied: true,
    });
  });

  it("resets streak when escalation interrupts a downgrade sequence", () => {
    const result = applyHysteresis({
      proposedStatus: "RED",
      proposedTriggered: true,
      currentStatus: "RED",
      currentTriggered: true,
      downgradeStreak: 2,
    });
    expect(result).toEqual({
      effectiveStatus: "RED",
      effectiveTriggered: true,
      downgradeStreak: 0,
      applied: true,
    });
  });

  it("handles AMBER to GREEN downgrade (non-triggered severity change)", () => {
    const result = applyHysteresis({
      proposedStatus: "GREEN",
      proposedTriggered: false,
      currentStatus: "AMBER",
      currentTriggered: false,
      downgradeStreak: 2,
    });
    expect(result).toEqual({
      effectiveStatus: "GREEN",
      effectiveTriggered: false,
      downgradeStreak: 0,
      applied: true,
    });
  });

  it("holds AMBER to GREEN on first attempt", () => {
    const result = applyHysteresis({
      proposedStatus: "GREEN",
      proposedTriggered: false,
      currentStatus: "AMBER",
      currentTriggered: false,
      downgradeStreak: 0,
    });
    expect(result).toEqual({
      effectiveStatus: "AMBER",
      effectiveTriggered: false,
      downgradeStreak: 1,
      applied: false,
    });
  });
});
