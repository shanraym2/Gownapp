import { Pressable, StyleSheet, Text, View } from "react-native";
import { useShop } from "../context/ShopContext";
import { brand } from "../theme/brand";

export function ProfileScreen({ navigation }) {
  const { user, logout } = useShop();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>My Account</Text>
      {user ? (
        <>
          <Text style={styles.email}>{user.name || "Customer"}</Text>
          <Text style={styles.note}>{user.email}</Text>
          <Pressable style={styles.btn} onPress={() => navigation.navigate("MyOrders")}>
          <Text style={styles.btnText}>View My Orders</Text>
          </Pressable>
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
          <Pressable style={styles.outline} onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.outlineText}>Create Account</Text>
          </Pressable>
          <Pressable style={styles.outline} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.outlineText}>Reset Password</Text>
          </Pressable>
          <Pressable style={styles.outline} onPress={() => navigation.navigate("Contact")}>
            <Text style={styles.outlineText}>Contact Us</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg, padding: 16 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 12, color: brand.dark, fontStyle: "italic" },
  email: { fontSize: 18, marginBottom: 6, color: brand.dark },
  note: { marginBottom: 12, color: brand.textLight },
  btn: { backgroundColor: brand.button, paddingVertical: 12, marginBottom: 8 },
  btnText: { color: brand.white, textAlign: "center", fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
  outline: { borderWidth: 1, borderColor: brand.border, paddingVertical: 12, marginBottom: 8, backgroundColor: brand.white },
  outlineText: { color: brand.text, textAlign: "center", fontWeight: "700", letterSpacing: 0.8, fontSize: 11 },
});
