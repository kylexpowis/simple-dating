// src/screens/LoginScreen.jsx
import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet } from "react-native";
import { supabase } from "../../Lib/supabase";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Validation Error", "Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        throw error;
      }
      // On successful sign-in, Supabase's onAuthStateChange listener (in App.js) will switch to AppStack automatically.
    } catch (err) {
      Alert.alert("Login Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonContainer}>
        <Button title={loading ? "Signing In..." : "Sign In"} onPress={signIn} disabled={loading} />
      </View>

      <View style={styles.signUpContainer}>
        <Button
          title="Sign Up"
          onPress={() => navigation.navigate("SignUp")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 16, 
    backgroundColor: "#fff" 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  signUpContainer: {
    marginTop: 8,
  },
});
