import { Redirect, Tabs } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import { AddExpenseDrawer } from "@/components/add-expense-drawer";
import { BottomNavbar } from "@/components/bottom-navbar";
import { supabase } from "@/lib/supabase";

export default function TabsLayout() {
  const [addOpen, setAddOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const openAdd = useCallback(() => setAddOpen(true), []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  useEffect(() => {
    let mounted = true;

    async function syncAuth() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setAuthed(!!data.session);
    }

    syncAuth();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthed(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (authed === false) {
    return <Redirect href="/landing" />;
  }

  if (authed === null) {
    // Avoid briefly rendering protected tabs before we know auth state.
    return null;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={() => <BottomNavbar onAddPress={openAdd} />}
      />

      <AddExpenseDrawer visible={addOpen} onClose={closeAdd} />
    </>
  );
}
