import {
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { scale, verticalScale } from "react-native-size-matters";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Audio } from "expo-av";

export default function HomeScreen() {
  const [text, setText] = React.useState("");
  const [isRecording, setIsRecording] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [recording, setRecording] = React.useState("");
  const [AIResponse, setAIResponse] = React.useState(false);

  //Microphone permission
  const getMicerophonePermission = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission",
          "Please allow microphone access to use this feature."
        );
        return false;
      }
      return true;
    } catch (error) {
      console.log("Error getting microphone permission:", error);
      Alert.alert(
        "Permission",
        "An error occurred while requesting microphone access."
      );
      return false;
    }
  };

  const startRecording = async () => {
    const hasPermission = await getMicerophonePermission();
    if (!hasPermission) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      setIsRecording(true);

      const { recording } = await Audio.Recording.createAsync();
    } catch (error) {}
  };
  return (
    <LinearGradient
      colors={["#250152", "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/**back shoadows  pictures*/}
      <Image
        source={require("@/assets/main/Ellipse 10.png")}
        style={{
          position: "absolute",
          right: scale(-15),
          top: 0,
          width: scale(240),
        }}
      />
      <Image
        source={require("@/assets/main/Ellipse 9.png")}
        style={{
          position: "absolute",
          left: scale(-15),
          bottom: verticalScale(100),
          width: scale(210),
        }}
      />
      <View style={{ marginTop: verticalScale(-40) }}>
        <TouchableOpacity
          style={{
            width: scale(110),
            height: scale(110),
            flexDirection: "row",
            backgroundColor: "#fff",
            borderRadius: scale(100),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FontAwesome name="microphone" size={scale(50)} color="#2b3356" />
        </TouchableOpacity>
      </View>
      <View
        style={{
          alignItems: "center",
          width: scale(350),
          position: "absolute",
          bottom: verticalScale(90),
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: scale(16),
            width: scale(269),
            textAlign: "center",
            lineHeight: 25,
          }}
        >
          Press the microphone to start recording !
        </Text>
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
});
