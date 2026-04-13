import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { brand } from "../theme/brand";

export function AdminPanelScreen({ navigation }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Panel</Text>
      <Pressable style={styles.outline} onPress={() => navigation.navigate("AdminOrders")}>
        <Text style={styles.outlineText}>Manage Orders</Text>
      </Pressable>
      <Pressable style={styles.outline} onPress={() => navigation.navigate("AdminGowns")}>
        <Text style={styles.outlineText}>Manage Gowns</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 12, color: brand.dark, fontStyle: "italic" },
  outline: { borderWidth: 1, borderColor: brand.border, paddingVertical: 12, marginBottom: 8, backgroundColor: brand.white },
  outlineText: { color: brand.text, textAlign: "center", fontWeight: "700", letterSpacing: 0.8, fontSize: 11 },
});

