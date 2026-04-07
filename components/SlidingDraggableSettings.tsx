import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  children: React.ReactNode;
  isTimerRunning: boolean;
  maxWidth?: number;
  label: string;
  initialOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function DraggableSettingsSide({
  children,
  isTimerRunning,
  maxWidth = 0.8,
  label,
  initialOpen,
  isOpen,
  onOpenChange,
}: Props) {
  const theme = useTheme();

  const PANEL_WIDTH = SCREEN_WIDTH * maxWidth;
  const MIN_VISIBLE_WIDTH = 0; // fully hidden when closed
  const CLOSED_THRESHOLD = PANEL_WIDTH;

  const translateX = useSharedValue(
    initialOpen === false ? CLOSED_THRESHOLD : 0,
  );
  const context = useSharedValue(0);

  useEffect(() => {
    if (isOpen !== undefined) {
      translateX.value = withSpring(isOpen ? 0 : CLOSED_THRESHOLD);
      return;
    }
    if (isTimerRunning) {
      translateX.value = withSpring(CLOSED_THRESHOLD);
    } else {
      translateX.value = withSpring(0);
    }
  }, [isTimerRunning, isOpen, CLOSED_THRESHOLD]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateX.value;
    })
    .onUpdate((event) => {
      const nextValue = event.translationX + context.value;
      translateX.value = Math.max(0, Math.min(nextValue, CLOSED_THRESHOLD));
    })
    .onEnd((event) => {
      const isFlingingLeft = event.velocityX < -500;
      const isFlingingRight = event.velocityX > 500;

      if (isFlingingLeft) {
        translateX.value = withSpring(0);
      } else if (isFlingingRight) {
        translateX.value = withSpring(CLOSED_THRESHOLD);
      } else {
        if (translateX.value > CLOSED_THRESHOLD / 2) {
          translateX.value = withSpring(CLOSED_THRESHOLD);
        } else {
          translateX.value = withSpring(0);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Backdrop — tapping outside closes the panel
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - translateX.value / CLOSED_THRESHOLD,
    pointerEvents: translateX.value < CLOSED_THRESHOLD ? "auto" : "none",
  }));

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.3)", zIndex: 10 },
          backdropStyle,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            translateX.value = withSpring(CLOSED_THRESHOLD);
            onOpenChange?.(false);
          }}
        />
      </Animated.View>

      {/* Panel */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.secondaryContainer,
              width: PANEL_WIDTH,
              right: 0,
              zIndex: 11,
            },
            animatedStyle,
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handle} />

          <Text variant="titleMedium" style={styles.title}>
            {label}
          </Text>

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 60,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
  },
  handle: {
    width: 5,
    height: 40,
    backgroundColor: "#00000033",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    alignSelf: "center",
    marginBottom: 10,
    opacity: 0.6,
  },
  content: {},
});
