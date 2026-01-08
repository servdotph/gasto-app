import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";

import { ThemedText } from "@/components/themed-text";

type AuthTextFieldProps = {
  label: string;
  placeholder?: string;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  density?: "default" | "compact";
};

export function AuthTextField({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  density = "default",
}: AuthTextFieldProps) {
  const text = "#000000";
  const labelColor = "#000000";
  const muted = "#6B7280";
  const border = "#111827";
  const primary = "#F8E759";

  const inputRowStyle =
    density === "compact" ? styles.inputRowCompact : styles.inputRow;
  const inputStyle = density === "compact" ? styles.inputCompact : styles.input;
  const fieldStyle = density === "compact" ? styles.fieldCompact : styles.field;
  const labelStyle = density === "compact" ? styles.labelCompact : styles.label;
  const iconSize = density === "compact" ? 18 : 20;

  return (
    <View style={fieldStyle}>
      <ThemedText
        lightColor={labelColor}
        darkColor={labelColor}
        style={labelStyle}
      >
        {label}
      </ThemedText>

      <View style={[inputRowStyle, { borderColor: border }]}>
        {icon ? (
          <View style={styles.iconWrap}>
            <MaterialIcons name={icon} size={iconSize} color={muted} />
          </View>
        ) : null}

        <TextInput
          style={[inputStyle, { color: text }]}
          placeholder={placeholder}
          placeholderTextColor={muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          selectionColor={primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  fieldCompact: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  labelCompact: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 56,
  },
  inputRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 40,
  },
  iconWrap: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  inputCompact: {
    flex: 1,
    fontSize: 12,
  },
});
