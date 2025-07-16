import React from "react";
import { TouchableOpacity, Image, Text, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

export default function MsgReqCircleCard({ firstName, photoUrl, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]} />
        )}
        {/* Blur overlay on avatar */}
        <BlurView
          intensity={10}
          style={styles.blurOverlay}
          pointerEvents="none"
        />
      </View>
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
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    position: "relative",
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
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  name: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
});
