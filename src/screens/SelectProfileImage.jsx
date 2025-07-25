import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Button,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode as base64ToArrayBuffer } from "base64-arraybuffer";
import { supabase } from "../../Lib/supabase";

const { width } = Dimensions.get("window");
const BUCKET_NAME = "simple-dating-user-images";

export default function SelectProfileImage({ onComplete } = {}) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw userErr || new Error("No user");

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      });
      if (res.canceled) return;

      const asset = res.assets[0];
      const { uri: localUri, base64: b64String, fileName } = asset;
      if (!b64String) throw new Error("No base64 data returned from picker");

      let lower = (fileName || localUri).toLowerCase();
      let extension, mimeType;
      if (lower.endsWith(".png")) {
        extension = "png";
        mimeType = "image/png";
      } else if (lower.endsWith(".gif")) {
        extension = "gif";
        mimeType = "image/gif";
      } else {
        extension = "jpg";
        mimeType = "image/jpeg";
      }

      const arrayBuffer = base64ToArrayBuffer(b64String);
      if (arrayBuffer.byteLength === 0)
        throw Error("Decoded ArrayBuffer is 0 bytes!");

      const filePath = `${user.id}/${Date.now()}.${extension}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, arrayBuffer, { contentType: mimeType });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      const { error: dbErr } = await supabase
        .from("user_images")
        .insert([{ user_id: user.id, url: publicUrl }]);
      if (dbErr) throw dbErr;

      setImage(publicUrl);
    } catch (e) {
      console.error("pickImage error", e);
      Alert.alert("Error", "Could not upload image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Upload your first image to catch someones eye
      </Text>
      <TouchableOpacity
        style={styles.imageSlot}
        onPress={pickImage}
        disabled={loading}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.imageThumb} />
        ) : (
          <View style={styles.plusBox}>
            <Text style={styles.plusText}>+</Text>
          </View>
        )}
      </TouchableOpacity>
      {image && (
        <View style={styles.buttonContainer}>
          <Button title="Continue" onPress={onComplete} disabled={loading} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, textAlign: "center", marginBottom: 24 },
  imageSlot: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  imageThumb: { width: "100%", height: "100%", borderRadius: 8 },
  plusBox: { justifyContent: "center", alignItems: "center" },
  plusText: { fontSize: 64, color: "#888" },
  buttonContainer: { marginTop: 24, width: "60%" },
});
