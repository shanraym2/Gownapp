import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useShop } from "../context/ShopContext";
import { canAccess } from "../utils/access";
import { brand } from "../theme/brand";

export function AdminPanelScreen({ navigation }) {
  const { user } = useShop();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Panel</Text>
      {canAccess(user, "admin_orders") ? (
        <Pressable style={styles.outline} onPress={() => navigation.navigate("AdminOrders")}>
          <Text style={styles.outlineText}>Manage Orders</Text>
        </Pressable>
      ) : null}
      {canAccess(user, "admin_gowns") ? (
        <Pressable style={styles.outline} onPress={() => navigation.navigate("AdminGowns")}>
          <Text style={styles.outlineText}>Manage Gowns</Text>
        </Pressable>
      ) : null}
      {canAccess(user, "admin_stats") ? (
        <Pressable style={styles.outline} onPress={() => navigation.navigate("AdminStats")}>
          <Text style={styles.outlineText}>Statistics</Text>
        </Pressable>
      ) : null}
      {canAccess(user, "admin_users") ? (
        <Pressable style={styles.outline} onPress={() => navigation.navigate("AdminUsers")}>
          <Text style={styles.outlineText}>User Accounts</Text>
        </Pressable>
      ) : null}

      {!canAccess(user, "admin_orders") && !canAccess(user, "admin_gowns") && !canAccess(user, "admin_stats") && !canAccess(user, "admin_users") ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No admin tools available for your role.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 12, color: brand.dark, fontStyle: "italic" },
  outline: { borderWidth: 1, borderColor: brand.border, paddingVertical: 12, marginBottom: 8, backgroundColor: brand.white },
  outlineText: { color: brand.text, textAlign: "center", fontWeight: "700", letterSpacing: 0.8, fontSize: 11 },
  emptyWrap: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.white },
  emptyText: { color: brand.textLight, textAlign: "center", fontWeight: "800", fontSize: 12 },
});

