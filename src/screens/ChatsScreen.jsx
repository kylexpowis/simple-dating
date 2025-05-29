// src/screens/ChatsScreen.jsx
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
import { supabase } from "../../Lib/supabase";

export default function ChatsScreen({ route }) {
  const otherUserId = route?.params?.otherUserId ?? null;

  const [currentUserId, setCurrentUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef();

  useEffect(() => {
    let channel;
    let isMounted = true;

    (async () => {
      // 1) get session & current user
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session) return console.error("No session", sessErr);
      const me = session.user;
      if (isMounted) setCurrentUserId(me.id);

      // 2) load existing history
      if (otherUserId) {
        const { data: history, error: histErr } = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${me.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me.id})`
          )
          .order("created_at", { ascending: true });
        if (histErr) console.error("History load error", histErr);
        else if (isMounted) setMessages(history);
      }

      // 3) subscribe to new messages via Supabase Realtime
      if (otherUserId) {
        channel = supabase
          .channel(`chat-${me.id}-${otherUserId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `or(and(sender_id.eq.${me.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me.id}))`,
            },
            (payload) => {
              setMessages((prev) => [...prev, payload.new]);
              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
              });
            }
          )
          .subscribe();
      }
    })();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [otherUserId]);

  // send message: still insert via supabase—and realtime channel will pick it up
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const payload = {
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("messages").insert([payload]);
    if (error) console.error("Error saving message:", error);
    setNewMessage("");
  };

  if (!otherUserId) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Select a conversation first.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id.toString()}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
