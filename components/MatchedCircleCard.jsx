import React from "react";
import { TouchableOpacity, Image, Text, StyleSheet, View } from "react-native";

export default function MatchedCircleCard({ firstName, photoUrl, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}
      <Text style={styles.name} numberOfLines={1}>
        {firstName}
      </Text>
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 50;
const ITEM_WIDTH = 60;

const styles = StyleSheet.create({
  container: {
    width: ITEM_WIDTH,
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
    // optional empty look
  },
  name: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
});
