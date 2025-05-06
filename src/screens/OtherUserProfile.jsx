// src/screens/OtherUserProfile.jsx
import React, { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

export default function OtherUserProfile() {
  const { user } = useRoute().params;
  const images = (user.imageUrls && user.imageUrls.slice(0, 6)) || [
    user.photoUrl,
  ];

  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onNext = () => {
    if (currentIndex < images.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex((i) => i + 1);
    }
  };

  const onPrev = () => {
    if (currentIndex > 0) {
      flatListRef.current.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex((i) => i - 1);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.carouselContainer]}>
          <FlatList
            data={images}
            ref={flatListRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.image} />
            )}
          />

          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.arrow, styles.left]}
              onPress={onPrev}
            >
              <MaterialIcons name="chevron-left" size={36} />
            </TouchableOpacity>
          )}
          {currentIndex < images.length - 1 && (
            <TouchableOpacity
              style={[styles.arrow, styles.right]}
              onPress={onNext}
            >
              <MaterialIcons name="chevron-right" size={36} />
            </TouchableOpacity>
          )}
        </View>

        {/* user info will now scroll if it overflows */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = width * 1.2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  carouselContainer: {
    position: "relative",
  },
  image: {
    width,
    height: IMAGE_HEIGHT,
    resizeMode: "cover",
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 18,
    padding: 4,
  },
  left: {
    left: 10,
  },
  right: {
    right: 10,
  },
  info: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  location: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
  },
  bio: {
    marginTop: 4,
    fontSize: 14,
    color: "#333",
  },
});
