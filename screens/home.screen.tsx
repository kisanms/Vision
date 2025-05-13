import {
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { scale, verticalScale } from "react-native-size-matters";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Audio } from "expo-av";
import axios from "axios";
import LottieView from "lottie-react-native";
import * as FileSystem from "expo-file-system";

export default function HomeScreen() {
  const [text, setText] = React.useState("");
  const [isRecording, setIsRecording] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [recording, setRecording] = React.useState<Audio.Recording>();

  // AssemblyAI API configuration
  const baseUrl = "https://api.assemblyai.com";
  const headers = {
    authorization: "eb8e498d09cb43d69411d8ab7eaa352a",
  };

  // Microphone permission
  const getMicrophonePermission = async () => {
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

  // Recording options for .m4a format
  const recordingOptions: any = {
    android: {
      extension: ".m4a",
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 1, // Simplified to mono for compatibility
      bitRate: 128000,
    },
    ios: {
      extension: ".m4a",
      audioQuality: Audio.IOSAudioQuality.MEDIUM,
      sampleRate: 44100,
      numberOfChannels: 1, // Simplified to mono for compatibility
      bitRate: 128000,
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    },
  };

  const startRecording = async () => {
    const hasPermission = await getMicrophonePermission();
    if (!hasPermission) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      setIsRecording(true);
      setText("");
      console.log("Starting recording...");

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      console.log("Recording started.");
    } catch (error) {
      console.log("Error starting recording:", error);
      Alert.alert("Error", "An error occurred while starting the recording.");
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setLoading(true);
      await recording?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording?.getURI();
      console.log("Recording stopped. Audio URI:", uri);

      // Verify file existence
      const fileInfo = await FileSystem.getInfoAsync(uri!);
      console.log("File info:", fileInfo);

      if (!fileInfo.exists || fileInfo.size === 0) {
        console.error("Audio file does not exist or is empty at:", uri);
        Alert.alert("Error", "Failed to record audio. Please try again.");
        setLoading(false);
        return;
      }

      // Send audio to AssemblyAI for transcription
      const transcript = await sendAudioToAssemblyAI(uri!);
      setText(transcript || "No transcription available");
      setLoading(false);
    } catch (error) {
      console.log("Error stopping recording:", error);
      Alert.alert("Error", "An error occurred while stopping the recording.");
      setLoading(false);
    }
  };

  const sendAudioToAssemblyAI = async (uri: string) => {
    try {
      // Step 1: Upload the audio file to AssemblyAI
      console.log("Starting audio upload to AssemblyAI. URI:", uri);

      // Verify file existence
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("File info before upload:", fileInfo);

      if (!fileInfo.exists || fileInfo.size === 0) {
        console.error("Audio file does not exist or is empty at:", uri);
        Alert.alert("Error", "Audio file does not exist or is empty.");
        return null;
      }

      // Create a FormData object for the file upload
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        type: "audio/mp4",
        name: "recording.m4a",
      } as any);

      // Upload directly to AssemblyAI
      const uploadUrl = `${baseUrl}/v2/upload`;
      console.log("Uploading to:", uploadUrl);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: headers.authorization,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      console.log("Upload response:", uploadResult);

      const audioUrl = uploadResult.upload_url;
      if (!audioUrl) {
        console.error("Failed to upload audio:", uploadResult);
        Alert.alert("Error", "Failed to upload audio file.");
        return null;
      }

      console.log("Audio uploaded successfully. Audio URL:", audioUrl);

      // Step 2: Submit the transcription request
      const transcriptionUrl = `${baseUrl}/v2/transcript`;
      console.log("Submitting transcription request");

      const transcriptionResponse = await axios.post(
        transcriptionUrl,
        {
          audio_url: audioUrl,
          speech_model: "universal",
        },
        {
          headers: headers,
        }
      );

      const transcriptId = transcriptionResponse.data.id;
      console.log("Transcription started with ID:", transcriptId);

      // Step 3: Poll for results
      const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        attempts++;
        const pollingResponse = await axios.get(pollingEndpoint, {
          headers: headers,
        });

        const transcriptionResult = pollingResponse.data;
        console.log("Transcription status:", transcriptionResult.status);

        if (transcriptionResult.status === "completed") {
          console.log(
            "Transcription completed. Text:",
            transcriptionResult.text
          );
          console.log("speech to text"); // Log "speech to text" after transcription
          return transcriptionResult.text;
        } else if (transcriptionResult.status === "error") {
          console.error("Transcription error:", transcriptionResult.error);
          Alert.alert("Error", transcriptionResult.error);
          return null;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Increased to 5 seconds
        }
      }

      console.error("Transcription timed out after too many attempts");
      Alert.alert("Error", "Transcription timed out. Please try again.");
      return null;
    } catch (error) {
      console.log("Error sending audio to AssemblyAI:", error);
      Alert.alert("Error", "An error occurred while transcribing the audio.");
      return null;
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

      {/* Back shadows pictures */}
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

      {/* Text display area */}
      {text ? (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptText}>{text}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: verticalScale(-40) }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Transcribing audio...</Text>
          </View>
        ) : !isRecording ? (
          <TouchableOpacity style={styles.micButton} onPress={startRecording}>
            <FontAwesome name="microphone" size={scale(50)} color="#2b3356" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={stopRecording}>
            <LottieView
              source={require("@/assets/animations/1.json")}
              autoPlay
              loop
              speed={1.3}
              style={{ width: scale(140), height: scale(140) }}
            />
          </TouchableOpacity>
        )}
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
          {isRecording
            ? "Recording... Tap to stop"
            : loading
            ? "Processing with AssemblyAI..."
            : "Press the microphone to start recording!"}
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
  micButton: {
    width: scale(110),
    height: scale(110),
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: scale(100),
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: scale(14),
  },
  transcriptContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: scale(15),
    borderRadius: scale(10),
    width: "85%",
    maxHeight: "40%",
    marginBottom: verticalScale(20),
  },
  transcriptText: {
    color: "white",
    fontSize: scale(16),
    lineHeight: scale(22),
  },
});
