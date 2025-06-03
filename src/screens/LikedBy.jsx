// src/screens/LikedBy.jsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../Lib/supabase";
import LikedByCard from "../../components/LikedByCard";

const { width } = Dimensions.get("window");
// match ProfileScreen grid: 16px padding each side + 16px between cards
const CARD_WIDTH = (width - 48) / 2;
// make cards 20% taller than wide
const CARD_HEIGHT = CARD_WIDTH * 1.2;

export default function LikedBy() {
  const navigation = useNavigation();
  const [likedUsers, setLikedUsers] = useState([]); // real data instead of DUMMY
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // 1) Get current user's session
        const {
          data: { session },
          error: sessErr,
        } = await supabase.auth.getSession();
        if (sessErr || !session) {
          console.error("Could not get session:", sessErr);
          if (isMounted) setLoading(false);
          return;
        }
        const me = session.user;

        // 2) Fetch all "likes" where likee_id === current user's ID
        const { data: likesRows, error: likesErr } = await supabase
          .from("likes")
          .select("liker_id")
          .eq("likee_id", me.id);
        if (likesErr) {
          console.error("Error fetching likes for current user:", likesErr);
          if (isMounted) setLoading(false);
          return;
        }

        // 3) Extract array of user IDs who liked the current user
        const likerIds = likesRows.map((row) => row.liker_id);

        // 4) If no one has liked yet, clear array and finish
        if (likerIds.length === 0) {
          if (isMounted) {
            setLikedUsers([]);
            setLoading(false);
          }
          return;
        }

        // 5) Fetch user profiles for those likerIds, including their first image
        //    We select all columns we need plus user_images (joined) to get at least one URL
        const { data: usersData, error: usersErr } = await supabase
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
          .in("id", likerIds);

        if (usersErr) {
          console.error("Error fetching user profiles:", usersErr);
          if (isMounted) setLoading(false);
          return;
        }

        // 6) Massage data into the shape that LikedByCard expects
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
          // take the first user_image URL if present
          photoUrl: u.user_images?.[0]?.url || null,
        }));

        if (isMounted) {
          setLikedUsers(formatted);
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error in LikedBy useEffect:", err);
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 7) Show loading spinner while fetching
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.section}>Liked By</Text>
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
            <Text style={styles.noMatches}>No one has liked you yet.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  section: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    marginTop: 16,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 40, // height of image + space for text
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  cardInfo: {
    marginTop: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardLocation: {
    fontSize: 14,
    color: "#888",
  },
});
