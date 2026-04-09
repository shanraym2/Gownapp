const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Exponential smoothing for overlay transform (pixels + scale).
 */
export function smoothPoseTransform(prev, next, alpha) {
  if (!next) return prev;
  if (!prev) return { ...next };
  const a = clamp(alpha, 0.05, 1);
  return {
    translateX: prev.translateX * (1 - a) + next.translateX * a,
    translateY: prev.translateY * (1 - a) + next.translateY * a,
    scale: prev.scale * (1 - a) + next.scale * a,
  };
}
