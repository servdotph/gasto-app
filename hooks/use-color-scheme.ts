import type { ColorSchemeName } from "react-native";

export function useColorScheme(): ColorSchemeName {
  // Force light mode app-wide, but keep the type broad enough
  // to avoid TS errors in code paths that still check for "dark".
  return "light";
}
