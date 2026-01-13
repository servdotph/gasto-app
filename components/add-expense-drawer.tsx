import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { addExpense, parseAmount } from "@/lib/expenses-store";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AddExpenseDrawer({ visible, onClose }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const translateY = useRef(new Animated.Value(0)).current;

  const sheetHeight = 520;

  const startY = useMemo(() => sheetHeight + 40, [sheetHeight]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(startY);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [startY, translateY, visible]);

  function close() {
    Animated.timing(translateY, {
      toValue: startY,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }

  function onSubmit() {
    addExpense({
      description,
      amount: parseAmount(amount),
      dateLabel: date,
    });
    setDescription("");
    setAmount("");
    setDate("");
    close();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={close} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.primary,
              transform: [{ translateY }],
              height: sheetHeight,
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={styles.titleRow}>
              <MaterialIcons name="add" size={28} color={themeColors.text} />
              <ThemedText style={styles.title}>Add Expense</ThemedText>
            </View>

            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <MaterialIcons name="close" size={20} color={themeColors.text} />
            </Pressable>
          </View>

          <ThemedText style={styles.subtitle}>
            ML auto-categorizes your expenses
          </ThemedText>

          <View style={styles.form}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g, coffee at Starbucks"
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.inputBackground,
                  color: themeColors.text,
                  borderColor: "rgba(0,0,0,0.25)",
                },
              ]}
            />

            <ThemedText style={styles.label}>Amount</ThemedText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="$23.2"
              placeholderTextColor="rgba(0,0,0,0.45)"
              keyboardType="decimal-pad"
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.inputBackground,
                  color: themeColors.text,
                  borderColor: "rgba(0,0,0,0.25)",
                },
              ]}
            />

            <ThemedText style={styles.label}>Date</ThemedText>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="Jan/02/2026"
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.inputBackground,
                  color: themeColors.text,
                  borderColor: "rgba(0,0,0,0.25)",
                },
              ]}
            />

            <Pressable
              onPress={onSubmit}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.submit,
                {
                  backgroundColor: themeColors.text,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemedText
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.submitText, { color: themeColors.primary }]}
              >
                Add Expenses
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(0,0,0,0.7)",
  },
  form: {
    marginTop: 26,
    gap: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(0,0,0,0.85)",
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  submit: {
    marginTop: 14,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    minWidth: 180,
    paddingHorizontal: 18,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "900",
  },
});
