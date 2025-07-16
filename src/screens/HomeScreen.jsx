import React, { useEffect, useState, useCallback, useRef } from "react";
import { Text, View, Animated, PanResponder, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileCard from "../../components/ProfileCard";
import UndoLastAction from "../../components/undoLastAction";
import { supabase } from "../../Lib/supabase";

/* ───── configurable feel ───────────────────────────────────────── */
const SWIPE_THRESHOLD = 120; // px to trigger like / dislike
const MAX_ROTATION = 8; // deg tilt at threshold
const MAX_SINK = 12; // px card “drops” while dragging
/* ───────────────────────────────────────────────────────────────── */

export default function HomeScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  /* ─────────────── 1. Load profiles (same logic) ───────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        /* current user */
        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();
        if (sessionErr || !session) console.error("Session error:", sessionErr);
        const me = session?.user?.id;
        setMyId(me);

        /* likes / dislikes already made */
        const [{ data: likedRows = [] }, { data: dislikedRows = [] }] =
          await Promise.all([
            supabase.from("likes").select("likee_id").eq("liker_id", me),
            supabase
              .from("dislikes")
              .select("dislikee_id")
              .eq("disliker_id", me),
          ]);

        const likedIds = new Set(likedRows.map((r) => r.likee_id));
        const dislikedIds = new Set(dislikedRows.map((r) => r.dislikee_id));

        /* all users + first image */
        const { data, error } = await supabase.from("users").select(`
          id, first_name, age, city, country, ethnicities, relationship,
          has_kids, wants_kids, religion, alcohol, cigarettes, weed, drugs, bio,
          user_images ( url )
        `);
        if (error) throw error;

        /* filter & shape for <ProfileCard> */
        const formatted = data
          .filter(
            (u) => u.id !== me && !likedIds.has(u.id) && !dislikedIds.has(u.id)
          )
          .map((u) => ({
            id: u.id,
            firstName: u.first_name,
            age: u.age,
            location: { city: u.city, country: u.country },
            ethnicities: u.ethnicities,
            relationshipType: Array.isArray(u.relationship)
              ? u.relationship
              : u.relationship
              ? [u.relationship]
              : [],
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
        setProfiles(formatted);
      } catch (err) {
        console.error("Error loading profiles:", err);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────────── 2. Write like / dislike rows ─────────────────── */
  const handleLike = useCallback(
    async (user) => {
      setProfiles((p) => p.filter((u) => u.id !== user.id)); // optimistic
      setLastAction({ type: "like", user });
      try {
        await supabase
          .from("likes")
          .insert({ liker_id: myId, likee_id: user.id });
      } catch (e) {
        console.error("Error saving like:", e);
      }
    },
    [myId]
  );

  const handleDislike = useCallback(
    async (user) => {
      setProfiles((p) => p.filter((u) => u.id !== user.id));
      setLastAction({ type: "dislike", user });
      try {
        await supabase
          .from("dislikes")
          .insert({ disliker_id: myId, dislikee_id: user.id });
      } catch (e) {
        console.error("Error saving dislike:", e);
      }
    },
    [myId]
  );

  const handleUndo = useCallback(async () => {
    if (!lastAction) return;
    const { type, user } = lastAction;
    setProfiles((p) => [user, ...p]);
    try {
      if (type === "like") {
        await supabase
          .from("likes")
          .delete()
          .eq("liker_id", myId)
          .eq("likee_id", user.id);
      } else if (type === "dislike") {
        await supabase
          .from("dislikes")
          .delete()
          .eq("disliker_id", myId)
          .eq("dislikee_id", user.id);
      }
    } catch (e) {
      console.error("Error undoing action:", e);
    } finally {
      setLastAction(null);
    }
  }, [lastAction, myId]);

  /* ───────── 3. One swipe-enabled card component ──────────────── */
  function SwipeableProfileCard({ user }) {
    const translateX = useRef(new Animated.Value(0)).current;

    const rotateZ = translateX.interpolate({
      inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      outputRange: [`-${MAX_ROTATION}deg`, "0deg", `${MAX_ROTATION}deg`],
      extrapolate: "clamp",
    });

    const translateY = translateX.interpolate({
      inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      outputRange: [MAX_SINK, 0, MAX_SINK],
      extrapolate: "clamp",
    });

    const pan = useRef(
      PanResponder.create({
        /* don’t steal taps — only start on noticeable horizontal drag */
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 5,
        onPanResponderMove: Animated.event([null, { dx: translateX }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, g) => {
          if (g.dx > SWIPE_THRESHOLD) {
            Animated.timing(translateX, {
              toValue: 500,
              duration: 200,
              useNativeDriver: true,
            }).start(() => handleLike(user));
          } else if (g.dx < -SWIPE_THRESHOLD) {
            Animated.timing(translateX, {
              toValue: -500,
              duration: 200,
              useNativeDriver: true,
            }).start(() => handleDislike(user));
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      })
    ).current;

    return (
      <Animated.View
        style={{
          transform: [{ translateX }, { translateY }, { rotateZ }],
          marginVertical: 4,
        }}
        {...pan.panHandlers}
      >
        <ProfileCard
          {...user}
          onPress={() => navigation.navigate("OtherUserProfile", { user })}
        />
      </Animated.View>
    );
  }

  /* ───────────── 4. Render ─────────────────────────────────────── */
  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="pt-[25px] flex-1 justify-center items-center"
      >
        <Text>Loading profiles…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="pt-[25px] flex-1">
      <FlatList
        data={profiles}
        keyExtractor={(u) => u.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center">
            <Text>No profiles found.</Text>
          </View>
        )}
        renderItem={({ item }) => <SwipeableProfileCard user={item} />}
        />
        <UndoLastAction onPress={handleUndo} style={styles.fab} iconColor="#fff" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardWrapper: {
    // …your existing card styles
  },
  // ── FAB styles ──
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',      // Material purple 500
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,                     // Android shadow
    shadowColor: '#000',              // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 32,
  },
  // …rest of your existing styles
});

// const DUMMY = [
//   {
//     id: "1",
//     firstName: "Alice",
//     age: 27,
//     location: { city: "London", country: "UK" },
//     ethnicities: ["Asian", "White"],
//     relationshipType: "Long-term",
//     hasKids: false,
//     wantsKids: true,
//     religion: "None",
//     alcohol: "Socially",
//     cigarettes: "Never",
//     weed: "Often",
//     drugs: "Never",
//     photoUrl:
//       "https://img.buzzfeed.com/buzzfeed-static/static/2019-10/21/13/asset/bca59df568fc/sub-buzz-4034-1571664623-1.jpg",
//   },
//   {
//     id: "2",
//     firstName: "Beth",
//     age: 30,
//     location: { city: "Manchester", country: "UK" },
//     ethnicities: ["Black"],
//     relationshipType: "Long-term",
//     hasKids: true,
//     wantsKids: false,
//     religion: "Christian",
//     alcohol: "Never",
//     cigarettes: "Socially",
//     weed: "Never",
//     drugs: "Never",
//     photoUrl:
//       "https://i.redd.it/how-do-i-achieve-the-ig-baddie-aesthetic-pls-drop-your-best-v0-8pjv85ei5hya1.jpg?width=1170&format=pjpg&auto=webp&s=65f4401350e38bd73a294defbf8e86893dd93c28",
//   },
//   {
//     id: "3",
//     firstName: "Chloe",
//     age: 24,
//     location: { city: "Birmingham", country: "UK" },
//     ethnicities: ["Hispanic"],
//     relationshipType: "Friends",
//     hasKids: false,
//     wantsKids: true,
//     religion: "Buddhist",
//     alcohol: "Never",
//     cigarettes: "Never",
//     weed: "Socially",
//     drugs: "Never",
//     photoUrl:
//       "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
//   },
//   {
//     id: "4",
//     firstName: "Diana",
//     age: 35,
//     location: { city: "Leeds", country: "UK" },
//     ethnicities: ["White"],
//     relationshipType: "Long-term",
//     hasKids: true,
//     wantsKids: true,
//     religion: "None",
//     alcohol: "Socially",
//     cigarettes: "Often",
//     weed: "Never",
//     drugs: "Never",
//     photoUrl:
//       "https://cdn.britannica.com/67/194367-050-908BD6E8/Diana-princess-Wales-1989.jpg",
//   },
//   {
//     id: "5",
//     firstName: "Emma",
//     age: 29,
//     location: { city: "Glasgow", country: "UK" },
//     ethnicities: ["Mixed"],
//     relationshipType: "Long-term",
//     hasKids: false,
//     wantsKids: false,
//     religion: "None",
//     alcohol: "Socially",
//     cigarettes: "Never",
//     weed: "Often",
//     drugs: "Never",
//     photoUrl:
//       "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg",
//   },
// ];
