import { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { detectPose } from "@scottjgilroy/react-native-vision-camera-v4-pose-detection/lib/module/detectPose";
import { detectNativePersonSegmentation } from "vision-camera-native-segmentation";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
  runAsync,
  runAtTargetFps,
} from "react-native-vision-camera";
import { useRunOnJS } from "react-native-worklets-core";

const POSE_OPTIONS = { mode: "stream", performanceMode: "max" };

/**
 * VisionCamera + throttled ML Kit pose; optional native person segmentation (Apple Vision / ML Kit selfie).
 */
export function NativePoseCamera({
  facing,
  isActive,
  onPoseMap,
  onVideoDimensions,
  targetFps = 12,
  segmentationEnabled = false,
  segmentationFps = 5,
  onSegmentationResult,
}) {
  const device = useCameraDevice(facing === "front" ? "front" : "back");
  const format = useCameraFormat(device, [
    { videoResolution: { width: 720, height: 1280 } },
    { fps: 30 },
  ]);

  useEffect(() => {
    const w = format?.videoWidth;
    const h = format?.videoHeight;
    if (w && h) onVideoDimensions?.({ width: w, height: h });
  }, [format?.videoWidth, format?.videoHeight, onVideoDimensions]);

  const onPoseRef = useRef(onPoseMap);
  onPoseRef.current = onPoseMap;
  const onSegRef = useRef(onSegmentationResult);
  onSegRef.current = onSegmentationResult;

  const emitPose = useRunOnJS((map) => {
    onPoseRef.current?.(map);
  }, []);

  const emitSeg = useRunOnJS((result) => {
    onSegRef.current?.(result);
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      runAtTargetFps(targetFps, () => {
        "worklet";
        runAsync(frame, () => {
          "worklet";
          try {
            const data = detectPose(frame, POSE_OPTIONS);
            emitPose(data);
          } catch {
            emitPose(null);
          }
        });
      });
      if (segmentationEnabled) {
        runAtTargetFps(segmentationFps, () => {
          "worklet";
          runAsync(frame, () => {
            "worklet";
            try {
              const seg = detectNativePersonSegmentation(frame, {});
              emitSeg(seg);
            } catch {
              emitSeg({ error: "segmentation_failed" });
            }
          });
        });
      }
    },
    [emitPose, emitSeg, segmentationEnabled, segmentationFps, targetFps]
  );

  const pixelFormat = format?.pixelFormats?.includes?.("yuv") ? "yuv" : undefined;

  if (!device) return null;

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={isActive}
      format={format}
      pixelFormat={pixelFormat}
      frameProcessor={frameProcessor}
      enableFpsGraph={false}
    />
  );
}
