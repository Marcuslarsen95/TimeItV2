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
const ITEM_WIDTH = 76;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

// 1. Memoize the wheel so scrolling one doesn't re-render the others
const Wheel = memo(({ values, selectedIndex, onChange }: WheelProps) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // 2. Local state for instant visual feedback (fixes the color flickering)
  const [localIndex, setLocalIndex] = useState(selectedIndex);

  // Sync local state if parent state changes (e.g., reset button)
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
      setLocalIndex(index); // Update color visually while scrolling
    }
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < values.length) {
      onChange(index); // Update parent state only when stopped
    }
  };

  return (
    <View style={styles.wheel}>
      <FlatList
        ref={flatListRef}
        data={values}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16} // Smooth updates
        // 3. Use Header/Footer instead of empty data strings
        ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
        ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={selectedIndex}
        renderItem={({ item, index }) => {
          const isSelected = index === localIndex;
          return (
            <View style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  {
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.onSurface,
                    opacity: isSelected ? 1 : 0.3,
                    fontSize: isSelected ? 28 : 20,
                    fontWeight: isSelected ? "900" : "400",
                    backgroundColor: isSelected
                      ? theme.colors.primary + "16"
                      : "transparent",
                  },
                ]}
              >
                {item}
              </Text>
            </View>
          );
        }}
      />
      {/* Visual selection markers */}
      <View pointerEvents="none" style={styles.indicatorContainer}>
        <View
          style={[
            styles.selectionLine,
            { top: ITEM_HEIGHT, borderColor: theme.colors.primary },
          ]}
        />
        <View
          style={[
            styles.selectionLine,
            { top: ITEM_HEIGHT * 2, borderColor: theme.colors.primary },
          ]}
        />
      </View>
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

  const hours = Math.floor(valueInSeconds / 3600);
  const minutes = Math.floor((valueInSeconds % 3600) / 60);
  const seconds = valueInSeconds % 60;

  // Memoize arrays so they don't recreate on every render
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

  // 4. useCallback prevents child wheels from re-rendering when the parent state updates
  const updateTime = useCallback(
    (h: number, m: number, s: number) => {
      onChange(h * 3600 + m * 60 + s);
    },
    [onChange],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.header]}>{label}</Text>
      <View style={[styles.wheelsContainer]}>
        <View style={[styles.wheelContainer]}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>
            Hours
          </Text>
          <Wheel
            values={hourValues}
            selectedIndex={hours}
            onChange={(i) => updateTime(i, minutes, seconds)}
          />
        </View>
        <Text style={[styles.separator, { color: theme.colors.primary }]}>
          :
        </Text>
        <View style={[styles.wheelContainer]}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>
            Minutes
          </Text>
          <Wheel
            values={sixtyValues}
            selectedIndex={minutes}
            onChange={(i) => updateTime(hours, i, seconds)}
          />
        </View>

        <Text style={[styles.separator, { color: theme.colors.primary }]}>
          :
        </Text>
        <View style={[styles.wheelContainer]}>
          <Text style={[styles.label, { color: theme.colors.primary }]}>
            Seconds
          </Text>
          <Wheel
            values={sixtyValues}
            selectedIndex={seconds}
            onChange={(i) => updateTime(hours, minutes, i)}
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
    gap: 16,
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
  },
  itemText: {
    textAlign: "center",
    width: "100%",
    borderRadius: 5,
  },
  separator: {
    fontSize: 24,
    fontWeight: "900",
    marginHorizontal: 2, // Tighten the space around ":"
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
});
