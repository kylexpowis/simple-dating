// src/screens/LikedBy.jsx
import React from "react";
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LikedByCard from "../../components/LikedByCard";

const { width } = Dimensions.get("window");
// match ProfileScreen grid: 16px padding each side + 16px between cards
const CARD_WIDTH = (width - 48) / 2;
// make cards 20% taller than wide
const CARD_HEIGHT = CARD_WIDTH * 1.2;

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
];

export default function LikedBy() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.section}>Liked By</Text>
      <FlatList
        data={DUMMY}
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
