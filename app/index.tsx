import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function index() {
  const [isOnboarding, setIsOnboarding] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  useEffect(() => {
    const checkOnboarding = async () => {
      const isOnboarding = await AsyncStorage.getItem("onboarding");
      if (isOnboarding) {
        setIsOnboarding(false);
      }
      setLoading(false);
    };
    checkOnboarding();
  }, []);

  if (loading) return null; // or a loading indicator
  return (
    <Redirect href={isOnboarding ? "/(routes)/onboarding" : "/(routes)/home"} />
  );
}
