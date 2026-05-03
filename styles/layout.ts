import { StyleSheet } from "react-native";

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
  },
  GestureRoot: {
    flex: 1,
    padding: 40,
  },
  mainContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  outerContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    paddingBottom: 40,
    paddingTop: 40,
  },
  container: {
    borderRadius: 15,
    alignItems: "center",
    flex: 1,
    width: "100%",
    maxWidth: 500,
    minHeight: 400,
    justifyContent: "center",
  },

  buttonContainer: {
    padding: 20,
    borderRadius: 15,
    margin: 10,
    alignItems: "center",
    width: "80%",
    maxWidth: 500,
    justifyContent: "space-between",
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
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 10,
    marginBottom: 10,
  },

  flexButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
  },

  primaryButton: {
    flex: 1,
    maxWidth: 300,
    height: 50,
    justifyContent: "center",
    borderRadius: 15,
  },

  secondaryButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    borderRadius: 15,
  },

  footer: {
    width: "80%",
    height: 50,
    maxWidth: 500,
    justifyContent: "center",
  },

  presetModalContainer: {
    margin: 20,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  // text styling

  helperText: {
    opacity: 0.5,
    fontSize: 12,
    textAlign: "center",
  },
});
