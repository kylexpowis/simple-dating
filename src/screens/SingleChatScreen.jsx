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
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../Lib/supabase";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function SingleChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  let otherUser = route.params?.otherUser || null;
  if (!otherUser && route.params?.otherUserId) {
    otherUser = { id: route.params.otherUserId };
  }

  // Set header options with back button routing to Chats tab
  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.firstName || "Chat",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Chats")}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUser?.firstName]);

  const [me, setMe] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef();
  const channelRef = useRef();

  useEffect(() => {
    let mounted = true;
    setError(null);

    (async () => {
      try {
        const {
          data: { session },
          error: sessErr,
        } = await supabase.auth.getSession();
        if (sessErr || !session) {
          throw new Error(sessErr?.message || "No active session");
        }
        const meUser = session.user;
        if (!mounted) return;
        setMe(meUser);

        const { data: existingMatch, error: matchLookupErr } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user_a.eq.${meUser.id},user_b.eq.${otherUser.id}),` +
              `and(user_a.eq.${otherUser.id},user_b.eq.${meUser.id})`
          )
          .maybeSingle();
        if (matchLookupErr) {
          throw matchLookupErr;
        }

        let matchRecord = existingMatch;
        if (!matchRecord) {
          const { data: insertedMatch, error: insertMatchErr } = await supabase
            .from("matches")
            .insert([
              {
                user_a: meUser.id,
                user_b: otherUser.id,
                matched_at: new Date().toISOString(),
              },
            ])
            .select("id")
            .single();

          if (insertMatchErr) {
            throw insertMatchErr;
          }
          matchRecord = insertedMatch;
        }

        if (!mounted) return;
        const matchId = matchRecord.id;

        const { data: existingChat, error: chatLookupErr } = await supabase
          .from("chats")
          .select("id")
          .eq("match_id", matchId)
          .maybeSingle();
        if (chatLookupErr) {
          throw chatLookupErr;
        }

        let chatRecord = existingChat;
        if (!chatRecord) {
          const { data: newChat, error: createChatErr } = await supabase
            .from("chats")
            .insert({ match_id: matchId })
            .select("id")
            .single();

          if (createChatErr) {
            throw createChatErr;
          }
          chatRecord = newChat;
        }

        if (!mounted) return;
        setChatId(chatRecord.id);

        const { data: history, error: histErr } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatRecord.id)
          .order("sent_at", { ascending: true });
        if (histErr) {
          throw histErr;
        } else if (mounted) {
          setMessages(history);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }

        channelRef.current = supabase
          .channel(`chat_messages_${chatRecord.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `chat_id=eq.${chatRecord.id}`,
            },
            (payload) => {
              if (!mounted) return;
              setMessages((prev) => [...prev, payload.new]);
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Chat initialization error:", err);
        if (mounted) {
          setError(err.message || "Failed to initialize chat");
        }
      }
    })();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [otherUser?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !me || !chatId || isSending) {
      return;
    }

    const content = newMessage.trim();
    const tempId = Date.now().toString(); // Temporary ID for optimistic update
    const payload = {
      id: tempId, // Temporary ID
      chat_id: chatId,
      sender_id: me.id,
      content,
      sent_at: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, payload]);
    setNewMessage("");
    setIsSending(true);

    try {
      const { data: insertedMessage, error: insertErr } = await supabase
        .from("messages")
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        throw insertErr;
      }

      // Replace the temporary message with the real one from the database
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== tempId),
        insertedMessage,
      ]);
    } catch (err) {
      console.error("Message send error:", err);
      // Rollback optimistic update
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      Alert.alert(
        "Message not sent",
        err.message || "Could not send message. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!me || chatId === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
          keyExtractor={(item) => item.id.toString()}
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
                {item.id.toString().length > 15 && (
                  <Text style={styles.sendingText}>Sending...</Text>
                )}
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
            editable={!isSending}
          />
          <Button
            title="Send"
            onPress={handleSend}
            disabled={isSending || !newMessage.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    padding: 20,
    textAlign: "center",
  },
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
  sendingText: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
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
