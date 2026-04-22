import React, { useRef, useState, useCallback, useEffect, memo } from "react";
import {
  View,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  FlatList,
} from "react-native";
import { Text, useTheme } from "react-native-paper";

const ITEM_HEIGHT = 40;
const ITEM_WIDTH = 58;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

const Wheel = memo(({ values, selectedIndex, onChange }: WheelProps) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [localIndex, setLocalIndex] = useState(selectedIndex);

  useEffect(() => {
    setLocalIndex(selectedIndex);
    flatListRef.current?.scrollToIndex({
      index: selectedIndex,
      animated: true,
    });
  }, [selectedIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < values.length && index !== localIndex) {
      setLocalIndex(index);
    }
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < values.length) {
      onChange(index);
    }
  };

  return (
    <View style={[styles.wheel]}>
      <View
        pointerEvents="none"
        style={[
          styles.pill,
          {
            top: ITEM_HEIGHT,
            borderWidth: 0,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: ITEM_HEIGHT,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: theme.colors.primary,
          zIndex: 1,
        }}
      />
      <FlatList
        ref={flatListRef}
        data={values}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
        ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={selectedIndex}
        renderItem={({ item, index }) => {
          const distance = index - localIndex;
          const isSelected = distance === 0;
          const angleDeg = Math.max(-60, Math.min(60, distance * 25));
          const angleRad = (angleDeg * Math.PI) / 180;
          const scaleY = Math.cos(angleRad);
          const opacity = isSelected
            ? 1
            : Math.abs(distance) === 1
              ? 0.4
              : 0.15;

          return (
            <View
              style={[
                styles.item,
                {
                  transform: [
                    { scaleY: isSelected ? scaleY : scaleY * 0.9 },
                    { scaleX: isSelected ? 1 : 0.95 },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.itemText,
                  {
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.secondary,
                    fontSize: isSelected ? 26 : 18,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {item}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
});

Wheel.displayName = "Wheel";

interface Props {
  label?: string;
  valueInSeconds: number;
  onChange: (totalSeconds: number) => void;
  maxHours?: number;
}

export default function TimeWheelPicker({
  label,
  valueInSeconds,
  onChange,
  maxHours = 9,
}: Props) {
  const theme = useTheme();

  const valueInSecondsRef = useRef(valueInSeconds);
  useEffect(() => {
    valueInSecondsRef.current = valueInSeconds;
  }, [valueInSeconds]);

  const hours = Math.floor(valueInSeconds / 3600);
  const minutes = Math.floor((valueInSeconds % 3600) / 60);
  const seconds = valueInSeconds % 60;

  const hourValues = React.useMemo(
    () =>
      Array.from({ length: maxHours + 1 }, (_, i) =>
        i.toString().padStart(2, "0"),
      ),
    [maxHours],
  );
  const sixtyValues = React.useMemo(
    () => Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")),
    [],
  );

  const onHoursChange = useCallback(
    (newH: number) => {
      // Use the prop directly. This ensures the calculation always
      // has the "truth" from the parent state.
      const m = Math.floor((valueInSeconds % 3600) / 60);
      const s = valueInSeconds % 60;
      onChange(newH * 3600 + m * 60 + s);
    },
    [valueInSeconds, onChange], // Add valueInSeconds to dependencies
  );

  const onMinutesChange = useCallback(
    (newM: number) => {
      const h = Math.floor(valueInSeconds / 3600);
      const s = valueInSeconds % 60;
      onChange(h * 3600 + newM * 60 + s);
    },
    [valueInSeconds, onChange], // Add valueInSeconds to dependencies
  );

  const onSecondsChange = useCallback(
    (newS: number) => {
      const h = Math.floor(valueInSeconds / 3600);
      const m = Math.floor((valueInSeconds % 3600) / 60);
      onChange(h * 3600 + m * 60 + newS);
    },
    [valueInSeconds, onChange], // Add valueInSeconds to dependencies
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.header}>{label}</Text>}
      <View style={[styles.wheelsContainer]}>
        <View style={styles.wheelContainer}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>
            Hours
          </Text>

          <Wheel
            values={hourValues}
            selectedIndex={hours}
            onChange={onHoursChange}
          />
        </View>
        <Text style={[styles.separator, { color: theme.colors.primary }]}>
          :
        </Text>
        <View style={styles.wheelContainer}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>
            Minutes
          </Text>

          <Wheel
            values={sixtyValues}
            selectedIndex={minutes}
            onChange={onMinutesChange}
          />
        </View>
        <Text style={[styles.separator, { color: theme.colors.primary }]}>
          :
        </Text>
        <View style={styles.wheelContainer}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>
            Seconds
          </Text>

          <Wheel
            values={sixtyValues}
            selectedIndex={seconds}
            onChange={onSecondsChange}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 16,
    opacity: 0.6,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    opacity: 0.8,
  },
  wheelsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
  },
  wheelContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  wheel: {
    height: PICKER_HEIGHT,
    width: ITEM_WIDTH,
    overflow: "hidden",
  },
  item: {
    height: ITEM_HEIGHT,
    width: ITEM_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  itemText: {
    textAlign: "center",
    width: "100%",
    borderRadius: 5,
  },
  separator: {
    fontSize: 24,
    fontWeight: "900",
    marginHorizontal: 2,
    paddingTop: 12,
  },
  indicatorContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  selectionLine: {
    position: "absolute",
    left: 10,
    right: 10,
    borderTopWidth: 1,
  },
  pill: {
    position: "absolute",
    left: 6,
    right: 6,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    borderWidth: 0.5,
    zIndex: 0,
  },
});
