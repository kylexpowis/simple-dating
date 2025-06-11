import React, { useEffect, useState } from "react";
import { FlatList, Text, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileCard from "../../components/ProfileCard";
import { supabase } from "../../Lib/supabase";

export default function HomeScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      console.log("[1] Starting profile load...");

      try {
        // ─── STEP 1: Get current user ID ───
        console.log("[2] Getting user session...");
        const {
          data: { session },
          error: sessErr,
        } = await supabase.auth.getSession();
        const myId = session?.user?.id;

        console.log("[3] Current user ID:", myId || "No session found");
        if (sessErr) console.error("Session error:", sessErr);

        // ─── STEP 2: Fetch basic user data ───
        console.log("[4] Fetching users from database...");
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, first_name, user_images(url)")
          .limit(20); // Start with small number for debugging

        console.log("[5] Raw users data length:", usersData?.length || 0);

        if (usersError) {
          console.error("[6] Users fetch failed:", usersError);
          Alert.alert("Error", "Failed to load profiles");
          setProfiles([]);
          return;
        }

        if (!usersData || usersData.length === 0) {
          console.warn("[7] No users found in database");
          setProfiles([]);
          return;
        }

        // ─── STEP 3: Basic filtering (just remove self) ───
        console.log("[8] Applying basic filters...");
        const filtered = myId
          ? usersData.filter((u) => u.id !== myId)
          : usersData;

        console.log("[9] After basic filtering:", filtered.length, "profiles");
        console.log(
          "[10] Sample profiles:",
          filtered.slice(0, 3).map((u) => ({ id: u.id, name: u.first_name }))
        );

        // ─── STEP 4: Format for UI ───
        console.log("[11] Formatting profiles...");
        const formatted = filtered.map((u) => ({
          id: u.id,
          firstName: u.first_name || "Anonymous",
          age: 25, // Hardcoded for testing
          location: { city: "Test City", country: "Test Country" },
          photoUrl: u.user_images?.[0]?.url || null,
          // Add other required fields with dummy data
          ethnicities: [],
          relationshipType: "Unknown",
          hasKids: false,
          wantsKids: false,
          religion: "",
          alcohol: "",
          cigarettes: "",
          weed: "",
          drugs: "",
          bio: "Test bio",
        }));

        console.log("[12] First formatted profile:", formatted[0]);
        setProfiles(formatted);

        // ─── STEP 5: Now try adding match filtering ───
        if (myId) {
          console.log("[13] Checking for matches...");
          const { data: matches, error: matchesError } = await supabase
            .from("matches")
            .select("user_a, user_b")
            .or(`user_a.eq.${myId},user_b.eq.${myId}`);

          if (matchesError) {
            console.error("[14] Matches fetch error:", matchesError);
          } else {
            console.log("[15] Found matches:", matches.length);
            const matchedIds = matches.map((m) =>
              m.user_a === myId ? m.user_b : m.user_a
            );
            console.log("[16] Matched user IDs:", matchedIds);

            const matchFiltered = formatted.filter(
              (profile) => !matchedIds.includes(profile.id)
            );
            console.log("[17] After match filtering:", matchFiltered.length);
            setProfiles(matchFiltered);
          }
        }
      } catch (err) {
        console.error("[18] CRASH:", err);
        Alert.alert("Error", "Unexpected error loading profiles");
        setProfiles([]);
      } finally {
        setLoading(false);
        console.log("[19] Loading complete");
      }
    }

    loadProfiles();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="pt-[25px] flex-1 justify-center items-center"
      >
        <Text>Loading profiles...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="pt-[25px] flex-1">
      <FlatList
        data={profiles}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <ProfileCard
            {...item}
            onPress={() =>
              navigation.navigate("OtherUserProfile", { user: item })
            }
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center">
            <Text>No profiles found.</Text>
            <Text className="mt-2 text-gray-500">
              {profiles.length === 0
                ? "Database might be empty"
                : "All profiles filtered"}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

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
