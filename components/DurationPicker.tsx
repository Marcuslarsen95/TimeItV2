import {
  StyleSheet,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Text, Surface, TextInput } from "react-native-paper";
import React, { useState } from "react";

interface Props {
  label: string;
  onTimeChange: (totalSeconds: number) => void;
  initialValue: number;
}

const DurationPicker = ({ label, onTimeChange, initialValue = 0 }: Props) => {
  // Convert initialValue (ms) into formatted strings for the inputs
  const initialHours = Math.floor(initialValue / 3600000);
  const initialMinutes = Math.floor((initialValue % 3600000) / 60000);
  const initialSeconds = Math.floor((initialValue % 60000) / 1000);

  const [hours, setHours] = useState(String(initialHours).padStart(2, "0"));
  const [minutes, setMinutes] = useState(
    String(initialMinutes).padStart(2, "0"),
  );
  const [seconds, setSeconds] = useState(
    String(initialSeconds).padStart(2, "0"),
  );

  const handleTimeChange = (
    text: string,
    setter: (val: string) => void,
    limit: number,
  ) => {
    // 1. Only allow digits
    let numericValue = text.replace(/[^0-9]/g, "");

    // 2. If user clears the field, let it be empty
    if (numericValue === "") {
      setter("");
      return;
    }

    // 3. Keep only the last 2 digits entered (allows overwriting)
    if (numericValue.length > 2) {
      numericValue = numericValue.slice(-2);
    }

    // 4. Validate against the limit
    const num = parseInt(numericValue, 10);
    if (num <= limit) {
      setter(numericValue);
    }
  };

  // Make it look nice when you unfocus the field
  const handleBlur = (value: string, setter: (val: string) => void) => {
    if (value === "") setter("00");
    else setter(value.padStart(2, "0"));
  };

  React.useEffect(() => {
    // convert all time strings to numbers and default to 0 if no value
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;

    const totalMilliSeconds = h * 3600000 + m * 60000 + s * 1000;

    onTimeChange(totalMilliSeconds);
  }, [hours, minutes, seconds]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.outerContainer}>
        <Text variant="titleMedium" style={styles.label}>
          {label}
        </Text>

        <View style={styles.pickerRow}>
          <TextInput
            label="Hours"
            value={hours.toString()}
            onChangeText={(t) => handleTimeChange(t, setHours, 23)}
            selectTextOnFocus={true}
            style={styles.numbersInput}
            keyboardType="number-pad"
            onBlur={() => handleBlur(hours, setHours)}
          />
          <TextInput
            label="Minutes"
            value={minutes.toString()}
            onChangeText={(t) => handleTimeChange(t, setMinutes, 59)}
            style={styles.numbersInput}
            keyboardType="number-pad"
            onBlur={() => handleBlur(minutes, setMinutes)}
          />
          <TextInput
            label="Seconds"
            value={seconds.toString()}
            onChangeText={(t) => handleTimeChange(t, setSeconds, 59)}
            style={styles.numbersInput}
            keyboardType="number-pad"
            onBlur={() => handleBlur(seconds, setSeconds)}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default DurationPicker;

const styles = StyleSheet.create({
  outerContainer: {
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  label: { alignSelf: "flex-start", opacity: 0.6 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    width: "100%",
    gap: 6,
  },
  numbersInput: {
    backgroundColor: "transparent",
    width: 50,
  },
});
