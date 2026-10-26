import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import ScannerScreen from "../screens/ScannerScreen";
import ResultsScreen from "../screens/ResultsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import FishInformationScreen from "../screens/FishInformationScreen";
import AboutScreen from "../screens/AboutScreen";
import { colors } from "../constants/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: ["home", "home-outline"],
  Scan: ["scan-circle", "scan-circle-outline"],
  History: ["time", "time-outline"],
  "Fish Information": ["book", "book-outline"],
  About: ["information-circle", "information-circle-outline"],
};

const TAB_LABELS = {
  "Fish Information": "Guide",
};

function tabIcon(routeName, focused, color, size) {
  const icons = TAB_ICONS[routeName] || ["ellipse", "ellipse-outline"];
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Ionicons
        name={focused ? icons[0] : icons[1]}
        size={focused ? size - 1 : size}
        color={color}
      />
    </View>
  );
}

function tabPressHaptic() {
  Haptics.selectionAsync().catch(() => {});
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenListeners={{ tabPress: tabPressHaptic }}
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: "fade",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedLight,
        tabBarHideOnKeyboard: true,
        tabBarLabel: TAB_LABELS[route.name] || route.name,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) =>
          tabIcon(route.name, focused, color, size),
        tabBarStyle: [
          styles.tabBar,
          route.name === "Scan" ? styles.hiddenTabBar : null,
        ],
        sceneStyle: styles.scene,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Scan"
        component={ScannerScreen}
        options={{ tabBarAccessibilityLabel: "Open the fish scanner" }}
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Fish Information" component={FishInformationScreen} />
      <Tab.Screen name="About" component={AboutScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: styles.scene,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabIcon: {
    width: 46,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconActive: {
    backgroundColor: colors.turquoiseSoft,
  },
  hiddenTabBar: {
    display: "none",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
