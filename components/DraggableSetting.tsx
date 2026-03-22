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
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.3;

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
      // 1. Check if the user "flicked" the panel up or down
      const isFlingingUp = event.velocityY < -500;
      const isFlingingDown = event.velocityY > 500;

      if (isFlingingUp) {
        // If they flicked UP, snap to the top (0)
        translateY.value = withSpring(0);
      } else if (isFlingingDown) {
        // If they flicked DOWN, snap to your "Mini" view (PANEL_HEIGHT - 60)
        translateY.value = withSpring(PANEL_HEIGHT - 60);
      } else {
        // 2. If they moved slowly, snap based on position (the threshold)
        // If it's more than halfway down, close it. Otherwise, open it.
        if (translateY.value > PANEL_HEIGHT / 2) {
          translateY.value = withSpring(PANEL_HEIGHT - 60);
        } else {
          translateY.value = withSpring(0);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: theme.colors.secondaryContainer + "24" },
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
    left: 10,
    right: 10,
    height: PANEL_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 1,
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
  content: {},
});
