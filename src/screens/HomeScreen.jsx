import React from "react";
import { FlatList } from "react-native";
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
    photoUrl: "https://placekitten.com/400/300",
  },
  // …more users…
];

export default function HomeScreen({ navigation }) {
  return (
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
    />
  );
}
