import * as Haptics from 'expo-haptics';

/**
 * Triggers a light haptic impact for a tap or toggle action.
 * Safe to call on platforms that don't support haptics (web).
 */
export function hapticTap() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Triggers a success haptic impact (e.g. favorite added, tracking started).
 */
export function hapticSuccess() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Triggers a warning haptic impact (e.g. error, cancellation).
 */
export function hapticWarning() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}