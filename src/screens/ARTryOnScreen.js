import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import { useShop } from "../context/ShopContext";
import { getAutoFitTransform } from "../ar/autoFit";
import { brand } from "../theme/brand";
import { loadArFitProfiles, saveArFitProfiles } from "../utils/storage";

const DEFAULT_FIT_MODEL = {
  centerX: 0.5,
  centerY: 0.48,
  shoulderWidth: 0.24,
  torsoHeight: 0.28,
};

export function ARTryOnScreen() {
  const { gowns } = useShop();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState("front");
  const [selectedId, setSelectedId] = useState(null);
  const [overlayScale, setOverlayScale] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0.72);
  const [autoFitEnabled, setAutoFitEnabled] = useState(true);
  const [poseDetected, setPoseDetected] = useState(false);
  const [fitModel, setFitModel] = useState(DEFAULT_FIT_MODEL);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [fitProfiles, setFitProfiles] = useState({});
  const [saving, setSaving] = useState(false);
  const overlayPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const previewRef = useRef(null);

  const selectedGown = useMemo(() => {
    const fallback = gowns[0] || null;
    if (!gowns.length) return null;
    if (!selectedId) return fallback;
    return gowns.find((g) => Number(g.id) === Number(selectedId)) || fallback;
  }, [gowns, selectedId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const profiles = await loadArFitProfiles();
      if (!mounted) return;
      setFitProfiles(profiles || {});
      setProfilesLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profilesLoaded || !selectedGown) return;
    const profile = fitProfiles?.[String(selectedGown.id)];
    if (!profile) {
      setFitModel(DEFAULT_FIT_MODEL);
      return;
    }
    setFitModel({
      centerX: Number(profile.centerX) || DEFAULT_FIT_MODEL.centerX,
      centerY: Number(profile.centerY) || DEFAULT_FIT_MODEL.centerY,
      shoulderWidth: Number(profile.shoulderWidth) || DEFAULT_FIT_MODEL.shoulderWidth,
      torsoHeight: Number(profile.torsoHeight) || DEFAULT_FIT_MODEL.torsoHeight,
    });
  }, [profilesLoaded, selectedGown, fitProfiles]);

  const onScaleDown = () => setOverlayScale((v) => Math.max(0.7, Number((v - 0.05).toFixed(2))));
  const onScaleUp = () => setOverlayScale((v) => Math.min(1.4, Number((v + 0.05).toFixed(2))));
  const onOpacityDown = () => setOverlayOpacity((v) => Math.max(0.35, Number((v - 0.05).toFixed(2))));
  const onOpacityUp = () => setOverlayOpacity((v) => Math.min(0.95, Number((v + 0.05).toFixed(2))));

  const adjustFit = (key, delta, min, max) => {
    setFitModel((prev) => ({
      ...prev,
      [key]: Math.max(min, Math.min(max, Number((prev[key] + delta).toFixed(3)))),
    }));
  };

  // Temporary seed landmarks until native pose stream is connected.
  const seedLandmarks = useMemo(
    () => ({
      leftShoulder: { x: fitModel.centerX - fitModel.shoulderWidth / 2, y: fitModel.centerY - fitModel.torsoHeight / 2 },
      rightShoulder: { x: fitModel.centerX + fitModel.shoulderWidth / 2, y: fitModel.centerY - fitModel.torsoHeight / 2 },
      leftHip: { x: fitModel.centerX - fitModel.shoulderWidth * 0.28, y: fitModel.centerY + fitModel.torsoHeight / 2 },
      rightHip: { x: fitModel.centerX + fitModel.shoulderWidth * 0.28, y: fitModel.centerY + fitModel.torsoHeight / 2 },
    }),
    [fitModel]
  );

  const autoFit = useMemo(() => {
    if (!autoFitEnabled) return null;
    return getAutoFitTransform(seedLandmarks, { width: 320, height: 430 });
  }, [autoFitEnabled, seedLandmarks]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, { dx: overlayPan.x, dy: overlayPan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          overlayPan.extractOffset();
          overlayPan.setValue({ x: 0, y: 0 });
        },
      }),
    [overlayPan]
  );

  const onCaptureAndSave = async () => {
    try {
      setSaving(true);
      const uri = await captureRef(previewRef, {
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
      });

      try {
        const permissionResult = await MediaLibrary.requestPermissionsAsync();
        if (!permissionResult.granted) {
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              dialogTitle: "Save or share your AR preview",
            });
            Alert.alert("Preview ready", "Opened share options so you can save the AR image.");
          } else {
            Alert.alert("Permission needed", "Please allow media library access to save your AR preview.");
          }
          return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Saved", "Your AR try-on preview has been saved to your gallery.");
      } catch {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            dialogTitle: "Save or share your AR preview",
          });
          Alert.alert("Preview ready", "Opened share options so you can save the AR image.");
        } else {
          Alert.alert(
            "Save not available here",
            "Preview capture works, but gallery save needs a development build/rebuild with media permission enabled."
          );
        }
      }
    } catch (err) {
      Alert.alert("Save failed", "Could not save preview. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onResetFit = () => {
    overlayPan.setOffset({ x: 0, y: 0 });
    overlayPan.setValue({ x: 0, y: 0 });
    setOverlayScale(1);
    setOverlayOpacity(0.72);
    setFitModel(DEFAULT_FIT_MODEL);
    setAutoFitEnabled(true);
    setPoseDetected(true);
  };

  const onSaveFitProfile = async () => {
    if (!selectedGown) return;
    const next = {
      ...fitProfiles,
      [String(selectedGown.id)]: fitModel,
    };
    setFitProfiles(next);
    await saveArFitProfiles(next);
    Alert.alert("Fit saved", `${selectedGown.name} fit profile saved.`);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.subtitle}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Try AR Dress</Text>
        <Text style={styles.subtitle}>
          To start AR try-on, allow camera access. We only use your camera for live preview.
        </Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  if (!selectedGown) {
    return (
      <View style={styles.center}>
        <Text style={styles.subtitle}>No gowns available yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>AR Try-On</Text>
        <Text style={styles.subtitle}>Pick a gown and align it on your camera preview.</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={() => setCameraFacing((v) => (v === "front" ? "back" : "front"))}>
            <Text style={styles.headerBtnText}>Flip Camera</Text>
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={onResetFit}>
            <Text style={styles.headerBtnText}>Reset Fit</Text>
          </Pressable>
        </View>
      </View>

      <View ref={previewRef} collapsable={false} style={styles.cameraWrap}>
        <CameraView style={styles.camera} facing={cameraFacing} />
        <Animated.View
          style={[
            styles.overlayMover,
            {
              transform: [
                {
                  translateX: autoFitEnabled && autoFit ? autoFit.translateX : overlayPan.x,
                },
                {
                  translateY: autoFitEnabled && autoFit ? autoFit.translateY : overlayPan.y,
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: selectedGown.image }}
            style={[
              styles.overlayImage,
              {
                opacity: overlayOpacity,
                transform: [{ scale: autoFitEnabled && autoFit ? autoFit.scale : overlayScale }],
              },
            ]}
          />
        </Animated.View>
        <View style={styles.overlayLabel}>
          <Text style={styles.overlayLabelText}>{selectedGown.name} • Drag to position</Text>
        </View>
      </View>

      <View style={styles.controlsCard}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Auto-Fit Beta</Text>
          <Pressable
            style={[styles.toggleBtn, autoFitEnabled ? styles.toggleBtnActive : null]}
            onPress={() => {
              const next = !autoFitEnabled;
              setAutoFitEnabled(next);
              setPoseDetected(next);
            }}
          >
            <Text style={[styles.toggleText, autoFitEnabled ? styles.toggleTextActive : null]}>
              {autoFitEnabled ? "ON" : "OFF"}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.hintText}>
          {poseDetected
            ? "Auto-fit calibration active. Next step: connect live pose landmarks for true body tracking."
            : "Auto-fit off. Use drag and manual controls."}
        </Text>

        {autoFitEnabled && (
          <>
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Body Center X</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => adjustFit("centerX", -0.015, 0.32, 0.68)}>
                  <Ionicons name="remove" size={16} color={brand.dark} />
                </Pressable>
                <Text style={styles.stepValue}>{Math.round(fitModel.centerX * 100)}%</Text>
                <Pressable style={styles.stepBtn} onPress={() => adjustFit("centerX", 0.015, 0.32, 0.68)}>
                  <Ionicons name="add" size={16} color={brand.dark} />
                </Pressable>
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Body Center Y</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => adjustFit("centerY", -0.015, 0.36, 0.62)}>
                  <Ionicons name="remove" size={16} color={brand.dark} />
                </Pressable>
                <Text style={styles.stepValue}>{Math.round(fitModel.centerY * 100)}%</Text>
                <Pressable style={styles.stepBtn} onPress={() => adjustFit("centerY", 0.015, 0.36, 0.62)}>
                  <Ionicons name="add" size={16} color={brand.dark} />
                </Pressable>
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Shoulder Width</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => adjustFit("shoulderWidth", -0.012, 0.16, 0.42)}>
                  <Ionicons name="remove" size={16} color={brand.dark} />
                </Pressable>
                <Text style={styles.stepValue}>{Math.round(fitModel.shoulderWidth * 100)}%</Text>
                <Pressable style={styles.stepBtn} onPress={() => adjustFit("shoulderWidth", 0.012, 0.16, 0.42)}>
                  <Ionicons name="add" size={16} color={brand.dark} />
                </Pressable>
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Torso Height</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => adjustFit("torsoHeight", -0.012, 0.18, 0.48)}>
                  <Ionicons name="remove" size={16} color={brand.dark} />
                </Pressable>
                <Text style={styles.stepValue}>{Math.round(fitModel.torsoHeight * 100)}%</Text>
                <Pressable style={styles.stepBtn} onPress={() => adjustFit("torsoHeight", 0.012, 0.18, 0.48)}>
                  <Ionicons name="add" size={16} color={brand.dark} />
                </Pressable>
              </View>
            </View>
          </>
        )}

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Size</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={onScaleDown}>
              <Ionicons name="remove" size={16} color={brand.dark} />
            </Pressable>
            <Text style={styles.stepValue}>{Math.round(overlayScale * 100)}%</Text>
            <Pressable style={styles.stepBtn} onPress={onScaleUp}>
              <Ionicons name="add" size={16} color={brand.dark} />
            </Pressable>
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Opacity</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={onOpacityDown}>
              <Ionicons name="remove" size={16} color={brand.dark} />
            </Pressable>
            <Text style={styles.stepValue}>{Math.round(overlayOpacity * 100)}%</Text>
            <Pressable style={styles.stepBtn} onPress={onOpacityUp}>
              <Ionicons name="add" size={16} color={brand.dark} />
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={styles.pickerTitle}>Choose Gown</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
        {gowns.map((g) => {
          const active = Number(g.id) === Number(selectedGown.id);
          return (
            <Pressable
              key={g.id}
              style={[styles.chip, active ? styles.chipActive : null]}
              onPress={() => setSelectedId(g.id)}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]} numberOfLines={1}>
                {g.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable style={styles.btn} onPress={onCaptureAndSave} disabled={saving}>
        {saving ? (
          <View style={styles.savingRow}>
            <ActivityIndicator size="small" color={brand.white} />
            <Text style={styles.btnText}>Saving…</Text>
          </View>
        ) : (
          <Text style={styles.btnText}>Capture & Save Preview</Text>
        )}
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={onSaveFitProfile}>
        <Text style={styles.secondaryBtnText}>Save Fit for This Gown</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg, padding: 16 },
  center: { flex: 1, backgroundColor: brand.bg, alignItems: "center", justifyContent: "center", padding: 16 },
  header: { marginBottom: 10 },
  title: { fontSize: 30, color: brand.dark, fontWeight: "900", marginBottom: 4, fontStyle: "italic" },
  subtitle: { color: brand.textLight, lineHeight: 19, fontSize: 12 },
  headerActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  headerBtn: {
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.white,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerBtnText: { color: brand.dark, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },

  cameraWrap: {
    height: 430,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.white,
  },
  camera: { flex: 1 },
  overlayMover: {
    position: "absolute",
    bottom: 0,
    left: "12%",
    right: "12%",
    height: "78%",
  },
  overlayImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  overlayLabel: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: brand.border,
  },
  overlayLabelText: { color: brand.dark, fontWeight: "800", fontSize: 12, textAlign: "center" },

  controlsCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.white,
    padding: 12,
    gap: 10,
  },
  controlRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  controlLabel: { color: brand.dark, fontWeight: "800", fontSize: 13 },
  toggleBtn: {
    minWidth: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 999,
    backgroundColor: brand.white,
  },
  toggleBtnActive: { backgroundColor: brand.dark, borderColor: brand.dark },
  toggleText: { color: brand.dark, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  toggleTextActive: { color: brand.white },
  hintText: { color: brand.textLight, fontSize: 11, marginTop: -3, marginBottom: 2, lineHeight: 16 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.accentSoft,
  },
  stepValue: { minWidth: 45, textAlign: "center", color: brand.dark, fontWeight: "800", fontSize: 12 },

  pickerTitle: { marginTop: 12, color: brand.dark, fontWeight: "900", fontSize: 14 },
  pickerRow: { paddingTop: 8, paddingBottom: 4, gap: 8 },
  chip: {
    maxWidth: 170,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.white,
  },
  chipActive: { backgroundColor: brand.dark, borderColor: brand.dark },
  chipText: { color: brand.dark, fontWeight: "700", fontSize: 12 },
  chipTextActive: { color: brand.white },

  btn: { marginTop: 10, backgroundColor: brand.button, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  savingRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  btnText: { color: brand.white, fontWeight: "800", letterSpacing: 1.1, fontSize: 12 },
  secondaryBtn: { marginTop: 8, backgroundColor: brand.white, borderWidth: 1, borderColor: brand.border, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  secondaryBtnText: { color: brand.dark, fontWeight: "800", letterSpacing: 0.9, fontSize: 12 },
});

