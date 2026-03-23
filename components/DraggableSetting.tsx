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

interface Props {
  children: React.ReactNode;
  isTimerRunning: boolean;
  maxHeight: number;
}

export default function DraggableSettings({
  children,
  isTimerRunning,
  maxHeight,
}: Props) {
  const theme = useTheme();

  // 1. Calculations for the "Floor"
  const PANEL_HEIGHT = SCREEN_HEIGHT * maxHeight;
  const MIN_VISIBLE_HEIGHT = 60; // Static: Handle + Title + Padding
  const CLOSED_THRESHOLD = PANEL_HEIGHT - MIN_VISIBLE_HEIGHT;

  const translateY = useSharedValue(0);
  const context = useSharedValue(0);

  // 2. Sync: When keyboard opens (maxHeight jumps to 0.8), snap to top
  useEffect(() => {
    if (maxHeight > 0.5) {
      translateY.value = withTiming(0);
    }
  }, [maxHeight]);

  // 3. Gesture Logic with Clamping
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextValue = event.translationY + context.value;

      // CLAMP: Stops at 0 (top) and CLOSED_THRESHOLD (bottom)
      translateY.value = Math.max(0, Math.min(nextValue, CLOSED_THRESHOLD));
    })
    .onEnd((event) => {
      const isFlingingUp = event.velocityY < -500;
      const isFlingingDown = event.velocityY > 500;

      if (isFlingingUp) {
        translateY.value = withSpring(0);
      } else if (isFlingingDown) {
        translateY.value = withSpring(CLOSED_THRESHOLD);
      } else {
        // Snap based on position
        if (translateY.value > CLOSED_THRESHOLD / 2) {
          translateY.value = withSpring(CLOSED_THRESHOLD);
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
          {
            height: PANEL_HEIGHT,
            top: SCREEN_HEIGHT - PANEL_HEIGHT,
            backgroundColor: theme.colors.elevation.level2,
            zIndex: 10,
          },
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
    left: 10,
    right: 10,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginTop: 10,
  },
});
