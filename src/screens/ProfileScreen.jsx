// src/screens/ProfileScreen.jsx
import React, { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import ProfileCard from "../../components/ProfileCard";

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = width * 1.2;

const MYDUMMY = {
  id: "6",
  firstName: "Kyle",
  age: 33,
  location: { city: "Manchester", country: "UK" },
  imageUrls: [require("../../assets/animekai.png")],
  bio: "Passionate developer and coffee enthusiast.",
  ethnicities: ["Black Carribean", "White Irish"],
  relationshipType: "Long-term",
  hasKids: false,
  wantsKids: true,
  religion: "Agnostic",
  alcohol: "Socially",
  cigarettes: "Never",
  weed: "Constantly",
  drugs: "Never",
};

function EditProfileScreen() {
  const [images, setImages] = useState(Array(6).fill(null));
  const [firstName, setFirstName] = useState(MYDUMMY.firstName);
  const [age, setAge] = useState(String(MYDUMMY.age));
  const [city, setCity] = useState(MYDUMMY.location.city);
  const [country, setCountry] = useState(MYDUMMY.location.country);
  const [bio, setBio] = useState(MYDUMMY.bio);
  const [ethnicities, setEthnicities] = useState(
    MYDUMMY.ethnicities.join(", ")
  );
  const [relationshipType, setRelationshipType] = useState(
    MYDUMMY.relationshipType
  );
  const [hasKids, setHasKids] = useState(MYDUMMY.hasKids);
  const [wantsKids, setWantsKids] = useState(MYDUMMY.wantsKids);
  const [religion, setReligion] = useState(MYDUMMY.religion);
  const [alcohol, setAlcohol] = useState(MYDUMMY.alcohol);
  const [cigarettes, setCigarettes] = useState(MYDUMMY.cigarettes);
  const [weed, setWeed] = useState(MYDUMMY.weed);
  const [drugs, setDrugs] = useState(MYDUMMY.drugs);

  const pickImage = async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.cancelled) {
      const newImages = [...images];
      newImages[index] = result.uri;
      setImages(newImages);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.editScroll}>
      <Text style={styles.section}>Photos</Text>
      <View style={styles.imageGrid}>
        {images.map((uri, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.imageSlot}
            onPress={() => pickImage(idx)}
          >
            {uri ? (
              <Image source={{ uri }} style={styles.imageThumb} />
            ) : (
              <View style={styles.plusBox}>
                <Text style={styles.plusText}>+</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>First Name</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />

      <Text style={styles.section}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
      />

      <Text style={styles.section}>Location</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex]}
          value={city}
          onChangeText={setCity}
          placeholder="City"
        />
        <TextInput
          style={[styles.input, styles.flex]}
          value={country}
          onChangeText={setCountry}
          placeholder="Country"
        />
      </View>

      <Text style={styles.section}>Bio</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Text style={styles.section}>Ethnicities</Text>
      <TextInput
        style={styles.input}
        value={ethnicities}
        onChangeText={setEthnicities}
      />

      <Text style={styles.section}>Looking for</Text>
      <TextInput
        style={styles.input}
        value={relationshipType}
        onChangeText={setRelationshipType}
      />

      <Text style={styles.section}>Has kids</Text>
      <TextInput
        style={styles.input}
        value={hasKids ? "Yes" : "No"}
        onChangeText={(t) => setHasKids(t === "Yes")}
      />

      <Text style={styles.section}>Wants kids</Text>
      <TextInput
        style={styles.input}
        value={wantsKids ? "Yes" : "No"}
        onChangeText={(t) => setWantsKids(t === "Yes")}
      />

      <Text style={styles.section}>Religion</Text>
      <TextInput
        style={styles.input}
        value={religion}
        onChangeText={setReligion}
      />

      <Text style={styles.section}>Alcohol</Text>
      <TextInput
        style={styles.input}
        value={alcohol}
        onChangeText={setAlcohol}
      />

      <Text style={styles.section}>Cigarettes</Text>
      <TextInput
        style={styles.input}
        value={cigarettes}
        onChangeText={setCigarettes}
      />

      <Text style={styles.section}>Weed</Text>
      <TextInput style={styles.input} value={weed} onChangeText={setWeed} />

      <Text style={styles.section}>Drugs</Text>
      <TextInput style={styles.input} value={drugs} onChangeText={setDrugs} />
    </ScrollView>
  );
}

function PreviewProfileScreen() {
  const user = MYDUMMY;
  const images = user.imageUrls;
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
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image carousel */}
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
              <Image source={item} style={styles.image} />
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

        {/* User info */}
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
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Edit Profile" component={EditProfileScreen} />
      <Tab.Screen name="Preview Profile" component={PreviewProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  editScroll: { padding: 16 },
  section: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  imageSlot: {
    width: (width - 100) / 3,
    height: (width - 100) / 3,
    margin: 8,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  imageThumb: { width: "100%", height: "100%", borderRadius: 8 },
  plusBox: { justifyContent: "center", alignItems: "center" },
  plusText: { fontSize: 32, color: "#888" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 20 },
  carouselContainer: { position: "relative" },
  image: { width, height: IMAGE_HEIGHT, resizeMode: "cover" },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 18,
    padding: 4,
  },
  left: { left: 10 },
  right: { right: 10 },
  info: { padding: 16 },
  name: { fontSize: 24, fontWeight: "bold" },
  location: { fontSize: 16, color: "#666", marginBottom: 12 },
  bio: { marginTop: 4, fontSize: 14, color: "#333" },
});
