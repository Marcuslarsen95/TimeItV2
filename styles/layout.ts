import { StyleSheet } from "react-native";

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: 16,
  },
  container: {
    borderRadius: 15,
    alignItems: "center",
    flex: 1,
    width: "100%",
    // Force it to stay wide regardless of content
    maxWidth: 500, // Optional: keeps it from looking too stretched on tablets
    minHeight: 400, // Sets a "floor" for the height so it doesn't jump
    justifyContent: "center", // Spreads content out inside the card
  },

  buttonContainer: {
    padding: 20,
    borderRadius: 15,
    margin: 10,
    alignItems: "center",
    width: "80%", // Force it to stay wide regardless of content
    maxWidth: 500, // Optional: keeps it from looking too stretched on tablets
    justifyContent: "space-between", // Spreads content out inside the card
  },

  timerSurface: {
    padding: 20,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },

  marginBottom: {
    marginBottom: 10,
  },

  buttonRow: {
    flexDirection: "row", // Alignment: Horizontal
    justifyContent: "center",
    width: "100%",
    gap: 10, // Space between buttons
    marginBottom: 10,
  },

  flexButton: {
    flex: 1,
    height: 45,
    justifyContent: "center",
  },

  primaryButton: {
    flex: 1,
    height: 60,
    justifyContent: "center",
    borderRadius: 15,
  },

  secondaryButton: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    borderRadius: 15,
  },

  footer: {
    width: "80%",
    height: 50,
    maxWidth: 500,
    justifyContent: "center",
  },
});
