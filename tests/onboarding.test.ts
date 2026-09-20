import assert from "node:assert/strict";
import test from "node:test";
import { hasCompletedOnboarding } from "../src/services/onboarding.ts";

test("legacy settings default onboarding to incomplete", () => {
  assert.equal(hasCompletedOnboarding(null), false);
  assert.equal(hasCompletedOnboarding({ libraryRoot: "C:/Library" }), false);
  assert.equal(hasCompletedOnboarding({ onboardingCompleted: false }), false);
  assert.equal(hasCompletedOnboarding({ onboardingCompleted: true }), true);
});
