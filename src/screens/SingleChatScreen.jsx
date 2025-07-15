import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
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

  // — Header: avatar + name + back button —
  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: "center",
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          {otherUser?.photoUrl && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Home", {
                  screen: "OtherUserProfile",
                  params: { user: otherUser, hideSendMessage: true },
                })
              }
            >
              <Image
                source={{ uri: otherUser.photoUrl }}
                style={styles.headerAvatar}
              />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitleText}>
            {otherUser?.firstName || "Chat"}
          </Text>
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Chats")}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUser?.firstName, otherUser?.photoUrl]);

  const [me, setMe] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [otherLikedMe, setOtherLikedMe] = useState(false);
  const [mySentCount, setMySentCount] = useState(0);
  const flatListRef = useRef();
  const channelRef = useRef();

  useEffect(() => {
    let mounted = true;
    setError(null);

    (async () => {
      try {
        // 1) session
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

        // 2) match lookup/creation
        const { data: existingMatch, error: matchErr } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user_a.eq.${meUser.id},user_b.eq.${otherUser.id}),` +
              `and(user_a.eq.${otherUser.id},user_b.eq.${meUser.id})`
          )
          .maybeSingle();
        if (matchErr) throw matchErr;

        let matchRecord = existingMatch;
        if (!matchRecord) {
          const { data: insertedMatch, error: insertErr } = await supabase
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
          if (insertErr) throw insertErr;
          matchRecord = insertedMatch;
        }
        if (!mounted) return;

        // 3) chat lookup/creation
        const matchId = matchRecord.id;
        const { data: existingChat, error: chatErr } = await supabase
          .from("chats")
          .select("id")
          .eq("match_id", matchId)
          .maybeSingle();
        if (chatErr) throw chatErr;

        let chatRecord = existingChat;
        if (!chatRecord) {
          const { data: newChat, error: createErr } = await supabase
            .from("chats")
            .insert({ match_id: matchId })
            .select("id")
            .single();
          if (createErr) throw createErr;
          chatRecord = newChat;
        }
        if (!mounted) return;

        setChatId(chatRecord.id);

         // check if the other user already liked me
         const { data: likeRow, error: likeErr } = await supabase
         .from("likes")
         .select("id")
         .eq("liker_id", otherUser.id)
         .eq("likee_id", meUser.id)
         .maybeSingle();
       if (likeErr) console.error("Like check error:", likeErr);
       if (mounted) setOtherLikedMe(!!likeRow);

        // 4) load history
        const { data: history, error: histErr } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatRecord.id)
          .order("sent_at", { ascending: true });
        if (histErr) throw histErr;

        if (mounted) {
          setMessages(history);
  // count messages I've sent so far
  const count = history.filter((m) => m.sender_id === meUser.id).length;
  setMySentCount(count);

          // ← IMMEDIATELY mark all incoming as read
          await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("chat_id", chatRecord.id)
            .neq("sender_id", meUser.id);

          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: false }),
            100
          );
        }

        // 5) subscribe to new messages
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
            ({ new: newMsg }) => {
              if (!mounted) return;
              setMessages((prev) => [...prev, newMsg]);
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

  // 6) send message
  const handleSend = async () => {
    if (!newMessage.trim() || !me || !chatId || isSending) return;

     // re-check if other user liked me back
     if (!otherLikedMe) {
      const { data: likeRow, error: likeErr } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", otherUser.id)
        .eq("likee_id", me.id)
        .maybeSingle();
      if (likeErr) console.error("Like check error:", likeErr);
      if (likeRow) {
        setOtherLikedMe(true);
      } else if (mySentCount >= 1) {
        Alert.alert(
          "Message limit reached",
          "You can only send one message until they like you back."
        );
        return;
      }
    }

    const content = newMessage.trim();
    const tempId = Date.now().toString();
    const payload = {
      id: tempId,
      chat_id: chatId,
      sender_id: me.id,
      content,
      sent_at: new Date().toISOString(),
    };

    // Optimistic UI
    setMessages((prev) => [...prev, payload]);
    setNewMessage("");
    setIsSending(true);

    try {
      const { data: inserted, error: insertErr } = await supabase
        .from("messages")
        .insert([payload])
        .select()
        .single();
      if (insertErr) throw insertErr;

      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), inserted]);
      setMySentCount((c) => c + 1);
    } catch (err) {
      console.error("Message send error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMySentCount((c) => Math.max(0, c - 1));
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
            const isMe = item.sender_id === me.id;
            return (
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.myBubble : styles.theirBubble,
                ]}
              >
                <Text style={styles.messageText}>{item.content}</Text>
                {item.id.toString().length > 15 && (
                  <Text style={styles.sendingText}>Sending…</Text>
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
            editable={!isSending && (otherLikedMe || mySentCount === 0)}
          />
          <Button
            title="Send"
            onPress={handleSend}
            disabled={
              isSending ||
              !newMessage.trim() ||
              (!otherLikedMe && mySentCount >= 1)
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", padding: 20, textAlign: "center" },
  chatContent: { padding: 16, paddingBottom: 0 },
  bubble: { marginVertical: 4, padding: 10, borderRadius: 16, maxWidth: "75%" },
  myBubble: { alignSelf: "flex-end", backgroundColor: "#DCF8C5" },
  theirBubble: { alignSelf: "flex-start", backgroundColor: "#ECECEC" },
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
  headerTitleContainer: { alignItems: "center" },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginBottom: 4 },
  headerTitleText: { fontSize: 16, fontWeight: "bold" },
});
