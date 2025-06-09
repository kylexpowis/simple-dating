// src/screens/ChatsScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../Lib/supabase";
import MatchedCircleCard from "../../components/MatchedCircleCard";
import SingleChatCard from "../../components/SingleChatCard";

export default function ChatsScreen() {
  const navigation = useNavigation();
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      // 1) get current user
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session) {
        console.error("Error fetching session:", sessErr);
        if (isMounted) setLoading(false);
        return;
      }
      const me = session.user;

      // 2) fetch all matches
      const { data: matchRows = [], error: matchErr } = await supabase
        .from("matches")
        .select("id, user_a, user_b, matched_at")
        .or(`user_a.eq.${me.id},user_b.eq.${me.id}`)
        .order("matched_at", { ascending: false });
      if (matchErr) {
        console.error("Error fetching matches:", matchErr);
        if (isMounted) setLoading(false);
        return;
      }

      // build map: matchId -> otherUserId
      const otherByMatch = {};
      matchRows.forEach((m) => {
        otherByMatch[m.id] = m.user_a === me.id ? m.user_b : m.user_a;
      });
      const matchIds = matchRows.map((m) => m.id);

      // 3) fetch user profiles
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
            user_images ( url )
          `
          )
          .in("id", otherIds);
        if (userErr) {
          console.error("Error fetching user details:", userErr);
          if (isMounted) setLoading(false);
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

      // 4) fetch likes: who I liked & who liked me
      const { data: myLikesRows = [], error: myLikesErr } = await supabase
        .from("likes")
        .select("likee_id")
        .eq("liker_id", me.id);
      if (myLikesErr) console.error("Error fetching my likes:", myLikesErr);
      const myLikedIds = new Set(myLikesRows.map((r) => r.likee_id));

      const { data: theirLikesRows = [], error: theirLikesErr } = await supabase
        .from("likes")
        .select("liker_id")
        .eq("likee_id", me.id);
      if (theirLikesErr)
        console.error("Error fetching others' likes:", theirLikesErr);
      const theirLikedIds = new Set(
        theirLikesRows.map((r) => r.liker_id)
      );

      // 5) fetch chats and messages
      const { data: chatRows = [], error: chatsErr } = await supabase
        .from("chats")
        .select("id, match_id")
        .in("match_id", matchIds);
      if (chatsErr) {
        console.error("Error fetching chats:", chatsErr);
        if (isMounted) setLoading(false);
        return;
      }
      const chatIds = chatRows.map((c) => c.id);

      const { data: msgRows = [], error: msgErr } = await supabase
        .from("messages")
        .select("chat_id, sender_id, content, sent_at")
        .in("chat_id", chatIds)
        .order("sent_at", { ascending: false });
      if (msgErr) console.error("Error fetching messages:", msgErr);

      // compute stats & last message per chat
      const chatStats = {};
      const lastMsgByChat = {};
      msgRows.forEach((m) => {
        if (!chatStats[m.chat_id]) {
          chatStats[m.chat_id] = { fromOther: false, fromMe: false };
        }
        if (m.sender_id === me.id) {
          chatStats[m.chat_id].fromMe = true;
        } else {
          chatStats[m.chat_id].fromOther = true;
        }
        if (!lastMsgByChat[m.chat_id]) {
          lastMsgByChat[m.chat_id] = {
            content: m.content,
            sent_at: m.sent_at,
          };
        }
      });

      // 6) build filtered chats list
      const newChats = [];
      chatRows.forEach((c) => {
        const stats = chatStats[c.id] || {
          fromOther: false,
          fromMe: false,
        };
        const otherId = otherByMatch[c.match_id];
        const mutual = myLikedIds.has(otherId) && theirLikedIds.has(otherId);
        // include if both have talked, OR mutual like + at least one message
        if (
          (stats.fromOther && stats.fromMe) ||
          (mutual && (stats.fromOther || stats.fromMe))
        ) {
          newChats.push({
            matchId: c.match_id,
            user: userMap[otherId],
            lastMessage: lastMsgByChat[c.id] ?? null,
          });
        }
      });

      // 7) build matches strip (no chats, mutual likes only)
      const chatMatchIds = new Set(
        newChats.map((c) => c.matchId)
      );
      const newMatches = matchRows
        .filter((m) => {
          if (chatMatchIds.has(m.id)) return false;
          const otherId = otherByMatch[m.id];
          return myLikedIds.has(otherId) && theirLikedIds.has(otherId);
        })
        .map((m) => userMap[otherByMatch[m.id]]);

      if (isMounted) {
        setMatches(newMatches);
        setChats(newChats);
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Matches strip (mutual likes only, no active chats) */}
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
                  navigation.navigate("OtherUserProfile", { user: u })
                }
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
        contentContainerStyle={
          chats.length === 0 ? { flex: 1 } : undefined
        }
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