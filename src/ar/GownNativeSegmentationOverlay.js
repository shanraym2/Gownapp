import { useId } from "react";
import { Image as SvgImage, Defs, Mask, Svg } from "react-native-svg";

/**
 * Gown with native person mask: mask PNG is white=background (show gown), black=person (hide gown → camera shows through).
 */
export function GownNativeSegmentationOverlay({ width, height, gownUri, maskDataUri, opacity }) {
  const maskUid = useId().replace(/:/g, "");
  const maskId = `nativeSeg_${maskUid}`;

  if (!width || !height || !gownUri || !maskDataUri) return null;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Mask id={maskId} x="0" y="0" width={width} height={height}>
          <SvgImage
            href={{ uri: maskDataUri }}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid slice"
          />
        </Mask>
      </Defs>
      <SvgImage
        width={width}
        height={height}
        href={{ uri: gownUri }}
        preserveAspectRatio="xMidYMid meet"
        opacity={opacity}
        mask={`url(#${maskId})`}
      />
    </Svg>
  );
}
