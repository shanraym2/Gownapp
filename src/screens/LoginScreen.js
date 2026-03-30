import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { sendLoginOtp, verifyLoginOtp } from "../services/auth";
import { useShop } from "../context/ShopContext";
import { verifyLoginCredentials } from "../services/authLocal";
import { brand } from "../theme/brand";

export function LoginScreen({ navigation }) {
  const { login } = useShop();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const onSendOtp = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const check = await verifyLoginCredentials({ email: email.trim(), password });
      if (!check.ok) throw new Error(check.error || "Invalid email or password.");
      const otpResult = await sendLoginOtp(email.trim());
      Alert.alert("OTP (dev mode)", `Use this code: ${otpResult.otp}`);
      setStep(2);
    } catch (e) {
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await verifyLoginOtp(email.trim(), otp.trim());
      const check = await verifyLoginCredentials({ email: email.trim(), password });
      if (!check.ok || !check.user) throw new Error("Login failed");
      await login({
        id: check.user.id,
        name: check.user.name,
        email: check.user.email,
        role: check.user.role || "customer",
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Invalid code", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Welcome Back</Text>
      {step === 1 ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable style={styles.btn} onPress={onSendOtp} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Sending code..." : "Continue with OTP"}</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.note}>Enter the 6-digit verification code sent to {email}.</Text>
          <TextInput
            style={styles.input}
            placeholder="000000"
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, ""))}
            maxLength={6}
            keyboardType="number-pad"
          />
          <Pressable style={styles.btn} onPress={onVerify} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Verifying..." : "Verify and Sign In"}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg, padding: 16 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 14, color: brand.dark, fontStyle: "italic" },
  input: { borderWidth: 1, borderColor: brand.border, padding: 11, marginBottom: 10, backgroundColor: brand.white },
  btn: { backgroundColor: brand.button, paddingVertical: 12 },
  btnText: { color: brand.white, textAlign: "center", fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
  note: { color: brand.textLight, marginBottom: 8 },
  linkBtn: { marginTop: 12 },
  linkText: { color: brand.buttonAlt, fontWeight: "700", letterSpacing: 0.6, fontSize: 12 },
});
