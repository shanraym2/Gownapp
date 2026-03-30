import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useShop } from "../context/ShopContext";
import { submitOrder } from "../services/orders";
import { brand } from "../theme/brand";

function formatPrice(n) {
  return `P${Number(n).toLocaleString("en-PH")}`;
}

export function CheckoutScreen({ navigation }) {
  const { cartDetailed, subtotal, clearCart, user } = useShop();
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState("gcash");
  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zip: "",
  });

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const placeOrder = async () => {
    if (cartDetailed.length === 0) return;
    if (!String(form.email).toLowerCase().endsWith("@gmail.com")) {
      Alert.alert("Invalid email", "Please use a valid Gmail address.");
      return;
    }
    setSubmitting(true);
    try {
      await submitOrder({
        contact: {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        },
        delivery: {
          address: form.address,
          city: form.city,
          province: form.province,
          zip: form.zip,
        },
        payment,
        items: cartDetailed.map((i) => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          price: i.price,
          subtotal: i.subtotal,
        })),
        subtotal,
        createdAt: new Date().toISOString(),
      });
      await clearCart();
      Alert.alert("Success", "Order placed successfully.");
      navigation.navigate("Main");
    } catch (e) {
      Alert.alert("Order failed", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Secure Checkout</Text>
      {cartDetailed.map((item) => (
        <Text key={item.id} style={styles.item}>
          {item.qty} x {item.name} - {formatPrice(item.subtotal)}
        </Text>
      ))}
      <Text style={styles.total}>Subtotal: {formatPrice(subtotal)}</Text>

      <TextInput style={styles.input} placeholder="First name" value={form.firstName} onChangeText={(v) => onChange("firstName", v)} />
      <TextInput style={styles.input} placeholder="Last name" value={form.lastName} onChangeText={(v) => onChange("lastName", v)} />
      <TextInput style={styles.input} placeholder="Email address" value={form.email} onChangeText={(v) => onChange("email", v)} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Phone number" value={form.phone} onChangeText={(v) => onChange("phone", v.replace(/\D/g, ""))} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Street address" value={form.address} onChangeText={(v) => onChange("address", v)} />
      <TextInput style={styles.input} placeholder="City / Municipality" value={form.city} onChangeText={(v) => onChange("city", v)} />
      <TextInput style={styles.input} placeholder="Province" value={form.province} onChangeText={(v) => onChange("province", v)} />
      <TextInput style={styles.input} placeholder="ZIP code" value={form.zip} onChangeText={(v) => onChange("zip", v)} />

      <View style={styles.row}>
        <Pressable style={[styles.payBtn, payment === "gcash" && styles.payActive]} onPress={() => setPayment("gcash")}>
          <Text style={payment === "gcash" ? styles.payTextActive : styles.payText}>GCash</Text>
        </Pressable>
        <Pressable style={[styles.payBtn, payment === "bdo" && styles.payActive]} onPress={() => setPayment("bdo")}>
          <Text style={payment === "bdo" ? styles.payTextActive : styles.payText}>BDO</Text>
        </Pressable>
      </View>

      <Pressable style={styles.submitBtn} onPress={placeOrder} disabled={submitting}>
            <Text style={styles.submitText}>{submitting ? "Placing order..." : "Place Order Securely"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 12, color: brand.dark, fontStyle: "italic" },
  item: { color: brand.text, marginBottom: 4, fontSize: 13 },
  total: { marginTop: 8, marginBottom: 12, fontSize: 20, fontWeight: "700", color: brand.dark },
  input: { borderWidth: 1, borderColor: brand.border, padding: 11, marginBottom: 9, backgroundColor: brand.white },
  row: { flexDirection: "row", gap: 8, marginTop: 4 },
  payBtn: { flex: 1, borderWidth: 1, borderColor: brand.border, paddingVertical: 10, backgroundColor: brand.white },
  payActive: { backgroundColor: brand.button, borderColor: brand.button },
  payText: { textAlign: "center", fontWeight: "600", color: brand.text },
  payTextActive: { textAlign: "center", fontWeight: "700", color: brand.white },
  submitBtn: { marginTop: 12, backgroundColor: brand.buttonAlt, paddingVertical: 12 },
  submitText: { textAlign: "center", color: brand.white, fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
});
