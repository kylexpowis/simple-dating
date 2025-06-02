// src/screens/ChatsScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../Lib/supabase";
import MatchCard from "../../components/MatchCard";

export default function ChatsScreen() {
  const navigation = useNavigation();
  const [matches, setMatches] = useState([]);
  const [previews, setPreviews] = useState([]);
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

      // 2) Fetch mutual matches (just IDs)
      const { data: matchRows, error: matchErr } = await supabase
        .from("matches")
        .select("user_a, user_b")
        .or(`user_a.eq.${me.id},user_b.eq.${me.id}`);
      if (matchErr) {
        console.error("Error fetching matches:", matchErr);
        if (isMounted) setLoading(false);
        return;
      }

      const otherIds = matchRows.map((m) =>
        m.user_a === me.id ? m.user_b : m.user_a
      );

      // 3) Fetch full matched user profiles (all fields) + first image URL
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
            user_images (
              url
            )
          `
          )
          .in("id", otherIds);
        if (userErr) {
          console.error("Error fetching user details:", userErr);
          if (isMounted) setLoading(false);
          return;
        }

        const formatted = users.map((u) => ({
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
          photoUrl: u.user_images?.[0]?.url || null,
        }));

        if (isMounted) setMatches(formatted);
      } else {
        if (isMounted) setMatches([]);
      }

      // 4) (Optional) Fetch latest message previews via RPC—if function exists
      try {
        const { data: msgs, error: msgErr } = await supabase.rpc(
          "latest_messages",
          { uid: me.id }
        );
        if (msgErr) throw msgErr;
        if (isMounted) setPreviews(msgs);
      } catch (rpcError) {
        console.warn(
          "RPC latest_messages failed or not found. Skipping previews:",
          rpcError
        );
        if (isMounted) setPreviews([]);
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
      {/* Matches strip at top */}
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
                navigation.navigate("OtherUserProfile", { user: u })
              }
            />
          ))}

          {matches.length === 0 && (
            <Text style={styles.noMatches}>No matches yet</Text>
          )}
        </ScrollView>
      </View>

      {/* Chats (message previews) below */}
      <FlatList
        data={previews}
        keyExtractor={(item) => item.other_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.previewItem}
            onPress={() =>
              navigation.navigate("SingleChat", {
                otherUserId: item.other_id,
              })
            }
          >
            {/* You can replace this placeholder with the matched user's avatar if you have it */}
            <View style={styles.previewAvatarPlaceholder} />
            <View style={styles.previewText}>
              <Text style={styles.previewName}>{item.other_id}</Text>
              <Text style={styles.previewMessage} numberOfLines={1}>
                {item.content}
              </Text>
            </View>
            <Text style={styles.previewTime}>
              {new Date(item.sent_at).toLocaleTimeString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text>No conversations yet</Text>
          </View>
        )}
        contentContainerStyle={previews.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
}

const AVATAR_SIZE = 50;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  /* Matches strip */
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

  /* Message previews */
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  previewAvatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#ddd",
    marginRight: 12,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontWeight: "600",
  },
  previewMessage: {
    color: "#555",
    marginTop: 2,
  },
  previewTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },

  /* Centered loading state */
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
