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
import MatchCard from "../../components/MatchCard";
import SingleChatCard from "../../components/SingleChatCard";

export default function ChatsScreen() {
  const navigation = useNavigation();
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      // 1) Get current user session
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

      // 2) Fetch all matches (both messaged and unmatched)
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

      // 3) Fetch full user profiles for all matches
      if (otherIds.length) {
        const { data: users, error: userErr } = await supabase
          .from("users")
          .select(
            `
            id,
            first_name,
            age,
            user_images (url)
          `
          )
          .in("id", otherIds);

        if (userErr) {
          console.error("Error fetching user details:", userErr);
          if (isMounted) setLoading(false);
          return;
        }

        const userMap = users.reduce((acc, user) => {
          acc[user.id] = {
            id: user.id,
            firstName: user.first_name,
            age: user.age,
            photoUrl: user.user_images?.[0]?.url || null,
          };
          return acc;
        }, {});

        // 4) Fetch chats to determine which matches have messages
        const { data: userChats, error: chatsErr } = await supabase
          .from("chats")
          .select("match_id")
          .in(
            "match_id",
            matchRows.map((m) => m.id)
          );

        if (chatsErr) {
          console.error("Error fetching chats:", chatsErr);
          if (isMounted) setLoading(false);
          return;
        }

        const chatMatchIds = new Set(userChats.map((c) => c.match_id));

        // 5) Separate into matches (no messages) and chats (has messages)
        const newMatches = [];
        const newChats = [];

        matchRows.forEach((match) => {
          const otherUserId =
            match.user_a === me.id ? match.user_b : match.user_a;
          const user = userMap[otherUserId];

          if (user) {
            if (chatMatchIds.has(match.id)) {
              newChats.push({
                matchId: match.id,
                user,
                lastMessage: null, // Will be updated below
              });
            } else {
              newMatches.push(user);
            }
          }
        });

        // 6) Fetch last messages for chats
        if (newChats.length > 0) {
          const { data: lastMessages, error: messagesErr } = await supabase
            .from("messages")
            .select("id, chat_id, content, sent_at, sender_id")
            .in(
              "chat_id",
              userChats.map((c) => c.match_id)
            )
            .order("sent_at", { ascending: false });

          if (!messagesErr && lastMessages) {
            const messagesByChatId = lastMessages.reduce((acc, message) => {
              if (!acc[message.chat_id]) {
                acc[message.chat_id] = message;
              }
              return acc;
            }, {});

            newChats.forEach((chat) => {
              chat.lastMessage = messagesByChatId[chat.matchId];
            });
          }
        }

        if (isMounted) {
          setMatches(newMatches);
          setChats(newChats);
        }
      } else {
        if (isMounted) {
          setMatches([]);
          setChats([]);
        }
      }

      if (isMounted) setLoading(false);
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
      {/* Matches strip at top - only shows unmatched connections */}
      {matches.length > 0 && (
        <View style={styles.matchesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesScroll}
          >
            {matches.map((u) => (
              <MatchCard
                key={u.id}
                firstName={u.firstName}
                photoUrl={u.photoUrl}
                onPress={() =>
                  navigation.navigate("Home", {
                    screen: "OtherUserProfile",
                    params: { user: u },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Chats list - shows all messaged connections */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.matchId.toString()}
        renderItem={({ item }) => (
          <SingleChatCard user={item.user} lastMessage={item.lastMessage} />
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
  noMatches: {
    color: "#777",
    fontSize: 14,
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
