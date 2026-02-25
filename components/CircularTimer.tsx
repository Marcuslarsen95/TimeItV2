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

export default function CircularTimer({
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

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Glow filter */}
          <Filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="15" />
          </Filter>

          {/* Gradient stroke */}
          <LinearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientColors.map((color: string, index: number) => (
              <Stop
                key={index}
                offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>
        </Defs>

        {/* Glow circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={gradientColors[0]}
          strokeWidth={strokeWidth * 1.5}
          fill="none"
          filter="url(#glowBlur)"
          opacity={0.35}
        />

        {/* Gradient circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#timerGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.75}
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
