import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../Lib/supabase";
import MatchedCircleCard from "../../components/MatchedCircleCard";
import SingleChatCard from "../../components/SingleChatCard";

export default function ChatsScreen() {
  const navigation = useNavigation();
  const [me, setMe] = useState(null);
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Unmatch
  const handleUnmatch = async (otherId) => {
    if (!me) return;
    try {
      const { data, error } = await supabase
        .from("matches")
        .delete()
        .or(
          `and(user_a.eq.${me.id},user_b.eq.${otherId}),` +
            `and(user_b.eq.${me.id},user_a.eq.${otherId})`
        );
      if (error) throw error;
      setMatches((prev) => prev.filter((u) => u.id !== otherId));
    } catch (e) {
      console.error("Error unmatching:", e);
      Alert.alert("Could not unmatch. Please try again.");
    }
  };

  // Fetch everything
  const fetchAll = useCallback(async () => {
    setLoading(true);

    // 1) session
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession();
    if (sessErr || !session) {
      console.error("Error fetching session:", sessErr);
      setLoading(false);
      return;
    }
    const _me = session.user;
    setMe(_me);

    // 2) matches
    const { data: matchRows = [], error: matchErr } = await supabase
      .from("matches")
      .select("id, user_a, user_b, matched_at")
      .or(`user_a.eq.${_me.id},user_b.eq.${_me.id}`)
      .order("matched_at", { ascending: false });
    if (matchErr) {
      console.error("Error fetching matches:", matchErr);
      setLoading(false);
      return;
    }
    const otherByMatch = {};
    matchRows.forEach((m) => {
      otherByMatch[m.id] = m.user_a === _me.id ? m.user_b : m.user_a;
    });
    const matchIds = matchRows.map((m) => m.id);

    // 3) profiles
    let userMap = {};
    const otherIds = Object.values(otherByMatch);
    if (otherIds.length) {
      const { data: users, error: userErr } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          age,
          city,
          country,
          bio,
          ethnicities,
          relationship,
          has_kids,
          wants_kids,
          religion,
          alcohol,
          cigarettes,
          weed,
          drugs,
          user_images(url)
        `
        )
        .in("id", otherIds);
      if (userErr) {
        console.error("Error fetching user details:", userErr);
        setLoading(false);
        return;
      }
      users.forEach((u) => {
        userMap[u.id] = {
          id: u.id,
          firstName: u.first_name,
          age: u.age,
          location: { city: u.city, country: u.country },
          bio: u.bio,
          ethnicities: u.ethnicities,
          relationshipType: u.relationship,
          hasKids: u.has_kids,
          wantsKids: u.wants_kids,
          religion: u.religion,
          alcohol: u.alcohol,
          cigarettes: u.cigarettes,
          weed: u.weed,
          drugs: u.drugs,
          photoUrl: u.user_images?.[0]?.url ?? null,
        };
      });
    }

    // 4) likes
    const { data: myLikesRows = [], error: myLikesErr } = await supabase
      .from("likes")
      .select("likee_id")
      .eq("liker_id", _me.id);
    if (myLikesErr) console.error("Error fetching my likes:", myLikesErr);
    const myLikedIds = new Set(myLikesRows.map((r) => r.likee_id));

    const { data: theirLikesRows = [], error: theirLikesErr } = await supabase
      .from("likes")
      .select("liker_id")
      .eq("likee_id", _me.id);
    if (theirLikesErr)
      console.error("Error fetching others' likes:", theirLikesErr);
    const theirLikedIds = new Set(theirLikesRows.map((r) => r.liker_id));

    // 5) dislikes
    const { data: myDislikesRows = [], error: myDislikesErr } = await supabase
      .from("dislikes")
      .select("dislikee_id")
      .eq("disliker_id", _me.id);
    if (myDislikesErr)
      console.error("Error fetching my dislikes:", myDislikesErr);
    const myDislikedIds = new Set(myDislikesRows.map((r) => r.dislikee_id));

    const { data: theirDislikesRows = [], error: theirDislikesErr } =
      await supabase
        .from("dislikes")
        .select("disliker_id")
        .eq("dislikee_id", _me.id);
    if (theirDislikesErr)
      console.error("Error fetching others' dislikes:", theirDislikesErr);
    const theirDislikedIds = new Set(
      theirDislikesRows.map((r) => r.disliker_id)
    );

    // 6) chats + messages
    const { data: chatRows = [], error: chatsErr } = await supabase
      .from("chats")
      .select("id, match_id")
      .in("match_id", matchIds);
    if (chatsErr) {
      console.error("Error fetching chats:", chatsErr);
      setLoading(false);
      return;
    }
    const chatIds = chatRows.map((c) => c.id);

    const { data: msgRows = [], error: msgErr } = await supabase
      .from("messages")
      .select("chat_id, sender_id, content, sent_at, is_read")
      .in("chat_id", chatIds)
      .order("sent_at", { ascending: false });
    if (msgErr) console.error("Error fetching messages:", msgErr);

    // compute lastMessage + unreadCounts
    const lastMsgByChat = {};
    const unreadCounts = {};
    msgRows.forEach((m) => {
      if (!lastMsgByChat[m.chat_id]) {
        lastMsgByChat[m.chat_id] = {
          content: m.content,
          sent_at: m.sent_at,
        };
      }
      if (m.sender_id !== _me.id && !m.is_read) {
        unreadCounts[m.chat_id] = (unreadCounts[m.chat_id] || 0) + 1;
      }
    });

    // 7) assemble newChats
    let newChats = [];
    chatRows.forEach((c) => {
      const otherId = otherByMatch[c.match_id];
      const mutual = myLikedIds.has(otherId) && theirLikedIds.has(otherId);
      const hasTalked = !!lastMsgByChat[c.id];
      const hasUnread = (unreadCounts[c.id] || 0) > 0;

      // include chat if:
      // • it has unread messages
      // • OR there’s at least one message in it
      if (hasUnread || hasTalked) {
        newChats.push({
          matchId: c.match_id,
          user: userMap[otherId],
          lastMessage: lastMsgByChat[c.id] ?? null,
          unreadCount: unreadCounts[c.id] || 0,
        });
      }
    });

    // sort descending by lastMessage
    newChats.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.sent_at) : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.sent_at) : 0;
      return bTime - aTime;
    });

    // 8) matches strip
    const chatMatchIds = new Set(newChats.map((c) => c.matchId));
    const newMatches = matchRows
      .filter((m) => {
        if (chatMatchIds.has(m.id)) return false;
        const otherId = otherByMatch[m.id];
        if (myDislikedIds.has(otherId) || theirDislikedIds.has(otherId)) {
          return false;
        }
        return myLikedIds.has(otherId) && theirLikedIds.has(otherId);
      })
      .map((m) => userMap[otherByMatch[m.id]]);

    setMatches(newMatches);
    setChats(newChats);
    setLoading(false);
  }, []);

  // initial fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // re-fetch on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Matches strip */}
      {matches.length > 0 && (
        <View style={styles.matchesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesScroll}
          >
            {matches.map((u) => (
              <MatchedCircleCard
                key={u.id}
                firstName={u.firstName}
                photoUrl={u.photoUrl}
                onPress={() =>
                  navigation.navigate("Home", {
                    screen: "OtherUserProfile",
                    params: { user: u },
                  })
                }
                onLongPress={() => handleUnmatch(u.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Chat previews */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.matchId.toString()}
        renderItem={({ item }) => (
          <SingleChatCard
            user={item.user}
            lastMessage={item.lastMessage}
            unreadCount={item.unreadCount}
            onPress={() =>
              navigation.navigate("Home", {
                screen: "SingleChatScreen",
                params: { otherUser: item.user },
              })
            }
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text>No conversations yet</Text>
          </View>
        )}
        contentContainerStyle={chats.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  matchesContainer: {
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 8,
    backgroundColor: "#fafafa",
  },
  matchesScroll: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
