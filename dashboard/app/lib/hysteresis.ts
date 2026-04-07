import type { Status } from "./types";

const SEVERITY: Record<Status, number> = { GREEN: 0, AMBER: 1, RED: 2 };

/**
 * Compare two statuses by severity.
 * Returns positive if proposed > current (escalation),
 * negative if proposed < current (downgrade), 0 if equal.
 */
export function compareSeverity(proposed: Status, current: Status): number {
  return SEVERITY[proposed] - SEVERITY[current];
}

export interface HysteresisInput {
  proposedStatus: Status;
  proposedTriggered: boolean;
  currentStatus: Status;
  currentTriggered: boolean;
  downgradeStreak: number;
}

export interface HysteresisResult {
  effectiveStatus: Status;
  effectiveTriggered: boolean;
  downgradeStreak: number;
  /** true = Grok's assessment was applied; false = held by hysteresis */
  applied: boolean;
}

const DOWNGRADE_THRESHOLD = 3;

/**
 * Decide whether to apply or hold a Grok assessment.
 * Escalations apply immediately. Downgrades require DOWNGRADE_THRESHOLD
 * consecutive confirmations.
 */
export function applyHysteresis(input: HysteresisInput): HysteresisResult {
  const {
    proposedStatus,
    proposedTriggered,
    currentStatus,
    currentTriggered,
    downgradeStreak,
  } = input;

  // Same severity or escalation: apply immediately, reset streak
  if (compareSeverity(proposedStatus, currentStatus) >= 0) {
    return {
      effectiveStatus: proposedStatus,
      effectiveTriggered: proposedTriggered,
      downgradeStreak: 0,
      applied: true,
    };
  }

  // Downgrade: increment streak, check threshold
  const newStreak = downgradeStreak + 1;

  if (newStreak >= DOWNGRADE_THRESHOLD) {
    return {
      effectiveStatus: proposedStatus,
      effectiveTriggered: proposedTriggered,
      downgradeStreak: 0,
      applied: true,
    };
  }

  // Hold current state
  return {
    effectiveStatus: currentStatus,
    effectiveTriggered: currentTriggered,
    downgradeStreak: newStreak,
    applied: false,
  };
}
