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
import { createChatSocket } from "../../Lib/ChatSocket";

export default function ChatScreen({ route }) {
  const otherUserId = route?.params?.otherUserId ?? null;

  if (!otherUserId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Select a conversation first.</Text>
      </View>
    );
  }
  const [currentUserId, setCurrentUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef();
  const wsRef = useRef();

  // 1) Load history & open WebSocket
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // get user session
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session) return console.error("No session", sessErr);

      const me = session.user;
      if (isMounted) setCurrentUserId(me.id);

      // load existing messages from Supabase
      const { data: history, error: histErr } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${me.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me.id})`
        )
        .order("created_at", { ascending: true });

      if (histErr) console.error("History load error", histErr);
      else if (isMounted) setMessages(history);

      // open our own WebSocket
      wsRef.current = createChatSocket({
        token: session.access_token,
        userId: me.id,
        otherUserId,
        onMessage: (msg) => {
          // only add if between these two users
          if (
            (msg.sender_id === me.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === me.id)
          ) {
            setMessages((prev) => [...prev, msg]);
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        },
      });
    })();

    return () => {
      isMounted = false;
      wsRef.current?.close();
    };
  }, [otherUserId]);

  // 2) Send new message (via WS and persist to Supabase)
  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !currentUserId) return;

    const payload = {
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: text,
      created_at: new Date().toISOString(),
    };

    // Send over your WebSocket
    wsRef.current?.send(JSON.stringify(payload));

    // Persist to the DB
    const { error: insertErr } = await supabase
      .from("messages")
      .insert([payload]);
    if (insertErr) console.error("Error saving message:", insertErr);

    setNewMessage("");
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
