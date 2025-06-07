// src/components/SingleChatCard.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function SingleChatCard({ user, lastMessage }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        navigation.navigate("Home", {
          screen: "SingleChatScreen",
          params: { otherUser: user },
        })
      }
    >
      {user.photoUrl ? (
        <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.name}>
          {user.firstName}, {user.age}
        </Text>
        <Text style={styles.message} numberOfLines={1}>
          {lastMessage?.content || "Start a new conversation"}
        </Text>
      </View>
      {lastMessage && (
        <Text style={styles.time}>
          {new Date(lastMessage.sent_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 50;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#ddd",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
  },
  message: {
    color: "#555",
    marginTop: 4,
    fontSize: 14,
  },
  time: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
});
