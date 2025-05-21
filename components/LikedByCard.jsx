// src/components/LikedByCard.jsx
import React from "react";
import {
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

export default function LikedByCard({
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 55,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#eee",
  },
  info: {
    padding: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  subText: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
});
