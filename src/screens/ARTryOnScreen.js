import { Pressable, StyleSheet, Text, View } from "react-native";
import { brand } from "../theme/brand";

export function ARTryOnScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Try AR Dress 👗</Text>
      <Text style={styles.subtitle}>
        This is a placeholder AR screen. Next, we can connect a real AR try-on flow (camera + dress overlay).
      </Text>
      <Pressable style={styles.btn}>
        <Text style={styles.btnText}>Start Try‑On</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg, padding: 18, justifyContent: "center" },
  title: { fontSize: 28, color: brand.dark, fontWeight: "800", marginBottom: 10 },
  subtitle: { color: brand.textLight, lineHeight: 20, marginBottom: 16 },
  btn: { backgroundColor: brand.button, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: brand.white, fontWeight: "800", letterSpacing: 1.1, fontSize: 12 },
});

