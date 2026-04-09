const PAIRS = [
  ["leftShoulder", "leftShoulderPosition"],
  ["rightShoulder", "rightShoulderPosition"],
  ["leftElbow", "leftElbowPosition"],
  ["rightElbow", "rightElbowPosition"],
  ["leftWrist", "leftWristPosition"],
  ["rightWrist", "rightWristPosition"],
  ["leftHip", "leftHipPosition"],
  ["rightHip", "rightHipPosition"],
  ["nose", "nosePosition"],
];

function readPoint(entry) {
  if (!entry || typeof entry !== "object") return null;
  const x = Number(entry.x);
  const y = Number(entry.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

/**
 * Convert ML Kit frame-processor map (pixel coords in video buffer) to normalized landmarks (0..1).
 * @param {Record<string, { x: number; y: number }>} raw
 * @param {number} videoW
 * @param {number} videoH
 * @param {boolean} mirrorX front camera preview is mirrored
 */
export function posePluginToLandmarks(raw, videoW, videoH, mirrorX) {
  if (!raw || !videoW || !videoH) return null;

  const out = {};
  for (const [name, key] of PAIRS) {
    const p = readPoint(raw[key]);
    if (!p) continue;
    let nx = p.x / videoW;
    let ny = p.y / videoH;
    if (mirrorX) nx = 1 - nx;
    out[name] = { x: nx, y: ny };
  }

  // iOS plugin bug: right shoulder sometimes copies left — repair if identical
  const ls = out.leftShoulder;
  const rs = out.rightShoulder;
  if (ls && rs && Math.abs(ls.x - rs.x) < 1e-4 && Math.abs(ls.y - rs.y) < 1e-4) {
    const w = 0.12;
    out.leftShoulder = { x: Math.max(0, ls.x - w / 2), y: ls.y };
    out.rightShoulder = { x: Math.min(1, ls.x + w / 2), y: ls.y };
  }

  if (!out.leftShoulder || !out.rightShoulder || !out.leftHip || !out.rightHip) return null;
  return out;
}
