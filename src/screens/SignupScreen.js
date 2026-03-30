import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { sendLoginOtp, verifyLoginOtp } from "../services/auth";
import { useShop } from "../context/ShopContext";
import { loadUsers, registerUser } from "../services/authLocal";
import { getPasswordRuleChecks } from "../utils/authValidation";
import { brand } from "../theme/brand";

export function SignupScreen({ navigation }) {
  const { login } = useShop();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const checks = useMemo(() => getPasswordRuleChecks(form.password), [form.password]);
  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const sendOtp = async () => {
    if (form.password !== form.confirmPassword) {
      Alert.alert("Invalid form", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const users = await loadUsers();
      const exists = users.some(
        (u) => String(u.email || "").trim().toLowerCase() === form.email.trim().toLowerCase()
      );
      if (exists) throw new Error("An account with this email already exists.");
      const otpResult = await sendLoginOtp(form.email.trim());
      Alert.alert("OTP (dev mode)", `Use this code: ${otpResult.otp}`);
      setStep(2);
    } catch (e) {
      Alert.alert("Signup error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await verifyLoginOtp(form.email.trim(), otp.trim());
      const result = await registerUser(form);
      if (!result.ok || !result.user) throw new Error(result.error || "Unable to create account.");
      await login({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role || "customer",
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("OTP error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create Your Account</Text>
      {step === 1 ? (
        <>
          <TextInput style={styles.input} placeholder="Full name" value={form.name} onChangeText={(v) => onChange("name", v)} />
          <TextInput style={styles.input} placeholder="Email address" value={form.email} onChangeText={(v) => onChange("email", v)} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password" value={form.password} onChangeText={(v) => onChange("password", v)} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirm password" value={form.confirmPassword} onChangeText={(v) => onChange("confirmPassword", v)} secureTextEntry />
          <Text style={styles.rule}>- At least 8 characters: {checks.length ? "OK" : "Missing"}</Text>
          <Text style={styles.rule}>- Includes at least one letter: {checks.letter ? "OK" : "Missing"}</Text>
          <Text style={styles.rule}>- Includes at least one number: {checks.number ? "OK" : "Missing"}</Text>
          <Pressable style={styles.btn} onPress={sendOtp} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Sending code..." : "Create Account and Send Code"}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.note}>Enter the 6-digit verification code sent to {form.email}.</Text>
          <TextInput
            style={styles.input}
            placeholder="000000"
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Pressable style={styles.btn} onPress={verifyOtp} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Verifying..." : "Verify and Create Account"}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg, padding: 16 },
  title: { fontSize: 30, fontWeight: "700", color: brand.dark, marginBottom: 14, fontStyle: "italic" },
  input: { borderWidth: 1, borderColor: brand.border, padding: 11, marginBottom: 10, backgroundColor: brand.white },
  rule: { color: brand.textLight, fontSize: 12, marginBottom: 4 },
  note: { color: brand.textLight, marginBottom: 10 },
  btn: { marginTop: 10, backgroundColor: brand.button, paddingVertical: 12 },
  btnText: { color: brand.white, textAlign: "center", fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
});
