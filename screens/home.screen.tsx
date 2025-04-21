import { Image, StatusBar, StyleSheet, Text, View } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { scale } from "react-native-size-matters";

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={["#250152", "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/**back shoadows */}
      <Image
        source={require("@/assets/main/Ellipse 10.png")}
        style={{
          position: "absolute",
          right: scale(-15),
          top: 0,
          width: scale(240),
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
