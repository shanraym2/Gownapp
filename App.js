import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ShopProvider } from "./src/context/ShopContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ShopProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </ShopProvider>
    </SafeAreaProvider>
  );
}
