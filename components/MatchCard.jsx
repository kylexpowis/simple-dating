// src/components/MatchCard.jsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

/**
 * Props:
 *  - firstName: string
 *  - photoUrl: string | null
 *  - onPress: () => void
 */
export default function MatchCard({ firstName, photoUrl, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]}>
          <Text style={styles.placeholderText}>
            {firstName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {firstName}
      </Text>
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 50;

const styles = StyleSheet.create({
  container: {
    width: AVATAR_SIZE,
    alignItems: "center",
    marginRight: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#eee",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    color: "#888",
  },
  name: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
});
