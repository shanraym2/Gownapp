import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { brand } from "../theme/brand";

export function ContactScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const send = async () => {
    const subject = encodeURIComponent(`Bridal inquiry from ${name || "guest"}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    const url = `mailto:hello@jcebridal.com?subject=${subject}&body=${body}`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert("No email app", "Please install or set up an email app.");
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Contact JCE Bridal</Text>
      <Text style={styles.copy}>Quezon City, Metro Manila • +63 917 123 4567 • karina@jcebridal.com</Text>
      <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Your email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={[styles.input, styles.message]} placeholder="How can we help you today?" value={message} onChangeText={setMessage} multiline />
      <Pressable style={styles.btn} onPress={send}>
        <Text style={styles.btnText}>Send Message via Email</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg, padding: 16 },
  title: { fontSize: 30, fontWeight: "700", color: brand.dark, marginBottom: 6, fontStyle: "italic" },
  copy: { color: brand.textLight, marginBottom: 14, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: brand.border, padding: 11, marginBottom: 10, textAlignVertical: "top", backgroundColor: brand.white },
  message: { minHeight: 120 },
  btn: { backgroundColor: brand.button, paddingVertical: 12 },
  btnText: { color: brand.white, textAlign: "center", fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
});
