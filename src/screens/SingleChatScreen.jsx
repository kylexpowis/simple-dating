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
  Modal,
  Pressable,
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

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: "center",
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          {otherUser?.photoUrl && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("OtherUserProfile", {
                  user: otherUser,
                  hideSendMessage: true,
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
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible((v) => !v)}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerBackTitleVisible: false,
    });
  }, [navigation, otherUser?.firstName, otherUser?.photoUrl]);

  const [me, setMe] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmUnmatchVisible, setConfirmUnmatchVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const flatListRef = useRef();
  const channelRef = useRef();

  useEffect(() => {
    let mounted = true;
    setError(null);

    (async () => {
      try {
        // session
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

        // determine match status and existing message request
        const [
          { data: likeMe },
          { data: likeThem },
          { data: outgoingReq },
          { data: incomingReq },
        ] = await Promise.all([
          supabase
            .from("likes")
            .select("id")
            .eq("liker_id", meUser.id)
            .eq("likee_id", otherUser.id)
            .maybeSingle(),
          supabase
            .from("likes")
            .select("id")
            .eq("liker_id", otherUser.id)
            .eq("likee_id", meUser.id)
            .maybeSingle(),
          supabase
            .from("message_requests")
            .select("accepted")
            .eq("sender_id", meUser.id)
            .eq("receiver_id", otherUser.id)
            .maybeSingle(),
          supabase
            .from("message_requests")
            .select("accepted")
            .eq("sender_id", otherUser.id)
            .eq("receiver_id", meUser.id)
            .maybeSingle(),
        ]);

        const matched =
          !!(likeMe && likeThem) ||
          outgoingReq?.accepted ||
          incomingReq?.accepted;
        if (mounted) {
          setIsMatched(matched);
          setRequestSent(!!outgoingReq && !outgoingReq.accepted);
          setIncomingRequest(!!incomingReq && !incomingReq.accepted);
        }
        // match lookup/creation
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

        // chat lookup/creation
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

        // load history
        const { data: history, error: histErr } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatRecord.id)
          .order("sent_at", { ascending: true });
        if (histErr) throw histErr;

        if (mounted) {
          setMessages(history);

          // ←  mark all incoming as read   ????
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

        // subscribe to new messages
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

  // send message
  const handleSend = async () => {
    if (!newMessage.trim() || !me || !chatId || isSending) return;
    if (!isMatched && requestSent) return;

    const content = newMessage.trim();
    const tempId = Date.now().toString();
    const payload = {
      id: tempId,
      chat_id: chatId,
      sender_id: me.id,
      content,
      sent_at: new Date().toISOString(),
    };

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
      if (!isMatched && !requestSent) {
        await supabase.from("message_requests").insert({
          sender_id: me.id,
          receiver_id: otherUser.id,
        });
        setRequestSent(true);
      }
    } catch (err) {
      console.error("Message send error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert(
        "Message not sent",
        err.message || "Could not send message. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };
  const handleAcceptRequest = async () => {
    if (!me) return;
    try {
      await supabase
        .from("message_requests")
        .update({ accepted: true, accepted_at: new Date().toISOString() })
        .eq("sender_id", otherUser.id)
        .eq("receiver_id", me.id);
      setIncomingRequest(false);
      setIsMatched(true);
    } catch (err) {
      Alert.alert("Could not accept request", err.message);
    }
  };

  const handleIgnoreRequest = async () => {
    if (!me) return;
    try {
      await supabase
        .from("message_requests")
        .delete()
        .eq("sender_id", otherUser.id)
        .eq("receiver_id", me.id);
      await supabase
        .from("dislikes")
        .insert({ disliker_id: me.id, dislikee_id: otherUser.id });
      setIncomingRequest(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Could not ignore request", err.message);
    }
  };

  const handleUnmatch = async () => {
    if (!me) return;
    try {
      await supabase
        .from("matches")
        .delete()
        .or(
          `and(user_a.eq.${me.id},user_b.eq.${otherUser.id}),` +
            `and(user_a.eq.${otherUser.id},user_b.eq.${me.id})`
        );
      Alert.alert("Unmatched", `You have unmatched ${otherUser.firstName}.`);
      navigation.goBack();
    } catch (e) {
      console.error("Unmatch error:", e);
      Alert.alert("Could not unmatch user.");
    }
  };

  const handleSubmitReport = async () => {
    if (!me || !reportReason.trim()) return;
    try {
      await supabase.from("reported_users").insert({
        reporting_user_id: me.id,
        reported_user_id: otherUser.id,
        reason: reportReason.trim(),
        created_at: new Date().toISOString(),
      });
      setReportVisible(false);
      setReportReason("");
      setConfirmUnmatchVisible(true);
    } catch (e) {
      console.error("Report error:", e);
      Alert.alert("Could not report user.");
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
      <Modal transparent visible={menuVisible} animationType="fade">
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setMenuVisible(false);
                setConfirmUnmatchVisible(true);
              }}
            >
              <Text style={styles.menuText}>Unmatch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setMenuVisible(false);
                setReportVisible(true);
              }}
            >
              <Text style={styles.menuText}>Report User</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <Modal transparent visible={reportVisible} animationType="fade">
        <Pressable
          style={styles.confirmOverlay}
          onPress={() => setReportVisible(false)}
        >
          <View style={styles.reportContainer}>
            <Text style={styles.confirmText}>Reason for report</Text>
            <TextInput
              style={styles.reportInput}
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Enter reason"
              multiline
            />
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSubmitReport}
              >
                <Text style={styles.confirmYes}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
      <Modal transparent visible={confirmUnmatchVisible} animationType="fade">
        <Pressable
          style={styles.confirmOverlay}
          onPress={() => setConfirmUnmatchVisible(false)}
        >
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmText}>
              Are you sure you want to unmatch?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setConfirmUnmatchVisible(false);
                  handleUnmatch();
                }}
              >
                <Text style={styles.confirmYes}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setConfirmUnmatchVisible(false)}
              >
                <Text style={styles.confirmNo}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
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

        {isMatched ? (
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
        ) : incomingRequest ? (
          <View style={styles.requestBox}>
            <Text style={styles.pendingText}>
              {otherUser.firstName} wants to chat with you.
            </Text>
            <View style={styles.requestButtons}>
              <Button title="Ignore" onPress={handleIgnoreRequest} />
              <Button title="Accept" onPress={handleAcceptRequest} />
            </View>
          </View>
        ) : !requestSent ? (
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
        ) : (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingText}>
              You can send another message once this user accepts your request.
            </Text>
          </View>
        )}
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
  pendingBox: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  requestBox: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  requestButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  pendingText: { fontStyle: "italic", textAlign: "center", color: "#666" },
  headerTitleContainer: { alignItems: "center" },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginBottom: 4 },
  headerTitleText: { fontSize: 16, fontWeight: "bold" },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 60,
    marginRight: 10,
    paddingVertical: 8,
    width: 150,
  },
  menuOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    width: 260,
  },
  confirmText: { fontSize: 16, textAlign: "center", marginBottom: 16 },
  confirmButtons: { flexDirection: "row", justifyContent: "space-around" },
  confirmButton: { paddingHorizontal: 20, paddingVertical: 8 },
  confirmYes: { color: "blue", fontSize: 16 },
  confirmNo: { color: "red", fontSize: 16 },
  reportContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    width: 280,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 12,
  },
});
