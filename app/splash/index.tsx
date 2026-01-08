import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import { SplashOverlay } from "@/components/splash-overlay";
import { supabase } from "@/lib/supabase";

import LandingScreen from "../landing";
import ProfileScreen from "../profile";

type TargetRoute = "/landing" | "/profile";

export default function SplashScreen() {
  const router = useRouter();
  const [target, setTarget] = useState<TargetRoute | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function resolveTarget() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setTarget(data.session ? "/profile" : "/landing");
      } catch {
        if (!mounted) return;
        setTarget("/landing");
      }
    }

    resolveTarget();

    // Safety: never get stuck on splash.
    const timeout = setTimeout(() => {
      if (!mounted) return;
      setTarget((t) => t ?? "/landing");
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!finishedRef.current) return;
    if (!target) return;
    router.replace(target);
  }, [router, target]);

  const reveal = useMemo(() => {
    // Render the real destination screen underneath the splash.
    // This makes the reveal animation feel seamless.
    if (target === "/profile") return <ProfileScreen />;
    // Default to landing while we resolve target.
    return <LandingScreen />;
  }, [target]);

  function onFinished() {
    finishedRef.current = true;
    if (target) {
      router.replace(target);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {reveal}
      <SplashOverlay reveal={reveal} onFinished={onFinished} />
    </View>
  );
}
