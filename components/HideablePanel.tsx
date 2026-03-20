import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.5; // Takes up half the screen

interface Props {
  children: React.ReactNode;
  isTimerRunning: boolean;
}

export default function DraggableSettings({ children, isTimerRunning }: Props) {
  const theme = useTheme();
  const translateY = useSharedValue(0);
  const context = useSharedValue(0);

  // 1. Gesture Logic
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      // Allow dragging down, but resist dragging up past the limit
      translateY.value = Math.max(0, event.translationY + context.value);
    })
    .onEnd((event) => {
      if (translateY.value > PANEL_HEIGHT / 3 || event.velocityY > 500) {
        translateY.value = withSpring(PANEL_HEIGHT - 60); // Snap to "Mini" view
      } else {
        translateY.value = withSpring(0); // Snap to "Full" view
      }
    });

  // 2. Auto-hide when timer starts
  useEffect(() => {
    if (isTimerRunning) {
      translateY.value = withTiming(PANEL_HEIGHT); // Hide completely
    } else {
      translateY.value = withSpring(0); // Show when stopped
    }
  }, [isTimerRunning]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: theme.colors.surfaceVariant + "55", opacity: 0.5 },
          animatedStyle,
        ]}
      >
        {/* The Drag Handle */}
        <View style={styles.handle} />

        <Text variant="titleMedium" style={styles.title}>
          Interval Settings
        </Text>

        <View style={styles.content}>{children}</View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 5, // Shadow for Android
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#00000033",
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 12,
  },
  title: {
    alignSelf: "center",
    marginTop: 10,
    opacity: 0.6,
  },
  content: {
    marginTop: 20,
  },
});
