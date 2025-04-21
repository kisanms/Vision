import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { onBoardingData } from "@/configs/contants";
import { scale, verticalScale } from "react-native-size-matters";
import { useFonts } from "expo-font";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
export default function OnboardingScreeen() {
  const [fontsLoaded, fontError] = useFonts({
    SegeoUI: require("../assets/fonts/Segoe UI.ttf"),
  });
  if (!fontsLoaded && fontError) {
    return null;
  }
  const [activeIndex, setActiveIndex] = React.useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(
      contentOffsetX / event.nativeEvent.layoutMeasurement.width
    );
    setActiveIndex(currentIndex);
  };

  const handleSkip = async () => {
    const nextIndex = activeIndex + 1;
    if (nextIndex < onBoardingData.length) {
      scrollViewRef.current?.scrollTo({
        x: Dimensions.get("window").width * nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    } else {
      await AsyncStorage.setItem("onboarding", "true");
      router.push("/home/index");
    }
  };

  return (
    <LinearGradient
      colors={["#250152", "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      {/**skip button */}
      <Pressable style={styles.skipContainer} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
        <AntDesign name="arrowright" size={scale(18)} color="white" />
      </Pressable>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        ref={scrollViewRef}
      >
        {onBoardingData.map((item: onBoardingDataType, index: number) => (
          <View key={index} style={styles.slide}>
            {item.image}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.paginationContainer}>
        {onBoardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                opacity: activeIndex === index ? 1 : 0.5,
              },
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    width: Dimensions.get("window").width,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: scale(23),
    textAlign: "center",
    fontWeight: "500",
    fontFamily: "SegeoUI",
    color: "#fff",
    marginTop: 20,
  },
  subtitle: {
    width: scale(290),
    marginHorizontal: "auto",
    fontSize: scale(14),
    color: "#9A9999",
    fontWeight: "400",
    textAlign: "center",
    fontFamily: "SegeoUI",
    paddingTop: verticalScale(10),
  },
  paginationContainer: {
    position: "absolute",
    bottom: verticalScale(70),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(8),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: 100,
    backgroundColor: "#fff",
    marginHorizontal: scale(2),
  },
  skipContainer: {
    position: "absolute",
    top: verticalScale(50),
    right: scale(40),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    zIndex: 10,
  },
  skipText: {
    fontSize: scale(16),
    color: "#fff",
    fontWeight: "400",
    fontFamily: "SegeoUI",
  },
});
