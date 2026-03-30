import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { sendLoginOtp, verifyLoginOtp } from "../services/auth";
import { resetUserPassword } from "../services/authLocal";
import { brand } from "../theme/brand";

export function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sendOtp = async () => {
    setLoading(true);
    try {
      const otpResult = await sendLoginOtp(email.trim());
      Alert.alert("OTP (dev mode)", `Use this code: ${otpResult.otp}`);
      setStep(2);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await verifyLoginOtp(email.trim(), otp.trim());
      setStep(3);
    } catch (e) {
      Alert.alert("OTP error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await resetUserPassword({ email: email.trim(), password });
      if (!result.ok) throw new Error(result.error || "Could not reset password.");
      Alert.alert("Success", "Password reset complete.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Reset failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Reset Your Password</Text>
      {step === 1 && (
        <>
          <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Pressable style={styles.btn} onPress={sendOtp} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Sending code..." : "Send Verification Code"}</Text>
          </Pressable>
        </>
      )}
      {step === 2 && (
        <>
          <TextInput style={styles.input} placeholder="000000" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, ""))} maxLength={6} keyboardType="number-pad" />
          <Pressable style={styles.btn} onPress={verifyOtp} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Verifying..." : "Verify Code"}</Text>
          </Pressable>
        </>
      )}
      {step === 3 && (
        <>
          <TextInput style={styles.input} placeholder="New password" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <Pressable style={styles.btn} onPress={resetPassword} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Saving..." : "Update Password"}</Text>
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
  btn: { marginTop: 10, backgroundColor: brand.button, paddingVertical: 12 },
  btnText: { color: brand.white, textAlign: "center", fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
});
