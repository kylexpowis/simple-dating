// src/screens/OtherUserProfile.jsx

import React, { useRef, useState, useEffect } from "react";
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
  Button,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { supabase } from "../../Lib/supabase";

export default function OtherUserProfile() {
  const navigation = useNavigation();
  const route = useRoute();
  const user = route.params?.user;
  const hideSend = route.params?.hideSendMessage;

  const [isMatched, setIsMatched] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Back‐button
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Load current user
  useEffect(() => {
    (async () => {
      const {
        data: { user: me },
        error: meErr,
      } = await supabase.auth.getUser();
      if (!meErr) setCurrentUser(me);
    })();
  }, []);

  // Check match status
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const { data: matchRow, error } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user_a.eq.${currentUser.id},user_b.eq.${user.id}),` +
            `and(user_a.eq.${user.id},user_b.eq.${currentUser.id})`
        )
        .maybeSingle();
      setIsMatched(!!matchRow);
    })();
  }, [currentUser, user.id]);

  // Load images carousel
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data: imgs, error: imgErr } = await supabase
          .from("user_images")
          .select("url")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: true });
        if (imgErr) throw imgErr;
        if (isMounted) {
          setImages(imgs.length ? imgs.map((r) => r.url) : [user.photoUrl]);
        }
      } catch (e) {
        if (isMounted) {
          Alert.alert("Error", "Could not load user images.");
          setImages([user.photoUrl]);
        }
      } finally {
        if (isMounted) setLoadingImages(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [user.id, user.photoUrl]);

  // Like handler
  const handleLike = async () => {
    if (!currentUser) return;
    try {
      await supabase.from("likes").insert({
        liker_id: currentUser.id,
        likee_id: user.id,
      });
      alert(`You liked ${user.firstName}!`);
    } catch {
      Alert.alert("Could not like user.");
    }
  };

  // Dislike handler
  const handleDislike = async () => {
    if (!currentUser) return;
    try {
      await supabase.from("dislikes").insert({
        disliker_id: currentUser.id,
        dislikee_id: user.id,
      });
      navigation.goBack();
    } catch {
      Alert.alert("Could not dislike user.");
    }
  };

  // **Unmatch** handler
  const handleUnmatch = async () => {
    if (!currentUser) return;
    try {
      await supabase
        .from("matches")
        .delete()
        .or(
          `and(user_a.eq.${currentUser.id},user_b.eq.${user.id}),` +
            `and(user_a.eq.${user.id},user_b.eq.${currentUser.id})`
        );
      Alert.alert("Unmatched", `You have unmatched ${user.firstName}.`);
      navigation.goBack();
    } catch (e) {
      console.error("Unmatch error:", e);
      Alert.alert("Could not unmatch user.");
    }
  };

  // Message handler
  const handleMessage = () => {
    const tabNav = navigation.getParent();
    if (tabNav) {
      tabNav.navigate("Home", {
        screen: "SingleChatScreen",
        params: { otherUser: user },
      });
    } else {
      navigation.navigate("SingleChatScreen", { otherUser: user });
    }
  };

  // Carousel controls
  const flatListRef = useRef(null);
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

  if (loadingImages) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.carouselContainer}>
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
          <Text>
            Looking for:{" "}
            {Array.isArray(user.relationshipType)
              ? user.relationshipType.join(", ")
              : user.relationshipType}
          </Text>
          <Text>Has kids: {user.hasKids ? "Yes" : "No"}</Text>
          <Text>Wants kids: {user.wantsKids ? "Yes" : "No"}</Text>
          <Text>Religion: {user.religion}</Text>
          <Text>Alcohol: {user.alcohol}</Text>
          <Text>Cigarettes: {user.cigarettes}</Text>
          <Text>Weed: {user.weed}</Text>
          <Text>Drugs: {user.drugs}</Text>

          <View style={{ marginTop: 20 }}>
            {!hideSend && (
              <>
                <Button title="Send Message" onPress={handleMessage} />
                <View style={{ height: 12 }} />
              </>
            )}
            {!isMatched && (
              <>
                <Button title="Like" onPress={handleLike} />
                <View style={{ height: 12 }} />
              </>
            )}
            <Button
              title={isMatched ? "Unmatch" : "Dislike"}
              onPress={isMatched ? handleUnmatch : handleDislike}
            />
          </View>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
