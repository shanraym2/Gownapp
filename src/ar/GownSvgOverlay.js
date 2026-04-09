import { useId } from "react";
import { Image as SvgImage, Circle, Defs, Mask, Rect, Svg } from "react-native-svg";

/**
 * Gown bitmap with SVG mask: black circles punch holes so the live camera shows through
 * at wrists/elbows — lightweight stand-in for ML segmentation (arms in front of fabric).
 */
export function GownSvgOverlay({ width, height, uri, opacity, landmarksNorm, enabled, holeRadius }) {
  const maskUid = useId().replace(/:/g, "");
  const maskId = `gownMask_${maskUid}`;

  if (!width || !height || !uri) return null;

  const r = holeRadius ?? Math.min(width, height) * 0.065;
  const holes = [];

  if (enabled && landmarksNorm) {
    const keys = ["leftWrist", "rightWrist", "leftElbow", "rightElbow"];
    for (const k of keys) {
      const p = landmarksNorm[k];
      if (p && typeof p.x === "number" && typeof p.y === "number") {
        holes.push({ cx: p.x * width, cy: p.y * height, key: k });
      }
    }
  }

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Mask id={maskId} x="0" y="0" width={width} height={height}>
          <Rect width={width} height={height} fill="#ffffff" />
          {holes.map((h) => (
            <Circle key={h.key} cx={h.cx} cy={h.cy} r={r} fill="#000000" />
          ))}
        </Mask>
      </Defs>
      <SvgImage
        width={width}
        height={height}
        href={{ uri }}
        preserveAspectRatio="xMidYMid meet"
        opacity={opacity}
        mask={`url(#${maskId})`}
      />
    </Svg>
  );
}
