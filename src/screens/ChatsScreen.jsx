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
      // 1) get session
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
      const { data: matchRows, error: matchErr } = await supabase
        .from("matches")
        .select("id, user_a, user_b, matched_at")
        .or(`user_a.eq.${me.id},user_b.eq.${me.id}`)
        .order("matched_at", { ascending: false });

      if (matchErr) {
        console.error("Error fetching matches:", matchErr);
        if (isMounted) setLoading(false);
        return;
      }

      const otherIds = matchRows.map((m) =>
        m.user_a === me.id ? m.user_b : m.user_a
      );

      // 3) fetch full user profiles INCLUDING all needed fields
      let userMap = {};
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

      // 4) fetch chats to see which matches have chats
      const { data: userChats = [], error: chatsErr } = await supabase
        .from("chats")
        .select("match_id");

      if (chatsErr) {
        console.error("Error fetching chats:", chatsErr);
        if (isMounted) setLoading(false);
        return;
      }
      const chatMatchIds = new Set(userChats.map((c) => c.match_id));

      // 5) split into unmatched matches vs active chats
      const newMatches = [];
      const newChats = [];

      matchRows.forEach((match) => {
        const otherUserId =
          match.user_a === me.id ? match.user_b : match.user_a;
        const u = userMap[otherUserId];
        if (!u) return;

        if (chatMatchIds.has(match.id)) {
          newChats.push({
            matchId: match.id,
            user: u,
            lastMessage: null,
          });
        } else {
          newMatches.push(u);
        }
      });

      // 6) fetch last messages for active chats
      if (newChats.length) {
        const { data: lastMessages = [], error: msgErr } = await supabase
          .from("messages")
          .select("chat_id, content, sent_at")
          .in(
            "chat_id",
            newChats.map((c) => c.matchId)
          )
          .order("sent_at", { ascending: false });

        if (!msgErr) {
          const byChat = lastMessages.reduce((acc, m) => {
            if (!acc[m.chat_id]) acc[m.chat_id] = m;
            return acc;
          }, {});
          newChats.forEach((c) => {
            c.lastMessage = byChat[c.matchId] ?? null;
          });
        }
      }

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
