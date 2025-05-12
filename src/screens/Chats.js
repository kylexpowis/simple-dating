// Chats.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "./supabase"; // adjust path if needed

export default function Chats({ route }) {
  const { otherUserId } = route.params;
  const [currentUserId, setCurrentUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef();
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    let channel;

    async function initChat() {
      // 1. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return console.error("No user session found");
      setCurrentUserId(user.id);

      // 2. Fetch existing messages between the two users
      const { data: storedMessages, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) console.error("Error fetching messages:", error);
      else setMessages(storedMessages);

      // 3. Subscribe to new INSERTs on messages
      channel = supabase
        .channel("public:messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const msg = payload.new;
            if (
              (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
              (msg.sender_id === otherUserId && msg.receiver_id === user.id)
            ) {
              setMessages((prev) => [...prev, msg]);
              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
              });
            }
          }
        )
        .subscribe();

      setSubscription(channel);
    }

    initChat();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      } else if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [otherUserId]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !currentUserId) return;

    const message = {
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: text,
    };

    const { error } = await supabase.from("messages").insert([message]);
    if (error) console.error("Error sending message:", error);
    else setNewMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMe = item.sender_id === currentUserId;
          return (
            <View
              style={[
                styles.messageBubble,
                isMe ? styles.myBubble : styles.theirBubble,
              ]}
            >
              <Text style={styles.messageText}>{item.content}</Text>
            </View>
          );
        }}
        inverted
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message…"
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  messageBubble: {
    marginVertical: 4,
    marginHorizontal: 8,
    padding: 10,
    borderRadius: 16,
    maxWidth: "75%",
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C5",
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#ECECEC",
  },
  messageText: {
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
});
