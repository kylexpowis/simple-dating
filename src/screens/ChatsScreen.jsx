// src/screens/ChatsScreen
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../Lib/supabase";
import SingleChatScreen from "./SingleChatScreen";

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [meId, setMeId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      // 1) get current user
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session) return console.error(sessErr);
      const me = session.user;
      if (!isMounted) return;
      setMeId(me.id);

      // 2) fetch mutual matches
      let { data: matchRows, error: matchErr } = await supabase
        .from("matches")
        .select("user_a, user_b")
        .or(`user_a.eq.${me.id},user_b.eq.${me.id}`);
      if (matchErr) return console.error(matchErr);

      const otherIds = matchRows.map((m) =>
        m.user_a === me.id ? m.user_b : m.user_a
      );

      // 3) fetch their user info + first image
      if (otherIds.length) {
        const { data: users, error: userErr } = await supabase
          .from("users")
          .select("id, first_name")
          .in("id", otherIds);
        if (userErr) return console.error(userErr);

        const { data: images, error: imgErr } = await supabase
          .from("user_images")
          .select("user_id, url")
          .in("user_id", otherIds);
        if (imgErr) return console.error(imgErr);

        const matchedProfiles = users.map((u) => ({
          id: u.id,
          firstName: u.first_name,
          photoUrl: images.find((i) => i.user_id === u.id)?.url,
        }));
        setMatches(matchedProfiles);
      }

      // 4) fetch latest message per conversation for previews
      //    we can query the messages table, grouped by the other user
      let { data: msgs, error: msgErr } = await supabase.rpc(
        "latest_messages",
        { uid: me.id }
      );
      if (msgErr) return console.error(msgErr);
      // expected return: [{other_id, content, sent_at}, ...]
      if (isMounted) setPreviews(msgs);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Matches strip */}
      <View style={styles.matchesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matchesScroll}
        >
          {matches.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={styles.matchItem}
              onPress={() =>
                navigation.navigate("SingleChatScreen", {
                  otherUserId: u.id,
                })
              }
            >
              {u.photoUrl ? (
                <Image
                  source={{ uri: u.photoUrl }}
                  style={styles.matchAvatar}
                />
              ) : (
                <View style={[styles.matchAvatar, styles.matchPlaceholder]} />
              )}
              <Text style={styles.matchName} numberOfLines={1}>
                {u.firstName}
              </Text>
            </TouchableOpacity>
          ))}

          {/* if no matches yet */}
          {matches.length === 0 && (
            <Text style={styles.noMatches}>No matches yet</Text>
          )}
        </ScrollView>
      </View>

      {/* Message previews */}
      <FlatList
        data={previews}
        keyExtractor={(item) => item.other_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.previewItem}
            onPress={() =>
              navigation.navigate("ChatsScreen", {
                otherUserId: item.other_id,
              })
            }
          >
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
      />
    </View>
  );
}

const AVATAR_SIZE = 50;
const MATCH_ITEM_WIDTH = 60;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  /* Matches strip */
  matchesContainer: {
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 8,
  },
  matchesScroll: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  matchItem: {
    width: MATCH_ITEM_WIDTH,
    alignItems: "center",
    marginRight: 12,
  },
  matchAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#eee",
  },
  matchPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  matchName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  noMatches: {
    color: "#666",
    fontSize: 14,
  },

  /* Previews */
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
});
