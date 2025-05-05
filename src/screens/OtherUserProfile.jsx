import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRoute } from "@react-navigation/native";

export default function OtherUserProfile() {
  const { user } = useRoute().params;
  const images = user.imageUrls || [];

  return (
    <View style={styles.container}>
      {/* image carousel */}
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        keyExtractor={(_, i) => i.toString()}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} />
        )}
      />

      <View style={styles.info}>
        <Text style={styles.name}>
          {user.firstName}, {user.age}
        </Text>
        <Text style={styles.location}>
          {user.location.city}, {user.location.country}
        </Text>

        <Text style={styles.section}>Bio</Text>
        <Text style={styles.bio}>{user.bio}</Text>

        <Text style={styles.section}>Details</Text>
        <Text>Ethnicities: {user.ethnicities.join(", ")}</Text>
        <Text>Looking for: {user.relationshipType}</Text>
        <Text>Has kids: {user.hasKids ? "Yes" : "No"}</Text>
        <Text>Wants kids: {user.wantsKids ? "Yes" : "No"}</Text>
        <Text>Religion: {user.religion}</Text>
        <Text>Alcohol: {user.alcohol}</Text>
        <Text>Cigarettes: {user.cigarettes}</Text>
        <Text>Weed: {user.weed}</Text>
        <Text>Drugs: {user.drugs}</Text>
      </View>
    </View>
  );
}

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = width * 1.2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  image: { width, height: IMAGE_HEIGHT },
  info: { padding: 16 },
  name: { fontSize: 24, fontWeight: "bold" },
  location: { fontSize: 16, color: "#666", marginBottom: 12 },
  section: { marginTop: 16, fontSize: 18, fontWeight: "600" },
  bio: { marginTop: 4, fontSize: 14, color: "#333" },
});
