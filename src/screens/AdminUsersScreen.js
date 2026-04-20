import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useShop } from "../context/ShopContext";
import { canAccess } from "../utils/access";
import { createUserAdmin, deleteUserAdmin, listUsersAdmin, updateUserRoleAdmin } from "../services/authLocal";
import { brand } from "../theme/brand";

const ROLE_OPTIONS = ["admin", "staff"];

const EMPTY_FORM = { name: "", email: "", password: "", role: "staff" };

export function AdminUsersScreen() {
  const { user } = useShop();
  const allowed = canAccess(user, "admin_users");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    const users = await listUsersAdmin();
    setItems(Array.isArray(users) ? users : []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const staffUsers = useMemo(() => {
    return items
      .filter((u) => String(u?.role || "") !== "customer")
      .sort((a, b) => String(a?.email || "").localeCompare(String(b?.email || "")));
  }, [items]);

  const onCreate = async () => {
    const res = await createUserAdmin(form);
    if (!res.ok) {
      Alert.alert("Create failed", res.error || "Unable to create user.");
      return;
    }
    setForm(EMPTY_FORM);
    loadData();
    Alert.alert("Created", "Staff account created.");
  };

  const onChangeRole = async (email, role) => {
    const res = await updateUserRoleAdmin({ email, role });
    if (!res.ok) {
      Alert.alert("Update failed", res.error || "Unable to update role.");
      return;
    }
    loadData();
  };

  const onDelete = async (email) => {
    const res = await deleteUserAdmin({ email });
    if (!res.ok) {
      Alert.alert("Delete failed", res.error || "Unable to delete user.");
      return;
    }
    loadData();
  };

  if (!allowed) {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.deniedTitle}>Access denied</Text>
        <Text style={styles.deniedText}>You don’t have permission to manage user accounts.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Users</Text>
      <Text style={styles.subtitle}>Create staff accounts and assign access levels.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add staff</Text>
        <TextInput style={styles.input} placeholder="Full name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Temporary password"
          value={form.password}
          secureTextEntry
          onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
        />
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map((r) => (
            <Pressable
              key={r}
              style={[styles.rolePill, form.role === r ? styles.rolePillActive : null]}
              onPress={() => setForm((p) => ({ ...p, role: r }))}
            >
              <Text style={form.role === r ? styles.roleTextActive : styles.roleText}>{r}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.primaryBtn} onPress={onCreate}>
          <Text style={styles.primaryBtnText}>Create Staff Account</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Staff accounts</Text>
      {loading ? <Text style={styles.subtitle}>Loading users...</Text> : null}
      {!loading && staffUsers.length === 0 ? <Text style={styles.subtitle}>No staff accounts yet.</Text> : null}

      {staffUsers.map((u) => (
        <View key={u.id} style={styles.userCard}>
          <Text style={styles.userName}>{u.name || "Staff"}</Text>
          <Text style={styles.userMeta}>{u.email}</Text>
          <Text style={styles.userMeta}>Role: {u.role}</Text>

          <View style={styles.row}>
            {ROLE_OPTIONS.map((r) => (
              <Pressable
                key={`${u.id}-${r}`}
                style={[styles.secondaryBtn, u.role === r ? styles.secondaryBtnActive : null]}
                onPress={() => onChangeRole(u.email, r)}
              >
                <Text style={u.role === r ? styles.secondaryBtnTextActive : styles.secondaryBtnText}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.dangerBtn}
            onPress={() =>
              Alert.alert("Delete user", `Delete ${u.email}?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDelete(u.email) },
              ])
            }
          >
            <Text style={styles.dangerBtnText}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 34, fontWeight: "800", color: brand.dark, fontStyle: "italic" },
  subtitle: { color: brand.textLight, marginTop: 4, marginBottom: 12 },

  card: { borderWidth: 1, borderColor: brand.border, backgroundColor: brand.white, borderRadius: 14, padding: 12, marginBottom: 14 },
  cardTitle: { color: brand.dark, fontWeight: "900", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: brand.border, backgroundColor: brand.white, padding: 11, marginBottom: 9 },

  roleRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  rolePill: { flex: 1, borderWidth: 1, borderColor: brand.border, borderRadius: 999, paddingVertical: 8, backgroundColor: brand.white },
  rolePillActive: { backgroundColor: brand.button, borderColor: brand.button },
  roleText: { textAlign: "center", fontWeight: "900", fontSize: 11, color: brand.textLight },
  roleTextActive: { textAlign: "center", fontWeight: "900", fontSize: 11, color: brand.white },

  primaryBtn: { backgroundColor: brand.buttonAlt, paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: brand.white, textAlign: "center", fontWeight: "900", letterSpacing: 0.8, fontSize: 11 },

  sectionTitle: { color: brand.dark, fontWeight: "900", marginBottom: 8 },

  userCard: { borderWidth: 1, borderColor: brand.border, backgroundColor: brand.white, borderRadius: 14, padding: 12, marginBottom: 10 },
  userName: { color: brand.dark, fontWeight: "900" },
  userMeta: { color: brand.textLight, marginTop: 3, fontSize: 12 },

  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: brand.border, borderRadius: 10, paddingVertical: 9, backgroundColor: brand.white },
  secondaryBtnActive: { backgroundColor: brand.accentSoft },
  secondaryBtnText: { textAlign: "center", fontWeight: "900", fontSize: 11, color: brand.dark },
  secondaryBtnTextActive: { textAlign: "center", fontWeight: "900", fontSize: 11, color: brand.dark },

  dangerBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: "#a82949" },
  dangerBtnText: { color: brand.white, textAlign: "center", fontWeight: "900", fontSize: 11 },

  deniedWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: brand.bg },
  deniedTitle: { fontSize: 18, fontWeight: "900", color: brand.dark },
  deniedText: { marginTop: 6, color: brand.textLight, textAlign: "center" },
});

