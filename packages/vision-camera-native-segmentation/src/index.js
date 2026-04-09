import { VisionCameraProxy } from "react-native-vision-camera";

const LINKING_ERROR =
  "vision-camera-native-segmentation: native plugin not linked. Rebuild iOS/Android after installing; not available in Expo Go.";

let plugin;
try {
  plugin = VisionCameraProxy.initFrameProcessorPlugin("nativePersonSegment", {});
} catch {
  plugin = null;
}

/**
 * @param {import('react-native-vision-camera').Frame} frame
 * @param {Record<string, unknown>} [options] reserved
 * @returns {{ maskBase64?: string, maskWidth?: number, maskHeight?: number, error?: string } | null}
 */
export function detectNativePersonSegmentation(frame, options) {
  "worklet";
  if (plugin == null) {
    throw new Error(LINKING_ERROR);
  }
  return plugin.call(frame, options ?? {});
}

export function isNativeSegmentationAvailable() {
  return plugin != null;
}
