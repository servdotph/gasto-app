import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
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

function showAlert(title: string, message: string, buttons?: any[]) {
  if (Platform.OS === "web") {
    const confirmText = buttons?.map((b: any) => b.text).join("/") || "OK";
    window.confirm(`${title}\n\n${message}`) || null;
    // For simplicity, just call the first button
    buttons?.[0]?.onPress?.();
  } else {
    Alert.alert(title, message, buttons);
  }
}

export function AddExpenseDrawer({ visible, onClose }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const [description, setDescription] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [category, setCategory] = useState("");

  const [showCategoryList, setShowCategoryList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;

  const windowHeight = Dimensions.get("window").height;
  const sheetHeight = Math.min(560, Math.floor(windowHeight * 0.85));
  const startY = sheetHeight + 40;

  /* ===========================
     API BASE (Expo-safe)
  ============================ */
  const RAW_BASE =
    process.env.EXPO_PUBLIC_BASE_API_ROUTE ?? process.env.BASE_API_ROUTE ?? "";

  const BASE_API_ROUTE = useMemo(() => {
    if (!RAW_BASE) return "";
    try {
      const url = new URL(RAW_BASE);
      if (
        Platform.OS === "android" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1")
      ) {
        return `${url.protocol}//10.0.2.2${url.port ? `:${url.port}` : ""}`;
      }
      return RAW_BASE;
    } catch {
      return RAW_BASE;
    }
  }, [RAW_BASE]);

  /* ===========================
     OPEN / CLOSE ANIMATION
  ============================ */
  useEffect(() => {
    if (!visible) return;

    translateY.setValue(startY);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();

    setError(null);
    setShowCategoryList(false);
  }, [visible]);

  function close() {
    Animated.timing(translateY, {
      toValue: startY,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  /* ===========================
     SUBMIT
  ============================ */
  async function onSubmit() {
    console.log("submit");
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const desc = description.trim();
    if (!desc) {
      setSubmitting(false);
      setError("Description is required.");
      return;
    }

    const amount = parseAmount(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmitting(false);
      setError("Enter a valid amount.");
      return;
    }

    async function finalize(chosenCategory: string | null) {
      const res = await addExpense({
        description: desc,
        amount,
        category: chosenCategory?.trim() || null,
      });

      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      setDescription("");
      setAmountRaw("");
      setCategory("");
      setSubmitting(false);
      close();
    }

    if (category.trim() !== "") {
      console.log("category not non");
      await finalize(category.trim() || null);
      return;
    }

    // ML prediction
    try {
      const res = await fetch(`http://127.0.0.1:8000/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: desc }),
      });

      if (!res.ok) throw new Error("Predict failed");

      const json = await res.json();
      const predicted = json?.category;
      const confidence = json?.confidence
        ? Math.round(json.confidence * 100)
        : null;
      console.log(`${predicted} {json}`);
      if (predicted) {
        showAlert(
          "Predicted category",
          confidence ? `${predicted} (${confidence}%)` : predicted,
          [
            { text: "Use", onPress: () => finalize(predicted) },
            {
              text: "Edit",
              onPress: () => {
                setShowCategoryList(true);
                setSubmitting(false);
              },
            },
            {
              text: "Ignore",
              style: "cancel",
              onPress: () => finalize(null),
            },
          ]
        );
        return;
      }
    } catch (e) {
      console.warn("Prediction failed:", e);
    }

    await finalize(null);
  }

  const amountDisplay = useMemo(
    () => formatCurrencyInputPHP(amountRaw),
    [amountRaw]
  );

  const canSubmit = !submitting && parseAmount(amountRaw) > 0;

  /* ===========================
     UI
  ============================ */
  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.root}>
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
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="add" size={26} color={themeColors.text} />
              <ThemedText style={styles.title} numberOfLines={1}>
                Add Expense
              </ThemedText>
            </View>
            <Pressable onPress={close}>
              <MaterialIcons name="close" size={22} color={themeColors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form}>
            <ThemedText>Description</ThemedText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="coffee at Starbucks"
              style={styles.input}
            />

            <ThemedText>Amount</ThemedText>
            <TextInput
              value={amountDisplay}
              onChangeText={(t) => setAmountRaw(normalizeAmountInput(t))}
              keyboardType="decimal-pad"
              placeholder="₱0.00"
              style={styles.input}
            />

            <ThemedText>Category (optional)</ThemedText>
            <Pressable
              style={styles.select}
              onPress={() => setShowCategoryList((v) => !v)}
            >
              <ThemedText>{category || "Choose category"}</ThemedText>
              <MaterialIcons name="expand-more" size={20} />
            </Pressable>

            {showCategoryList && (
              <View style={styles.dropdown}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                  <Pressable
                    style={styles.option}
                    onPress={() => {
                      setCategory("");
                      setShowCategoryList(false);
                    }}
                  >
                    <ThemedText>No category</ThemedText>
                  </Pressable>

                  {EXPENSE_CATEGORIES.map((c) => (
                    <Pressable
                      key={c}
                      style={styles.option}
                      onPress={() => {
                        setCategory(c);
                        setShowCategoryList(false);
                      }}
                    >
                      <ThemedText>{c}</ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <Pressable
              disabled={!canSubmit}
              onPress={onSubmit}
              style={[styles.submit, { opacity: canSubmit ? 1 : 0.5 }]}
            >
              <ThemedText style={styles.submitText} numberOfLines={1}>
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
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  title: { fontSize: 24, fontWeight: "900", flexShrink: 0 },
  form: { gap: 12, paddingBottom: 40 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "white",
  },
  select: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
  },
  dropdown: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "white",
    overflow: "hidden",
  },
  option: {
    padding: 12,
  },
  submit: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "white", fontWeight: "900", textAlign: "center" },
  error: { color: "red", fontWeight: "700" },
});
