function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function point(landmarks, key, fallback) {
  const p = landmarks?.[key];
  if (!p || typeof p.x !== "number" || typeof p.y !== "number") return fallback;
  return p;
}

/**
 * Convert pose landmarks to overlay transform values.
 * Landmarks are normalized (0..1) points.
 */
export function getAutoFitTransform(landmarks, frame) {
  if (!landmarks || !frame?.width || !frame?.height) return null;

  const leftShoulder = point(landmarks, "leftShoulder", { x: 0.35, y: 0.34 });
  const rightShoulder = point(landmarks, "rightShoulder", { x: 0.65, y: 0.34 });
  const leftHip = point(landmarks, "leftHip", { x: 0.42, y: 0.63 });
  const rightHip = point(landmarks, "rightHip", { x: 0.58, y: 0.63 });

  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const torsoHeight = Math.abs(((leftHip.y + rightHip.y) / 2) - ((leftShoulder.y + rightShoulder.y) / 2));

  const centerX = ((leftShoulder.x + rightShoulder.x) / 2 - 0.5) * frame.width;
  const centerY = (((leftShoulder.y + rightShoulder.y) / 2 + (leftHip.y + rightHip.y) / 2) / 2 - 0.5) * frame.height;

  // Calibrated constants for gown overlay in this app
  const scaleByShoulders = shoulderWidth / 0.28;
  const scaleByTorso = torsoHeight / 0.30;
  const scale = clamp((scaleByShoulders + scaleByTorso) / 2, 0.72, 1.32);

  return {
    translateX: centerX,
    translateY: centerY + frame.height * 0.12,
    scale,
  };
}

