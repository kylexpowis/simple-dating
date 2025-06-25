import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function SingleChatCard({
  user,
  lastMessage,
  unreadCount = 0,
  onPress,
}) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {user.photoUrl ? (
        <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.name}>{user.firstName}</Text>
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
      {unreadCount > 0 && <View style={styles.unreadDot} />}
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
    position: "relative",
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
  textContainer: { flex: 1 },
  name: { fontWeight: "600", fontSize: 16 },
  message: { color: "#555", marginTop: 4, fontSize: 14 },
  time: { fontSize: 12, color: "#999", marginLeft: 8 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -5,
  },
});
