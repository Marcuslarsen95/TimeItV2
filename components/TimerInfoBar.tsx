import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import InfoPill from "@/components/InfoPill";
import Ionicons from "@expo/vector-icons/Ionicons";

interface IntervalSegment {
  id: number;
  name: string;
  durationSecs: number;
}

interface CountdownProps {
  type: "countdown";
  durationSecs: number;
}

interface IntervalProps {
  type: "interval";
  segments: IntervalSegment[];
  currentInterval?: string;
  isRunning?: boolean;
  repeatCount?: number;
}

interface RandomProps {
  type: "random";
  minSecs: number;
  maxSecs: number;
}

type Props = CountdownProps | IntervalProps | RandomProps;

const formatShort = (secs: number) => {
  if (!secs || secs <= 0) return "0s";

  // Force everything to integers immediately
  const totalSeconds = Math.floor(secs);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);

  // Check against the floored integer
  if (s > 0 || parts.length === 0) {
    parts.push(`${s}s`);
  }

  return parts.join(" ");
};

export default function TimerInfoBar(props: Props) {
  const theme = useTheme();

  if (props.type === "countdown") {
    const formattedTime = formatShort(props.durationSecs);

    return (
      <View
        style={{
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 8, // Just enough to prevent clipping
          marginTop: 4, // Slight gap from buttons
        }}
      >
        <Text
          variant="labelMedium" // More robust than labelSmall
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: theme.colors.onSurface,
            textAlign: "center",
            opacity: 0.8, // Optional: gives it that "sub-label" look
          }}
        >
          {`Timer ${formattedTime}`}
        </Text>
      </View>
    );
  }

  if (props.type === "random") {
    const minFormatted = formatShort(props.minSecs);
    const maxFormatted = formatShort(props.maxSecs);

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <Text variant="labelSmall" style={{ color: theme.colors.onSurface }}>
          {`Somewhere between ${minFormatted} and ${maxFormatted}`}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        marginTop: 12,
        gap: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {props.segments.map((i, index) => {
          const isActive = i.durationSecs > 0;
          const isCurrentlyRunning =
            props.currentInterval?.toLowerCase() === i.name.toLowerCase() &&
            props.isRunning;
          return (
            <React.Fragment key={i.id}>
              <Text
                variant="labelSmall"
                style={{
                  minWidth: 50,
                  fontSize: 12,
                  textAlign: "center",
                  color: isCurrentlyRunning
                    ? theme.colors.primary
                    : isActive
                      ? theme.colors.onSurface
                      : theme.colors.onSurfaceDisabled,
                  fontWeight: isCurrentlyRunning ? "700" : "400",
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {i.name} {isActive ? formatShort(i.durationSecs) : "OFF"}
              </Text>
              {index < props.segments.length - 1 && (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline, marginHorizontal: 6 }}
                >
                  |
                </Text>
              )}
            </React.Fragment>
          );
        })}
      </View>

      <InfoPill
        icon={
          <Ionicons
            name="repeat"
            size={14}
            color={theme.colors.onSurfaceVariant}
          />
        }
        label={`${props.repeatCount}`}
      />
    </View>
  );
}
