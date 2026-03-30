import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useShop } from "../context/ShopContext";
import { brand } from "../theme/brand";

function formatPrice(n) {
  return `P${Number(n).toLocaleString("en-PH")}`;
}

export function CartScreen({ navigation }) {
  const { cartDetailed, subtotal, setQty, removeFromCart } = useShop();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Cart</Text>
      {cartDetailed.length === 0 ? (
        <Text>Your cart is currently empty.</Text>
      ) : (
        <>
          {cartDetailed.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.thumb} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price} each</Text>
              <Text style={styles.sub}>Subtotal: {formatPrice(item.subtotal)}</Text>
              <View style={styles.row}>
                <Pressable style={styles.smallBtn} onPress={() => setQty(item.id, item.qty - 1)}>
                  <Text>-</Text>
                </Pressable>
                <Text style={styles.qty}>{item.qty}</Text>
                <Pressable style={styles.smallBtn} onPress={() => setQty(item.id, item.qty + 1)}>
                  <Text>+</Text>
                </Pressable>
                <Pressable style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
                  <Text style={styles.removeText}>Remove item</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Text style={styles.total}>Subtotal: {formatPrice(subtotal)}</Text>
          <Pressable style={styles.checkoutBtn} onPress={() => navigation.navigate("Checkout")}>
            <Text style={styles.checkoutText}>Continue to Checkout</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 12, color: brand.dark, fontStyle: "italic" },
  card: { borderBottomWidth: 1, borderBottomColor: brand.border, paddingVertical: 12, marginBottom: 8 },
  thumb: { width: 86, height: 86, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "600", color: brand.dark },
  price: { color: brand.textLight, marginTop: 3 },
  sub: { color: brand.dark, marginTop: 5, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  smallBtn: { width: 30, height: 30, borderWidth: 1, borderColor: brand.border, alignItems: "center", justifyContent: "center", backgroundColor: brand.white },
  qty: { marginHorizontal: 12, fontWeight: "700" },
  removeBtn: { marginLeft: "auto" },
  removeText: { color: "#b00020", fontWeight: "700", fontSize: 12 },
  total: { marginTop: 8, fontSize: 20, fontWeight: "700", color: brand.dark },
  checkoutBtn: { marginTop: 12, backgroundColor: brand.buttonAlt, paddingVertical: 12 },
  checkoutText: { textAlign: "center", color: brand.white, fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
});
