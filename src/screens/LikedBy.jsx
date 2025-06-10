// src/screens/LikedBy.jsx

import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../Lib/supabase";

import LikedByCard from "../../components/LikedByCard";
import MsgReqCircleCard from "../../components/MsgReqCircleCard";

const { width } = Dimensions.get("window");
// keep your existing CARD_WIDTH / CARD_HEIGHT definitions in case they're used downstream
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

export default function LikedBy() {
  const navigation = useNavigation();
  const [msgRequests, setMsgRequests] = useState([]);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // 1) who am I?
        const {
          data: { session },
          error: sessErr,
        } = await supabase.auth.getSession();
        if (sessErr || !session) {
          console.error("session error:", sessErr);
          if (isMounted) setLoading(false);
          return;
        }
        const me = session.user;

        // ─── First: figure out who I've liked (to filter them out) ───
        const { data: myLikesRows = [], error: myLikesErr } = await supabase
          .from("likes")
          .select("likee_id")
          .eq("liker_id", me.id);
        if (myLikesErr) {
          console.error("could not load my likes:", myLikesErr);
        }
        const myLikedIds = new Set(myLikesRows.map((r) => r.likee_id));

        // ─── Next: load all matches for me (so we can find chats) ───
        const { data: matchRows = [], error: matchErr } = await supabase
          .from("matches")
          .select("id, user_a, user_b")
          .or(`user_a.eq.${me.id},user_b.eq.${me.id}`);
        if (matchErr) {
          console.error("could not load matches:", matchErr);
        }

        // map match → otherUserId
        const otherByMatch = {};
        matchRows.forEach((m) => {
          otherByMatch[m.id] =
            m.user_a === me.id ? m.user_b : m.user_a;
        });
        const matchIds = matchRows.map((m) => m.id);

        // ─── Next: load all chats for those matches ───
        const { data: chatRows = [], error: chatErr } = await supabase
          .from("chats")
          .select("id, match_id")
          .in("match_id", matchIds);
        if (chatErr) {
          console.error("could not load chats:", chatErr);
        }

        // map chat → otherUserId
        const userByChat = {};
        chatRows.forEach((c) => {
          userByChat[c.id] = otherByMatch[c.match_id];
        });
        const chatIds = chatRows.map((c) => c.id);

        // ─── Next: load all messages for those chats ───
        const { data: msgRows = [], error: msgErr } = await supabase
          .from("messages")
          .select("chat_id, sender_id")
          .in("chat_id", chatIds);
        if (msgErr) {
          console.error("could not load messages:", msgErr);
        }

        // determine for each chat whether other/user have spoken
        const chatStats = {};
        msgRows.forEach((m) => {
          if (!chatStats[m.chat_id]) {
            chatStats[m.chat_id] = { fromOther: false, fromMe: false };
          }
          if (m.sender_id === me.id) {
            chatStats[m.chat_id].fromMe = true;
          } else {
            chatStats[m.chat_id].fromOther = true;
          }
        });

        // assemble the set of requesters:
        // they spoke to me, I never spoke back, and I haven't liked them
        const reqIds = new Set();
        Object.entries(chatStats).forEach(([chatId, stats]) => {
          if (
            stats.fromOther &&
            !stats.fromMe
          ) {
            const otherId = userByChat[chatId];
            if (!myLikedIds.has(otherId)) {
              reqIds.add(otherId);
            }
          }
        });
        const reqArray = Array.from(reqIds);

        // fetch their profiles (name + avatar) for the strip
        let requests = [];
        if (reqArray.length > 0) {
          const { data: usersReq = [], error: usersReqErr } =
            await supabase
              .from("users")
              .select("id, first_name, user_images ( url )")
              .in("id", reqArray);
          if (usersReqErr) {
            console.error("could not load requesters' profiles:", usersReqErr);
          } else {
            requests = usersReq.map((u) => ({
              id: u.id,
              firstName: u.first_name,
              photoUrl: u.user_images?.[0]?.url ?? null,
            }));
          }
        }
        if (isMounted) setMsgRequests(requests);

        // ─── THEN fall back into your existing “liked-by” logic ───

        // who liked me?
        const { data: likesRows = [], error: likesErr } = await supabase
          .from("likes")
          .select("liker_id")
          .eq("likee_id", me.id);
        if (likesErr) {
          console.error("Error fetching who liked me:", likesErr);
          if (isMounted) setLoading(false);
          return;
        }
        const likerIds = likesRows.map((r) => r.liker_id);

        // who I have already liked?
        // (we already have myLikedIds from above)

        // filter out mutual likes
        const filteredIds = likerIds.filter(
          (id) => !myLikedIds.has(id)
        );
        if (filteredIds.length === 0) {
          if (isMounted) {
            setLikedUsers([]);
            setLoading(false);
          }
          return;
        }

        // fetch their full profiles
        const { data: usersData = [], error: usersErr } =
          await supabase
            .from("users")
            .select(
              `
              id,
              first_name,
              age,
              city,
              country,
              ethnicities,
              relationship,
              has_kids,
              wants_kids,
              religion,
              alcohol,
              cigarettes,
              weed,
              drugs,
              bio,
              user_images ( url )
            `
            )
            .in("id", filteredIds);
        if (usersErr) {
          console.error("Error fetching user profiles:", usersErr);
          if (isMounted) setLoading(false);
          return;
        }

        const formatted = usersData.map((u) => ({
          id: u.id,
          firstName: u.first_name,
          age: u.age,
          location: { city: u.city, country: u.country },
          ethnicities: u.ethnicities,
          relationshipType: u.relationship,
          hasKids: u.has_kids,
          wantsKids: u.wants_kids,
          religion: u.religion,
          alcohol: u.alcohol,
          cigarettes: u.cigarettes,
          weed: u.weed,
          drugs: u.drugs,
          bio: u.bio,
          photoUrl: u.user_images?.[0]?.url ?? null,
        }));

        if (isMounted) {
          setLikedUsers(formatted);
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected LikedBy error:", err);
        if (isMounted) setLoading(false);
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
      <Text style={styles.section}>Liked By</Text>

      {/* message-requests strip */}
      {msgRequests.length > 0 && (
        <View style={styles.requestsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.requestsScroll}
          >
            {msgRequests.map((u) => (
              <MsgReqCircleCard
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

      {/* Existing grid of “liked by” cards */}
      <FlatList
        data={likedUsers}
        keyExtractor={(u) => u.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <LikedByCard
            {...item}
            onPress={() =>
              navigation.navigate("OtherUserProfile", { user: item })
            }
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.noMatches}>
              No one has liked you yet
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  section: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    marginTop: 16,
  },
  requestsContainer: {
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 8,
    backgroundColor: "#fafafa",
  },
  requestsScroll: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  noMatches: {
    fontSize: 16,
    color: "#665",
  },
});
