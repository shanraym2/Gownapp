import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { brand } from "../theme/brand";
import { useShop } from "../context/ShopContext";
import { HomeScreen } from "../screens/HomeScreen";
import { GownsScreen } from "../screens/GownsScreen";
import { CartScreen } from "../screens/CartScreen";
import { ARTryOnScreen } from "../screens/ARTryOnScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AdminPanelScreen } from "../screens/AdminPanelScreen";
import { GownDetailScreen } from "../screens/GownDetailScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { MyOrdersScreen } from "../screens/MyOrdersScreen";
import { ContactScreen } from "../screens/ContactScreen";
import { AdminOrdersScreen } from "../screens/AdminOrdersScreen";
import { AdminGownsScreen } from "../screens/AdminGownsScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function TabsNavigator() {
  const { user } = useShop();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: brand.dark,
        tabBarInactiveTintColor: brand.textLight,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Home") {
            return <Ionicons name="home" size={size} color={color} />;
          }
          if (route.name === "AR Try-On") {
            return <MaterialCommunityIcons name="face-man-shimmer" size={size} color={color} />;
          }
          if (route.name === "Favorites") {
            return <Ionicons name="heart" size={size} color={color} />;
          }
          if (route.name === "Admin") {
            return <Ionicons name="shield" size={size} color={color} />;
          }
          return <Ionicons name="person" size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="AR Try-On" component={ARTryOnScreen} />
      <Tabs.Screen name="Favorites" component={FavoritesScreen} />
      {isAdmin ? <Tabs.Screen name="Admin" component={AdminPanelScreen} /> : null}
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Gowns" component={GownsScreen} options={{ title: "Bridal Gowns & Dresses" }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Your Cart" }} />
        <Stack.Screen name="GownDetail" component={GownDetailScreen} options={{ title: "Gown Details" }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Forgot Password" }} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: "My Orders" }} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ title: "Admin • Orders" }} />
        <Stack.Screen name="AdminGowns" component={AdminGownsScreen} options={{ title: "Admin • Gowns" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
