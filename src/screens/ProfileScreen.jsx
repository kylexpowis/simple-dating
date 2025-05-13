// src/screens/ProfileScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import supabase from "../../Lib/supabase";

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = width * 1.2;

function EditProfileScreen() {
  const [loading, setLoading] = useState(true);

  // Form state
  const [images, setImages] = useState(Array(6).fill(null));
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [ethnicities, setEthnicities] = useState("");
  const [relationship, setRelationship] = useState("");
  const [hasKids, setHasKids] = useState(false);
  const [wantsKids, setWantsKids] = useState(false);
  const [religion, setReligion] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [cigarettes, setCigarettes] = useState("");
  const [weed, setWeed] = useState("");
  const [drugs, setDrugs] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // 1) Get current user
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr || !user) {
          Alert.alert("Error", "No user session found");
          return;
        }

        // 2) Fetch user row
        const { data: usr, error: usrErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (usrErr) throw usrErr;

        // 3) Fetch user_images
        const { data: imgs, error: imgErr } = await supabase
          .from("user_images")
          .select("url")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: true });
        if (imgErr) throw imgErr;

        // Initialize form state
        setFirstName(usr.first_name || "");
        setAge(usr.age?.toString() || "");
        setCity(usr.city || "");
        setCountry(usr.country || "");
        setBio(usr.bio || "");
        setEthnicities((usr.ethnicities || []).join(", "));
        setRelationship(usr.relationship || "");
        setHasKids(!!usr.has_kids);
        setWantsKids(!!usr.wants_kids);
        setReligion(usr.religion || "");
        setAlcohol(usr.alcohol || "");
        setCigarettes(usr.cigarettes || "");
        setWeed(usr.weed || "");
        setDrugs(usr.drugs || "");
        setImages(imgs.map((r) => r.url));
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Pick & upload to Storage → insert into user_images
  const pickAndSaveImage = async (idx) => {
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw userErr || new Error("No user");

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (res.cancelled) return;

      // upload
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("simple-dating-user-images")
        .upload(filePath, {
          uri: res.uri,
          name: filePath,
          type: "image/jpeg",
        });
      if (upErr) throw upErr;

      // get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("simple-dating-user-images")
        .getPublicUrl(filePath);

      // insert record
      const { error: dbErr } = await supabase
        .from("user_images")
        .insert([{ user_id: user.id, url: publicUrl }]);
      if (dbErr) throw dbErr;

      // update local
      const copy = [...images];
      copy[idx] = publicUrl;
      setImages(copy);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not upload image");
    }
  };

  // Upsert the users table
  const updateProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw userErr || new Error("No user");

      const payload = {
        id: user.id,
        first_name: firstName,
        age: Number(age) || null,
        city,
        country,
        bio,
        ethnicities: ethnicities.split(",").map((s) => s.trim()),
        relationship,
        has_kids: hasKids,
        wants_kids: wantsKids,
        religion,
        alcohol,
        cigarettes,
        weed,
        drugs,
      };

      const { error } = await supabase
        .from("users")
        .upsert(payload, { returning: "minimal" });
      if (error) throw error;

      Alert.alert("Success", "Profile saved");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.editScroll}>
      <Text style={styles.section}>Photos</Text>
      <View style={styles.imageGrid}>
        {images.map((uri, i) => (
          <TouchableOpacity
            key={i}
            style={styles.imageSlot}
            onPress={() => pickAndSaveImage(i)}
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
        value={relationship}
        onChangeText={setRelationship}
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

      <View style={{ marginVertical: 20 }}>
        <Button title="Update Profile" onPress={updateProfile} />
      </View>
    </ScrollView>
  );
}

function PreviewProfileScreen() {
  const [images, setImages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr || !user) throw userErr || new Error("No user");

        const { data: usr, error: usrErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (usrErr) throw usrErr;

        const { data: imgs, error: imgErr } = await supabase
          .from("user_images")
          .select("url")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: true });
        if (imgErr) throw imgErr;

        setProfile(usr);
        setImages(imgs.map((r) => r.url));
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load preview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>No profile data available.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={images}
        ref={carouselRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onViewableItemsChanged={({ viewableItems }) =>
          viewableItems[0] && setIndex(viewableItems[0].index)
        }
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} />
        )}
      />

      {index > 0 && (
        <TouchableOpacity
          style={[styles.arrow, styles.left]}
          onPress={() =>
            carouselRef.current?.scrollToIndex({ index: index - 1 })
          }
        >
          <MaterialIcons name="chevron-left" size={36} />
        </TouchableOpacity>
      )}
      {index < images.length - 1 && (
        <TouchableOpacity
          style={[styles.arrow, styles.right]}
          onPress={() =>
            carouselRef.current?.scrollToIndex({ index: index + 1 })
          }
        >
          <MaterialIcons name="chevron-right" size={36} />
        </TouchableOpacity>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>
          {profile.first_name}, {profile.age}
        </Text>
        <Text style={styles.location}>
          {profile.city}, {profile.country}
        </Text>

        <Text style={styles.section}>Bio</Text>
        <Text style={styles.bio}>{profile.bio}</Text>

        <Text style={styles.section}>Details</Text>
        <Text>Ethnicities: {(profile.ethnicities || []).join(", ")}</Text>
        <Text>Looking for: {profile.relationship}</Text>
        <Text>Has kids: {profile.has_kids ? "Yes" : "No"}</Text>
        <Text>Wants kids: {profile.wants_kids ? "Yes" : "No"}</Text>
        <Text>Religion: {profile.religion}</Text>
        <Text>Alcohol: {profile.alcohol}</Text>
        <Text>Cigarettes: {profile.cigarettes}</Text>
        <Text>Weed: {profile.weed}</Text>
        <Text>Drugs: {profile.drugs}</Text>
      </View>
    </SafeAreaView>
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
  info: { padding: 16 },
  name: { fontSize: 24, fontWeight: "bold" },
  location: { fontSize: 16, color: "#666", marginBottom: 12 },
  bio: { marginTop: 4, fontSize: 14, color: "#333" },
  image: { width, height: IMAGE_HEIGHT, resizeMode: "cover" },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 18,
    padding: 4,
    zIndex: 1,
  },
  left: { left: 10 },
  right: { right: 10 },
  scrollContent: { paddingBottom: 20 },
});
