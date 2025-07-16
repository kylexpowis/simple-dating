import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function MyProfileCard({
  firstName,
  age,
  location,
  photoUrl,
  onPress,
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: photoUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>
          {firstName}, {age}
        </Text>
        <Text style={styles.subText}>
          {location.city}, {location.country}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 540,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
  },
  subText: {
    color: "#668",
    marginTop: 4,
  },
});
