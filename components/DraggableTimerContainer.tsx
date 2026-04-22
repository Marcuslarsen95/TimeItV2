import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Height of the collapsed "pill" bar
const COLLAPSED_HEIGHT = 42;

interface Props {
  children: React.ReactNode;
  isTimerRunning: boolean;
  maxHeight: number; // 0–1, fraction of screen height
  label: string;
  collapsedLabel?: string;
  initialOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function DraggableSettings({
  children,
  isTimerRunning,
  maxHeight,
  label,
  collapsedLabel = "Open time settings",
  initialOpen,
  isOpen,
  onOpenChange,
}: Props) {
  const theme = useTheme();

  const PANEL_HEIGHT = SCREEN_HEIGHT * maxHeight;
  const COLLAPSED_WIDTH = 200; // Fixed width in pixels for the "pill"
  const FULL_WIDTH = Dimensions.get("window").width * 0.9; // 95% of screen

  const context = useSharedValue(0);

  // Animate the visible height: PANEL_HEIGHT = fully open, COLLAPSED_HEIGHT = folded
  const visibleHeight = useSharedValue(
    initialOpen === false ? COLLAPSED_HEIGHT : PANEL_HEIGHT,
  );

  const isCollapsed = useSharedValue(initialOpen === false);

  const snapOpen = () => {
    "worklet";
    visibleHeight.value = withTiming(PANEL_HEIGHT, { duration: 300 });
    isCollapsed.value = false;
  };

  const snapClosed = () => {
    "worklet";
    visibleHeight.value = withTiming(COLLAPSED_HEIGHT, { duration: 300 });
    isCollapsed.value = true;
  };

  // Sync with external controls / timer state
  useEffect(() => {
    if (isOpen !== undefined) {
      if (isOpen) snapOpen();
      else snapClosed();
      return;
    }
    if (isTimerRunning) snapClosed();
    else snapOpen();
  }, [isTimerRunning, isOpen, PANEL_HEIGHT]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = visibleHeight.value;
    })
    .onUpdate((e) => {
      // Dragging up increases height, dragging down decreases it
      const next = context.value - e.translationY;
      visibleHeight.value = Math.max(
        COLLAPSED_HEIGHT,
        Math.min(next, PANEL_HEIGHT),
      );
    })
    .onEnd((e) => {
      const flingingUp = e.velocityY < -500;
      const flingingDown = e.velocityY > 500;

      if (flingingUp || visibleHeight.value > PANEL_HEIGHT / 2) {
        snapOpen();
      } else if (flingingDown || visibleHeight.value <= PANEL_HEIGHT / 2) {
        snapClosed();
      }
    });

  // Tap the handle bar to toggle
  const tapGesture = Gesture.Tap().onEnd(() => {
    if (isCollapsed.value) snapOpen();
    else snapClosed();
  });

  const combinedGesture = Gesture.Exclusive(gesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    // Calculate progress (0 = closed, 1 = fully open)
    const progress =
      (visibleHeight.value - COLLAPSED_HEIGHT) /
      (PANEL_HEIGHT - COLLAPSED_HEIGHT);
    const clampedProgress = Math.max(0, Math.min(progress, 1));

    return {
      height: visibleHeight.value,
      // Interpolate width from 200 to Full Width
      width: COLLAPSED_WIDTH + (FULL_WIDTH - COLLAPSED_WIDTH) * clampedProgress,
      // Smoothly adjust borderRadius so it looks more like a pill when small
      borderRadius: isCollapsed.value ? 32 : 24,
      // Center it horizontally
      alignSelf: "center",
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const opacity =
      (visibleHeight.value - COLLAPSED_HEIGHT) /
      (PANEL_HEIGHT - COLLAPSED_HEIGHT);
    return {
      opacity: Math.max(0, Math.min(opacity, 1)),
    };
  });

  const collapsedLabelStyle = useAnimatedStyle(() => {
    const opacity =
      1 -
      (visibleHeight.value - COLLAPSED_HEIGHT) /
        (PANEL_HEIGHT - COLLAPSED_HEIGHT);
    return {
      opacity: Math.max(0, Math.min(opacity, 1)),
      transform: [{ translateY: withTiming(isCollapsed.value ? 0 : 10) }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        // { backgroundColor: theme.colors.primary + "16" },
        animatedStyle,
      ]}
    >
      {/* ONLY the handleArea is draggable/tappable */}
      <GestureDetector gesture={combinedGesture}>
        <View style={[styles.handleArea]}>
          {/* <View style={styles.handle} /> */}
          <Animated.Text
            style={[
              styles.collapsedLabel,
              { color: theme.colors.onSecondaryContainer },
              collapsedLabelStyle,
            ]}
          >
            {collapsedLabel}
          </Animated.Text>
        </View>
      </GestureDetector>

      {/* The content is now OUTSIDE the GestureDetector, so its touches work */}
      <Animated.View style={[styles.content, contentStyle]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    borderRadius: 32,
    overflow: "hidden",
    width: "100%",
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  handleArea: {
    height: COLLAPSED_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#00000033",
    borderRadius: 10,
    position: "absolute",
    top: 8,
  },
  collapsedLabel: {
    fontSize: 13,
    fontWeight: "600",
    position: "absolute",
    bottom: 12,
  },
  title: {
    alignSelf: "center",
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
});
