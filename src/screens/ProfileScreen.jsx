import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import * as ImagePicker from "expo-image-picker";
import ProfileCard from "../../components/ProfileCard";

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");

const MYDUMMY = {
  id: "6",
  firstName: "Kyle",
  age: 33,
  location: { city: "Manchester", country: "UK" },
  ethnicities: ["Black Carribean", "White Irish"],
  relationshipType: "Long-term",
  hasKids: false,
  wantsKids: true,
  religion: "Agnostic",
  alcohol: "Socially",
  cigarettes: "Never",
  weed: "Constantly",
  drugs: "Never",
  photoUrl: "",
};

function EditProfileScreen() {
  const [images, setImages] = useState(Array(6).fill(null));
  const [firstName, setFirstName] = useState(MYDUMMY.firstName);
  const [age, setAge] = useState(String(MYDUMMY.age));
  const [city, setCity] = useState(MYDUMMY.location.city);
  const [country, setCountry] = useState(MYDUMMY.location.country);
  const [bio, setBio] = useState("");
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.sectionTitle}>Photos</Text>
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

      <Text style={styles.sectionTitle}>First Name</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />

      <Text style={styles.sectionTitle}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
      />

      <Text style={styles.sectionTitle}>Location</Text>
      <View style={styles.locationRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          value={city}
          onChangeText={setCity}
          placeholder="City"
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={country}
          onChangeText={setCountry}
          placeholder="Country"
        />
      </View>

      <Text style={styles.sectionTitle}>Bio</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Text style={styles.sectionTitle}>Ethnicities</Text>
      <TextInput
        style={styles.input}
        value={ethnicities}
        onChangeText={setEthnicities}
        placeholder="e.g. Asian, White"
      />

      <Text style={styles.sectionTitle}>Looking For</Text>
      <TextInput
        style={styles.input}
        value={relationshipType}
        onChangeText={setRelationshipType}
      />

      <Text style={styles.sectionTitle}>Has Kids</Text>
      <TextInput
        style={styles.input}
        value={hasKids ? "Yes" : "No"}
        onChangeText={(t) => setHasKids(t.toLowerCase() === "yes")}
      />

      <Text style={styles.sectionTitle}>Wants Kids</Text>
      <TextInput
        style={styles.input}
        value={wantsKids ? "Yes" : "No"}
        onChangeText={(t) => setWantsKids(t.toLowerCase() === "yes")}
      />

      <Text style={styles.sectionTitle}>Religion</Text>
      <TextInput
        style={styles.input}
        value={religion}
        onChangeText={setReligion}
      />

      <Text style={styles.sectionTitle}>Alcohol</Text>
      <TextInput
        style={styles.input}
        value={alcohol}
        onChangeText={setAlcohol}
      />

      <Text style={styles.sectionTitle}>Cigarettes</Text>
      <TextInput
        style={styles.input}
        value={cigarettes}
        onChangeText={setCigarettes}
      />

      <Text style={styles.sectionTitle}>Weed</Text>
      <TextInput style={styles.input} value={weed} onChangeText={setWeed} />

      <Text style={styles.sectionTitle}>Drugs</Text>
      <TextInput style={styles.input} value={drugs} onChangeText={setDrugs} />
    </ScrollView>
  );
}

function PreviewProfileScreen() {
  return (
    <View style={styles.previewContainer}>
      <ProfileCard
        firstName={MYDUMMY.firstName}
        age={MYDUMMY.age}
        location={MYDUMMY.location}
        photoUrl={MYDUMMY.photoUrl}
        onPress={() => {}}
      />
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
  scrollContainer: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  imageSlot: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
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
  locationRow: { flexDirection: "row", justifyContent: "space-between" },
  previewContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
});
