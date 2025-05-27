// src/screens/SingleChatScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../Lib/supabase";
import { useRoute } from "@react-navigation/native";

export default function SingleChatScreen() {
  const route = useRoute();
  const { otherUser } = route.params; // { id, firstName, … }

  const [me, setMe] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef();
  const channelRef = useRef();

  // 1️⃣ On mount: get session → find or create chatId → load history → subscribe
  useEffect(() => {
    let mounted = true;
    (async () => {
      // a) get session & me
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session) return console.error("No session", sessErr);
      const me = session.user;
      if (!mounted) return;
      setMe(me);

      // b) find the match row between me & otherUser
      const {
        data: [match],
        error: matchErr,
      } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user_a.eq.${me.id},user_b.eq.${otherUser.id}),` +
            `and(user_a.eq.${otherUser.id},user_b.eq.${me.id})`
        )
        .maybeSingle();
      if (matchErr) return console.error("match lookup:", matchErr);
      if (!match) return console.error("No match exists – cannot chat");

      // c) find or create a chat row for that match
      let { data: chat, error: chatErr } = await supabase
        .from("chats")
        .select("id")
        .eq("match_id", match.id)
        .maybeSingle();
      if (chatErr) return console.error("chat lookup:", chatErr);

      if (!chat) {
        // create if missing
        const {
          data: [newChat],
          error: createErr,
        } = await supabase
          .from("chats")
          .insert({ match_id: match.id })
          .select("id");
        if (createErr) return console.error("chat create:", createErr);
        chat = newChat;
      }

      if (!mounted) return;
      setChatId(chat.id);

      // d) load existing messages
      const { data: history, error: histErr } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat.id)
        .order("sent_at", { ascending: true });
      if (histErr) console.error("load history:", histErr);
      else if (mounted) setMessages(history);

      // e) realtime subscribe
      channelRef.current = supabase
        .channel(`chat_messages_${chat.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chat.id}`,
          },
          (payload) => {
            if (mounted) {
              setMessages((m) => [...m, payload.new]);
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [otherUser.id]);

  // 2️⃣ Send new message
  const handleSend = async () => {
    if (!newMessage.trim() || !me || !chatId) return;
    const content = newMessage.trim();
    const payload = {
      chat_id: chatId,
      sender_id: me.id,
      content,
      sent_at: new Date().toISOString(),
    };

    // optimistic UI
    setMessages((m) => [...m, payload]);
    flatListRef.current?.scrollToEnd({ animated: true });
    setNewMessage("");

    const { error: insertErr } = await supabase
      .from("messages")
      .insert([payload]);
    if (insertErr) console.error("send message error:", insertErr);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id?.toString() || item.sent_at}
          renderItem={({ item }) => {
            const isMe = me && item.sender_id === me.id;
            return (
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.myBubble : styles.theirBubble,
                ]}
              >
                <Text style={styles.messageText}>{item.content}</Text>
              </View>
            );
          }}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message…"
          />
          <Button title="Send" onPress={handleSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 0 },
  bubble: {
    marginVertical: 4,
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
  messageText: { fontSize: 16 },
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
