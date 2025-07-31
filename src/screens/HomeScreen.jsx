import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Text,
  View,
  Animated,
  PanResponder,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileCard from "../../components/ProfileCard";
import { supabase } from "../../Lib/supabase";
import { TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

// Tinder Swipe Settings
const SWIPE_THRESHOLD = 120;
const MAX_ROTATION = 8;
const MAX_SINK = 12;

// Improved logic for matching preferences
function matchesPreferences(user, prefs) {
  // If nothing is selected, always return true (show everyone)
  if (
    !prefs ||
    Object.values(prefs).every(
      (val) => val === undefined || val.length === 0 || val === ""
    )
  ) {
    return true;
  }
  // Ethnicities
  if (prefs.ethnicities && prefs.ethnicities.length) {
    const eth = user.ethnicities || [];
    if (!eth.some((e) => prefs.ethnicities.includes(e))) return false;
  }
  // Looking For (sex/gender)
  if (prefs.lookingFor && prefs.lookingFor.length) {
    // user.sex or user.gender, fallback to sex
    const userSex =
      typeof user.sex === "string"
        ? user.sex
        : typeof user.gender === "string"
        ? user.gender
        : "";
    if (!prefs.lookingFor.includes(userSex)) return false;
  }
  // Relationship
  if (prefs.relationship && prefs.relationship.length) {
    const rel = Array.isArray(user.relationship)
      ? user.relationship
      : [user.relationship];
    if (!rel.some((r) => prefs.relationship.includes(r))) return false;
  }
  // Has Kids
  if (prefs.hasKids && prefs.hasKids.length) {
    const val =
      user.has_kids === true
        ? "Yes"
        : user.has_kids === false
        ? "No"
        : user.has_kids;
    if (!prefs.hasKids.includes(val)) return false;
  }
  // Wants Kids
  if (prefs.wantsKids && prefs.wantsKids.length) {
    const val =
      user.wants_kids === true
        ? "Yes"
        : user.wants_kids === false
        ? "No"
        : user.wants_kids;
    if (!prefs.wantsKids.includes(val)) return false;
  }
  // Religion
  if (prefs.religion && prefs.religion.length) {
    if (!prefs.religion.includes(user.religion)) return false;
  }
  // Alcohol
  if (prefs.alcohol && prefs.alcohol.length) {
    if (!prefs.alcohol.includes(user.alcohol)) return false;
  }
  // Cigarettes
  if (prefs.cigarettes && prefs.cigarettes.length) {
    if (!prefs.cigarettes.includes(user.cigarettes)) return false;
  }
  // Weed
  if (prefs.weed && prefs.weed.length) {
    if (!prefs.weed.includes(user.weed)) return false;
  }
  // Drugs
  if (prefs.drugs && prefs.drugs.length) {
    if (!prefs.drugs.includes(user.drugs)) return false;
  }
  return true;
}

export default function HomeScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  // Load Profiles
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();
        if (sessionErr || !session) console.error("Session error:", sessionErr);
        const me = session?.user?.id;
        setMyId(me);

        // likes / dislikes already made
         const [
          { data: likedRows = [] },
          { data: dislikedRows = [] },
          { data: likedMeRows = [] },
        ] = await Promise.all([
          supabase.from("likes").select("likee_id").eq("liker_id", me),
          supabase.from("dislikes").select("dislikee_id").eq("disliker_id", me),
          supabase.from("likes").select("liker_id").eq("likee_id", me),
        ]);
        const likedIds = new Set(likedRows.map((r) => r.likee_id));
        const dislikedIds = new Set(dislikedRows.map((r) => r.dislikee_id));
        const likedMeIds = new Set(likedMeRows.map((r) => r.liker_id));

        // Fetch preferences from storage
        const prefStr = await AsyncStorage.getItem("searchPrefs");
        const prefs = prefStr ? JSON.parse(prefStr) : null;

        // Get all users
        const { data, error } = await supabase.from("users").select(`
          id, first_name, age, city, country, ethnicities, relationship,
          has_kids, wants_kids, religion, alcohol, cigarettes, weed, drugs, bio, sex,
          incognito,
          user_images ( url )
        `);
        if (error) throw error;

        // filter: not self, not liked, not disliked
        let filtered = data.filter(
          (u) =>
            u.id !== me &&
            !likedIds.has(u.id) &&
            !dislikedIds.has(u.id) &&
            (!u.incognito || likedMeIds.has(u.id))
        );
        // apply preferences if they exist
        filtered = filtered.filter((u) => matchesPreferences(u, prefs));

        const formatted = filtered.map((u) => ({
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
          sex: u.sex,
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

  // like and dislike functions
  const handleLike = useCallback(
    async (user) => {
      setProfiles((p) => p.filter((u) => u.id !== user.id));
      setLastAction({ type: "like", user });
      try {
        await supabase
          .from("likes")
          .insert({ liker_id: myId, likee_id: user.id });
        await supabase
          .from("message_requests")
          .update({ accepted: true, accepted_at: new Date().toISOString() })
          .eq("sender_id", user.id)
          .eq("receiver_id", myId);
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
        await supabase
          .from("message_requests")
          .update({ accepted: false, accepted_at: null })
          .eq("sender_id", user.id)
          .eq("receiver_id", myId);
      } else if (type === "dislike") {
        await supabase
          .from("dislikes")
          .delete()
          .eq("disliker_id", myId)
          .eq("dislikee_id", user.id);
      }
    } catch (e) {
      console.error("Error reversing action:", e);
    } finally {
      setLastAction(null);
    }
  }, [lastAction, myId]);

  // swipeable profile card component
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
      <TouchableOpacity style={styles.fab} onPress={handleUndo}>
        <MaterialIcons name="undo" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardWrapper: {},
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6200ee",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
