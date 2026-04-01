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
  label: string;
  initialOpen?: boolean; // new: controls launch position
  isOpen?: boolean; // new: optional external control
  onOpenChange?: (open: boolean) => void; // new: notify parent of state
}

export default function DraggableSettings({
  children,
  isTimerRunning,
  maxHeight,
  label,
  initialOpen,
  isOpen,
  onOpenChange,
}: Props) {
  const theme = useTheme();

  // 1. Calculations for the "Floor"
  const PANEL_HEIGHT = SCREEN_HEIGHT * maxHeight;
  const MIN_VISIBLE_HEIGHT = 60; // Static: Handle + Title + Padding
  const CLOSED_THRESHOLD = PANEL_HEIGHT - MIN_VISIBLE_HEIGHT;

  const translateY = useSharedValue(
    initialOpen === false ? CLOSED_THRESHOLD : 0,
  );
  const context = useSharedValue(0);

  // 2. Sync: When keyboard opens (maxHeight jumps to 0.8), snap to top
  useEffect(() => {
    if (maxHeight > 0.5) {
      translateY.value = withTiming(0);
      return;
    }
    // If parent is controlling open state, respect it
    if (isOpen !== undefined) {
      translateY.value = withSpring(isOpen ? 0 : CLOSED_THRESHOLD);
      return;
    }
    // Otherwise fall back to timer-based behaviour
    if (isTimerRunning) {
      translateY.value = withSpring(CLOSED_THRESHOLD);
    } else {
      translateY.value = withSpring(0);
    }
  }, [isTimerRunning, isOpen, maxHeight, CLOSED_THRESHOLD]);

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

  const animatedStyle = useAnimatedStyle(() => {
    // Instead of transform, we animate the height that this component
    // actually occupies in the flex layout.
    return {
      // We calculate how much height to "take up" in the parent layout
      // This forces the content above it to move.
      height: PANEL_HEIGHT - translateY.value,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.secondaryContainer,
            overflow: "hidden", // Keeps children from bleeding out bottom
          },
          animatedStyle,
        ]}
      >
        {/* The Drag Handle */}
        <View style={styles.handle} />

        <Text variant="titleMedium" style={styles.title}>
          {label}
        </Text>

        <View style={styles.content}>{children}</View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginHorizontal: 10,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
