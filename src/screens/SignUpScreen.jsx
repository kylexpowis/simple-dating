import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { supabase } from "../../Lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { decode as base64ToArrayBuffer } from "base64-arraybuffer";

const IMAGE_BUCKET = "simple-dating-user-images";

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState(Array(6).fill(null));
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [ethnicities, setEthnicities] = useState("");
  const [relationship, setRelationship] = useState("");
  const [hasKids, setHasKids] = useState("");
  const [wantsKids, setWantsKids] = useState("");
  const [religion, setReligion] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [cigarettes, setCigarettes] = useState("");
  const [weed, setWeed] = useState("");
  const [drugs, setDrugs] = useState("");

  const pickImage = async (idx) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      const copy = [...images];
      copy[idx] = asset;
      setImages(copy);
    } catch (e) {
      console.error("pick image error", e);
    }
  };

  const uploadSelectedImages = async (userId) => {
    for (const asset of images) {
      if (!asset) continue;
      const { uri: localUri, base64: b64, fileName } = asset;
      try {
        if (!b64) continue;
        let lower = (fileName || localUri).toLowerCase();
        let extension = lower.endsWith(".png")
          ? "png"
          : lower.endsWith(".gif")
          ? "gif"
          : "jpg";
        const mimeType =
          extension === "png"
            ? "image/png"
            : extension === "gif"
            ? "image/gif"
            : "image/jpeg";
        const arrayBuffer = base64ToArrayBuffer(b64);
        const filePath = `${userId}/${Date.now()}.${extension}`;
        const { error: upErr } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(filePath, arrayBuffer, { contentType: mimeType });
        if (upErr) throw upErr;
        const {
          data: { publicUrl },
        } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
        await supabase
          .from("user_images")
          .insert([{ user_id: userId, url: publicUrl }]);
      } catch (e) {
        console.error("image upload error", e);
      }
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Validation Error", "Email and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Supabase sign up.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("No user returned");

      const payload = {
        id: user.id,
        first_name: firstName,
        age: Number(age) || null,
        city,
        country,
        bio,
        ethnicities,
        relationship,
        has_kids: hasKids,
        wants_kids: wantsKids,
        religion,
        alcohol,
        cigarettes,
        weed,
        drugs,
      };
      const { error: upErr } = await supabase
        .from("users")
        .upsert(payload, { returning: "minimal" });
      if (upErr) throw upErr;

      await uploadSelectedImages(user.id);

      if (!data.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
      }

      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "MainTabs" }] })
      );
    } catch (err) {
      console.log("SignUp error:", err.message);
      Alert.alert("Error Signing Up", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.select({ ios: "padding", android: null })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create an Account</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>


        {loading ? (
          <ActivityIndicator
            size="large"
            color="#000"
            style={{ marginTop: 20 }}
          />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.footerLink}> Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#1f65ff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    color: "#555",
  },
  footerLink: {
    fontSize: 16,
    color: "#1f65ff",
    fontWeight: "600",
  },
  photoSlot: {
    width: 80,
    height: 80,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  photoEmpty: {
    backgroundColor: "#ddd",
    borderRadius: 8,
  },
});
