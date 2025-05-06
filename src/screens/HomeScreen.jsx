// src/screens/HomeScreen.jsx
import React from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileCard from "../../components/ProfileCard";

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
      "https://images.pexels.com/photos/3863793/pexels-photo-3863793.jpeg",
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

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView edges={["top"]} className="pt-[25px] flex-1">
      <FlatList
        data={DUMMY}
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
      />
    </SafeAreaView>
  );
}
