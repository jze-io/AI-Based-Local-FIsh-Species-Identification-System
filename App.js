import React, { useCallback, useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Asset } from "expo-asset";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./navigation/AppNavigator";
import LoadingScreen from "./components/LoadingScreen";
import { colors } from "./constants/theme";

/** Keep the branded screen visible briefly so it does not flash on fast loads. */
const MIN_BOOT_MS = 2400;

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.white,
    text: colors.ink,
    border: colors.border,
    notification: colors.turquoise,
  },
};

// Hold the native splash until the branded screen is laid out.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [fade] = useState(() => new Animated.Value(1));

  const handleLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    const startedAt = Date.now();

    (async () => {
      const preload = Asset.loadAsync([
        require("./assets/ofishx-mark-teal.png"),
      ]).catch(() => {});

      // Never let a slow preload trap the app on the launch screen.
      await Promise.race([
        preload,
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);

      const remaining = Math.max(0, MIN_BOOT_MS - (Date.now() - startedAt));
      setTimeout(() => {
        if (mounted) {
          setReady(true);
        }
      }, remaining);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    Animated.timing(fade, {
      toValue: 0,
      duration: 420,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setHidden(true);
      }
    });
  }, [ready, fade]);

  return (
    <SafeAreaProvider>
      <StatusBar style={hidden ? "dark" : "light"} />
      <View style={styles.root}>
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator />
        </NavigationContainer>

        {hidden ? null : (
          <Animated.View
            pointerEvents={ready ? "none" : "auto"}
            style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fade }]}
          >
            <LoadingScreen onLayout={handleLayout} />
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    backgroundColor: colors.primaryDark,
  },
});
