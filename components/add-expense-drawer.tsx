import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { EXPENSE_CATEGORIES } from "@/constants/expense-categories";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    addExpense,
    formatCurrencyInputPHP,
    normalizeAmountInput,
    parseAmount,
} from "@/lib/expenses-store";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AddExpenseDrawer({ visible, onClose }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const [description, setDescription] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [category, setCategory] = useState<string>("");

  const [showCategoryList, setShowCategoryList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;

  const windowHeight = Dimensions.get("window").height;
  const sheetHeight = Math.min(560, Math.max(460, Math.floor(windowHeight * 0.85)));

  const startY = useMemo(() => sheetHeight + 40, [sheetHeight]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(startY);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();

      setShowCategoryList(false);
      setError(null);
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

  async function onSubmit() {
    if (submitting) return;
    setError(null);

    const descriptionTrimmed = description.trim();
    if (!descriptionTrimmed) {
      setError("Description is required.");
      return;
    }

    const amount = parseAmount(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount is required and must be a valid number.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await addExpense({
        description,
        amount,
        category: category.trim() ? category.trim() : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setDescription("");
      setAmountRaw("");
      setCategory("");
      close();
    } finally {
      setSubmitting(false);
    }
  }

  const amountDisplay = useMemo(
    () => formatCurrencyInputPHP(amountRaw),
    [amountRaw]
  );

  const canSubmit = useMemo(() => {
    const amount = parseAmount(amountRaw);
    return Number.isFinite(amount) && amount > 0 && !submitting;
  }, [amountRaw, submitting]);

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

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
              value={amountDisplay}
              onChangeText={(next) => {
                const normalized = normalizeAmountInput(next);
                setAmountRaw(normalized);
              }}
              placeholder="₱0.00"
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

            <ThemedText style={styles.label}>Category</ThemedText>
            <View style={styles.dropdownWrap}>
              <Pressable
                onPress={() => {
                  setShowCategoryList((v) => !v);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.input,
                  styles.selectInput,
                  {
                    backgroundColor: themeColors.inputBackground,
                    borderColor: "rgba(0,0,0,0.25)",
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <ThemedText
                  style={[styles.selectText, { color: themeColors.text }]}
                >
                  {category ? category : "Optional"}
                </ThemedText>
                <MaterialIcons
                  name={showCategoryList ? "expand-less" : "expand-more"}
                  size={20}
                  color={themeColors.text}
                />
              </Pressable>

              {showCategoryList ? (
                <View
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? themeColors.surface : "#FFFFFF",
                      borderColor:
                        colorScheme === "dark" ? "#4B5563" : "#D1D5DB",
                    },
                  ]}
                >
                  <ScrollView
                    style={styles.dropdownScroll}
                    contentContainerStyle={styles.dropdownContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Pressable
                      key="__none__"
                      onPress={() => {
                        setCategory("");
                        setShowCategoryList(false);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        {
                          backgroundColor: !category
                            ? themeColors.primary
                            : pressed
                            ? themeColors.inputBackground
                            : "transparent",
                        },
                      ]}
                    >
                      <ThemedText style={styles.dropdownItemText}>
                        No category
                      </ThemedText>
                    </Pressable>

                    {EXPENSE_CATEGORIES.map((c) => {
                      const active = c === category;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => {
                            setCategory(c);
                            setShowCategoryList(false);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            {
                              backgroundColor: active
                                ? themeColors.primary
                                : pressed
                                ? themeColors.inputBackground
                                : "transparent",
                            },
                          ]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{c}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* Reserve space so absolute dropdown doesn't overlap the Date field */}
              <View style={{ height: showCategoryList ? 220 : 0 }} />
            </View>

            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.submit,
                {
                  backgroundColor: themeColors.text,
                  opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemedText
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.submitText, { color: themeColors.primary }]}
              >
                {submitting ? "Adding..." : "Add Expense"}
              </ThemedText>
            </Pressable>
          </ScrollView>
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
  formScroll: {
    flex: 1,
    marginTop: 0,
  },
  form: {
    marginTop: 26,
    gap: 14,
    paddingBottom: 18,
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
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dropdownWrap: {
    position: "relative",
    zIndex: 30,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 48,
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 999,
    elevation: 12,
    overflow: "hidden",
  },
  dropdownScroll: {
    flex: 1,
  },
  dropdownContent: {
    paddingVertical: 8,
  },
  dropdownItem: {
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    marginVertical: 4,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "800",
  },
  errorText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(180,0,0,0.85)",
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
    letterSpacing: -0.2,
  },
  datePickerWrap: {
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  iosDone: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iosDoneText: {
    fontSize: 14,
    fontWeight: "900",
  },
});
