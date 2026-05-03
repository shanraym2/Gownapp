import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { useShop } from "../context/ShopContext";
import { changeUserPassword, deleteUserAccount, updateUserProfile } from "../services/authLocal";
import { loadAddresses, loadCheckoutProfiles, saveAddresses, saveCheckoutProfiles } from "../utils/storage";
import { brand } from "../theme/brand";

export function ProfileScreen({ navigation }) {
  const { user, login, logout, lastSyncedAt } = useShop();
  const isAdmin = user?.role === "admin";
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "" });
  const [deletePassword, setDeletePassword] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [addressBook, setAddressBook] = useState([]);
  const [checkoutDefaults, setCheckoutDefaults] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zip: "",
  });

  useEffect(() => {
    setProfileForm({
      name: String(user?.name || ""),
      phone: String(user?.phone || ""),
    });
    (async () => {
      if (!user?.email) return;
      const [allAddresses, checkoutProfiles] = await Promise.all([loadAddresses(), loadCheckoutProfiles()]);
      const entries = allAddresses?.[String(user.email).toLowerCase()] || [];
      setAddressBook(entries);
      const saved = checkoutProfiles?.[String(user.email).toLowerCase()];
      if (saved) {
        setCheckoutDefaults({
          firstName: String(saved.firstName || ""),
          lastName: String(saved.lastName || ""),
          phone: String(saved.phone || ""),
          address: String(saved.address || ""),
          city: String(saved.city || ""),
          province: String(saved.province || ""),
          zip: String(saved.zip || ""),
        });
      }
    })();
  }, [user?.email, user?.name, user?.phone]);

  const onSaveProfile = async () => {
    if (!user?.email) return;
    setBusy(true);
    try {
      const res = await updateUserProfile({ email: user.email, name: profileForm.name, phone: profileForm.phone });
      if (!res.ok) throw new Error(res.error || "Failed to save profile.");
      await login(res.user);
      Alert.alert("Saved", "Profile updated.");
    } catch (e) {
      Alert.alert("Update failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  const onAddAddress = async () => {
    if (!user?.email || !address.trim()) return;
    const cleanEmail = String(user.email).toLowerCase();
    const all = await loadAddresses();
    const nextList = [...(all?.[cleanEmail] || []), { value: address.trim(), createdAt: new Date().toISOString() }];
    const next = { ...(all || {}), [cleanEmail]: nextList };
    await saveAddresses(next);
    setAddressBook(nextList);
    setAddress("");
  };

  const onChangePassword = async () => {
    if (!user?.email) return;
    setBusy(true);
    try {
      const res = await changeUserPassword({
        email: user.email,
        currentPassword: passwordForm.currentPassword,
        nextPassword: passwordForm.nextPassword,
      });
      if (!res.ok) throw new Error(res.error || "Failed to change password.");
      setPasswordForm({ currentPassword: "", nextPassword: "" });
      Alert.alert("Success", "Password updated.");
    } catch (e) {
      Alert.alert("Password update failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  const onDeleteAccount = async () => {
    if (!user?.email) return;
    setBusy(true);
    try {
      const res = await deleteUserAccount({ email: user.email, password: deletePassword });
      if (!res.ok) throw new Error(res.error || "Failed to delete account.");
      await logout();
      setDeletePassword("");
      Alert.alert("Account deleted", "Your account has been removed from this device.");
    } catch (e) {
      Alert.alert("Delete failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  const onSaveCheckoutDefaults = async () => {
    if (!user?.email) return;
    const cleanEmail = String(user.email).toLowerCase();
    const all = await loadCheckoutProfiles();
    await saveCheckoutProfiles({
      ...(all || {}),
      [cleanEmail]: {
        ...checkoutDefaults,
        phone: String(checkoutDefaults.phone || "").replace(/\D/g, ""),
      },
    });
    Alert.alert("Saved", "Checkout auto-fill details saved.");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Account</Text>
      {user ? (
        <>
          <Text style={styles.email}>{user.name || "Customer"}</Text>
          <Text style={styles.note}>{user.email}</Text>
          <Text style={styles.note}>Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Never"}</Text>
          <Pressable style={styles.btn} onPress={() => navigation.navigate("MyOrders")}>
            <Text style={styles.btnText}>View My Orders</Text>
          </Pressable>
          <Text style={styles.section}>Profile</Text>
          <TextInput style={styles.input} placeholder="Full name" value={profileForm.name} onChangeText={(v) => setProfileForm((p) => ({ ...p, name: v }))} />
          <TextInput style={styles.input} placeholder="Phone number" value={profileForm.phone} onChangeText={(v) => setProfileForm((p) => ({ ...p, phone: v }))} />
          <Pressable style={styles.outline} onPress={onSaveProfile} disabled={busy}>
            <Text style={styles.outlineText}>Save Profile</Text>
          </Pressable>

          {!isAdmin ? (
            <>
              <Text style={styles.section}>Address Book</Text>
              <TextInput style={styles.input} placeholder="Add address" value={address} onChangeText={setAddress} />
              <Pressable style={styles.outline} onPress={onAddAddress}>
                <Text style={styles.outlineText}>Add Address</Text>
              </Pressable>
              {addressBook.map((entry, idx) => (
                <Text key={`${entry.createdAt || idx}`} style={styles.metaItem}>
                  • {entry.value}
                </Text>
              ))}

              <Text style={styles.section}>Checkout Auto-Fill</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                value={checkoutDefaults.firstName}
                onChangeText={(v) => setCheckoutDefaults((p) => ({ ...p, firstName: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Last name"
                value={checkoutDefaults.lastName}
                onChangeText={(v) => setCheckoutDefaults((p) => ({ ...p, lastName: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                value={checkoutDefaults.phone}
                onChangeText={(v) => setCheckoutDefaults((p) => ({ ...p, phone: v.replace(/\D/g, "") }))}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Street address"
                value={checkoutDefaults.address}
                onChangeText={(v) => setCheckoutDefaults((p) => ({ ...p, address: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="City / Municipality"
                value={checkoutDefaults.city}
                onChangeText={(v) => setCheckoutDefaults((p) => ({ ...p, city: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Province"
                value={checkoutDefaults.province}
                onChangeText={(v) => setCheckoutDefaults((p) => ({ ...p, province: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="ZIP code"
                value={checkoutDefaults.zip}
                onChangeText={(v) => setCheckoutDefaults((p) => ({ ...p, zip: v }))}
              />
              <Pressable style={styles.outline} onPress={onSaveCheckoutDefaults}>
                <Text style={styles.outlineText}>Save Checkout Defaults</Text>
              </Pressable>
            </>
          ) : null}

          <Text style={styles.section}>Change Password</Text>
          <TextInput style={styles.input} secureTextEntry placeholder="Current password" value={passwordForm.currentPassword} onChangeText={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))} />
          <TextInput style={styles.input} secureTextEntry placeholder="New password" value={passwordForm.nextPassword} onChangeText={(v) => setPasswordForm((p) => ({ ...p, nextPassword: v }))} />
          <Pressable style={styles.outline} onPress={onChangePassword} disabled={busy}>
            <Text style={styles.outlineText}>Update Password</Text>
          </Pressable>

          {!isAdmin ? (
            <>
              <Text style={styles.sectionDanger}>Delete Account</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Confirm password to delete"
                value={deletePassword}
                onChangeText={setDeletePassword}
              />
              <Pressable
                style={styles.dangerBtn}
                onPress={() => {
                  Alert.alert("Delete account", "This action cannot be undone. Continue?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: onDeleteAccount },
                  ]);
                }}
              >
                <Text style={styles.btnText}>Delete Account</Text>
              </Pressable>
            </>
          ) : null}
          <Pressable style={styles.outline} onPress={() => navigation.navigate("Contact")}>
            <Text style={styles.outlineText}>Contact Us</Text>
          </Pressable>
          <Pressable
            style={styles.outline}
            onPress={async () => {
              await logout();
            }}
          >
            <Text style={styles.outlineText}>Sign Out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.note}>Sign in to save your details and track your orders.</Text>
          <Pressable style={styles.btn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.btnText}>Sign In</Text>
          </Pressable>
          <Pressable style={styles.outline} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.outlineText}>Reset Password</Text>
          </Pressable>
          <Pressable style={styles.outline} onPress={() => navigation.navigate("Contact")}>
            <Text style={styles.outlineText}>Contact Us</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 12, color: brand.dark, fontStyle: "italic" },
  email: { fontSize: 18, marginBottom: 6, color: brand.dark },
  note: { marginBottom: 12, color: brand.textLight },
  section: { fontSize: 14, color: brand.dark, fontWeight: "800", marginTop: 8, marginBottom: 8 },
  sectionDanger: { fontSize: 14, color: "#a82949", fontWeight: "800", marginTop: 8, marginBottom: 8 },
  btn: { backgroundColor: brand.button, paddingVertical: 12, marginBottom: 8 },
  btnText: { color: brand.white, textAlign: "center", fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
  outline: { borderWidth: 1, borderColor: brand.border, paddingVertical: 12, marginBottom: 8, backgroundColor: brand.white },
  outlineText: { color: brand.text, textAlign: "center", fontWeight: "700", letterSpacing: 0.8, fontSize: 11 },
  input: { borderWidth: 1, borderColor: brand.border, padding: 11, marginBottom: 9, backgroundColor: brand.white },
  metaItem: { color: brand.textLight, marginBottom: 4, lineHeight: 17 },
  dangerBtn: { backgroundColor: "#a82949", paddingVertical: 12, marginBottom: 8 },
});
