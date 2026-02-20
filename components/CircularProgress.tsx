import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useTheme } from "react-native-paper";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Filter,
  FeGaussianBlur,
} from "react-native-svg";
import Animated, { useAnimatedProps } from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularProgress({
  progress, // shared value (0 → 1)
  radius,
  strokeWidth,
  gradientColors = [],
  text,
}: any) {
  const theme = useTheme();

  const glowPadding = 40;

  const size = useMemo(
    () => (radius + strokeWidth) * 2 + glowPadding,
    [radius, strokeWidth],
  );

  const center = size / 2;

  const circumference = useMemo(() => radius * 2 * Math.PI, [radius]);

  const animatedProgressProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - progress.value * circumference,
  }));

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradientColors[0]} />
            <Stop offset="100%" stopColor={gradientColors[1]} />
          </LinearGradient>

          <LinearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity={0.6} />
            <Stop
              offset="100%"
              stopColor={gradientColors[1]}
              stopOpacity={0.6}
            />
          </LinearGradient>

          <Filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="12" />
          </Filter>
          <Filter id="bgGlowblur" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="6" />
          </Filter>
        </Defs>

        {/* Blurry background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={gradientColors[0]}
          strokeWidth={strokeWidth * 0.8}
          fill="none"
          filter="#glowBlur"
          opacity={0.25}
        />

        {/* Sharp progress ring */}
        <AnimatedCircle
          animatedProps={animatedProgressProps}
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#grad)"
          opacity={0.75}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      <Text
        style={{
          position: "absolute",
          fontSize: 32,
          fontWeight: "700",
          color: theme.colors.onSurface,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
