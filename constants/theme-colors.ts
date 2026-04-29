/**
 * Cria's themeable accent colors. The picker shows these 10 options;
 * the chosen color is fed into `useMaterial3Theme` as the source color,
 * which derives the full Material 3 palette automatically.
 */
export interface ThemeColorOption {
  id: string;
  name: string;
  color: string;
}

export const THEME_COLORS: ThemeColorOption[] = [
  { id: "amber", name: "Amber", color: "#e9b570" },
  { id: "coral", name: "Coral", color: "#ff7f6e" },
  { id: "rose", name: "Rose", color: "#e63b6c" },
  { id: "lavender", name: "Lavender", color: "#a78bfa" },
  { id: "indigo", name: "Indigo", color: "#5b6cff" },
  { id: "sky", name: "Sky", color: "#4cc9f0" },
  { id: "mint", name: "Mint", color: "#3ddc97" },
  { id: "forest", name: "Forest", color: "#2a9d8f" },
  { id: "sunflower", name: "Sunflower", color: "#f4d35e" },
  { id: "slate", name: "Slate", color: "#7a89a3" },
];

export const DEFAULT_THEME_COLOR = THEME_COLORS[0].color;
