// src/screens/HomeScreen.jsx
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileCard from "../../components/ProfileCard";
import { supabase } from "../../Lib/supabase";

export default function HomeScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);

      // fetch users + their images
      const { data, error } = await supabase.from("users").select(`
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
        `);

      if (error) {
        console.error("Error fetching profiles:", error);
      } else {
        // massage into the shape ProfileCard expects
        const formatted = data.map((u) => ({
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
          // take the first image or null
          photoUrl: u.user_images?.[0]?.url || null,
        }));
        setProfiles(formatted);
      }

      setLoading(false);
    }

    loadProfiles();
  }, []);

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
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const DUMMY = [
  {
    id: "1",
    firstName: "Alice",
    age: 27,
    location: { city: "London", country: "UK" },
    ethnicities: ["Asian", "White"],
    relationshipType: "Long-term",
    hasKids: false,
    wantsKids: true,
    religion: "None",
    alcohol: "Socially",
    cigarettes: "Never",
    weed: "Often",
    drugs: "Never",
    photoUrl:
      "https://img.buzzfeed.com/buzzfeed-static/static/2019-10/21/13/asset/bca59df568fc/sub-buzz-4034-1571664623-1.jpg",
  },
  {
    id: "2",
    firstName: "Beth",
    age: 30,
    location: { city: "Manchester", country: "UK" },
    ethnicities: ["Black"],
    relationshipType: "Long-term",
    hasKids: true,
    wantsKids: false,
    religion: "Christian",
    alcohol: "Never",
    cigarettes: "Socially",
    weed: "Never",
    drugs: "Never",
    photoUrl:
      "https://i.redd.it/how-do-i-achieve-the-ig-baddie-aesthetic-pls-drop-your-best-v0-8pjv85ei5hya1.jpg?width=1170&format=pjpg&auto=webp&s=65f4401350e38bd73a294defbf8e86893dd93c28",
  },
  {
    id: "3",
    firstName: "Chloe",
    age: 24,
    location: { city: "Birmingham", country: "UK" },
    ethnicities: ["Hispanic"],
    relationshipType: "Friends",
    hasKids: false,
    wantsKids: true,
    religion: "Buddhist",
    alcohol: "Never",
    cigarettes: "Never",
    weed: "Socially",
    drugs: "Never",
    photoUrl:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
  },
  {
    id: "4",
    firstName: "Diana",
    age: 35,
    location: { city: "Leeds", country: "UK" },
    ethnicities: ["White"],
    relationshipType: "Long-term",
    hasKids: true,
    wantsKids: true,
    religion: "None",
    alcohol: "Socially",
    cigarettes: "Often",
    weed: "Never",
    drugs: "Never",
    photoUrl:
      "https://cdn.britannica.com/67/194367-050-908BD6E8/Diana-princess-Wales-1989.jpg",
  },
  {
    id: "5",
    firstName: "Emma",
    age: 29,
    location: { city: "Glasgow", country: "UK" },
    ethnicities: ["Mixed"],
    relationshipType: "Long-term",
    hasKids: false,
    wantsKids: false,
    religion: "None",
    alcohol: "Socially",
    cigarettes: "Never",
    weed: "Often",
    drugs: "Never",
    photoUrl:
      "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg",
  },
];
