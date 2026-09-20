export function hasCompletedOnboarding(settings: unknown): boolean {
  return Boolean(settings && typeof settings === "object" && (settings as { onboardingCompleted?: unknown }).onboardingCompleted === true);
}
