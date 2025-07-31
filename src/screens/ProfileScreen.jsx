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
  Modal,
  Switch,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { supabase, supabaseAdmin } from "../../Lib/supabase";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { decode as base64ToArrayBuffer } from "base64-arraybuffer";

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = width * 1.2;
const BUCKET_NAME = "simple-dating-user-images";

export function EditProfileScreen({
  onComplete,
  submitLabel = "Update Profile",
  showLogout = true,
} = {}) {
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const [images, setImages] = useState(Array(6).fill(null));
  const [sex, setSex] = useState("");
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [ethnicities, setEthnicities] = useState([]);
  const [relationship, setRelationship] = useState("");
  const [hasKids, setHasKids] = useState(false);
  const [wantsKids, setWantsKids] = useState(false);
  const [religion, setReligion] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [cigarettes, setCigarettes] = useState("");
  const [weed, setWeed] = useState("");
  const [drugs, setDrugs] = useState("");
  const [incognito, setIncognito] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const fillLocationFromGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Location permission was not granted"
        );
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (place) {
        setCity(place.city || "");
        setCountry(place.country || "");
      }
    } catch (err) {
      console.error("fillLocationFromGPS", err);
      Alert.alert("Error", "Unable to retrieve location");
    }
  };

  const SEX_OPTIONS = ["Male", "Female", "Trans Male", "Trans Female", "Other"];
  const [sexModalVisible, setSexModalVisible] = useState(false);
  const ETHNICITY_OPTIONS = [
    "Black / African Descent",
    "Black / Caribbean Descent",
    "White / European Descent",
    "Latino / Hispanic",
    "East Asian",
    "South Asian",
    "Southeast Asian",
    "Middle Eastern",
    "North African",
    "Native American / Indigenous",
    "Pacific Islander",
    "Mixed Ethnicity",
    "Other",
  ];

  const [ethnicityModalVisible, setEthnicityModalVisible] = useState(false);

  const toggleEthnicity = (option) => {
    setEthnicities((curr) =>
      curr.includes(option)
        ? curr.filter((e) => e !== option)
        : [...curr, option]
    );
  };

  const RELATIONSHIP_OPTIONS = [
    "Casual",
    "Relationship",
    "Short-Term Fun",
    "Friends First",
    "Friends",
    "Polyamory",
    "Monogamy",
    "Open Relationship",
    "Just Chatting",
  ];
  const [relationshipModalVisible, setRelationshipModalVisible] =
    useState(false);

  const HAS_KIDS_OPTIONS = ["Yes", "No"];
  const [hasKidsModalVisible, setHasKidsModalVisible] = useState(false);

  const WANTS_KIDS_OPTIONS = ["Yes", "No", "Not Sure"];
  const [wantsKidsModalVisible, setWantsKidsModalVisible] = useState(false);

  const RELIGION_OPTIONS = [
    "Agnostic",
    "Atheist",
    "Buddhist",
    "Catholic",
    "Christian",
    "Hindu",
    "Jewish",
    "Muslim",
    "Sikh",
    "Spiritual",
    "Other",
  ];
  const [religionModalVisible, setReligionModalVisible] = useState(false);

  const ALCOHOL_OPTIONS = ["Yes", "No", "Social"];
  const [alcoholModalVisible, setAlcoholModalVisible] = useState(false);

  const CIGARETTES_OPTIONS = ["Yes", "No", "Social"];
  const [cigarettesModalVisible, setCigarettesModalVisible] = useState(false);

  const WEED_OPTIONS = ["Yes", "No", "Social", "420"];
  const [weedModalVisible, setWeedModalVisible] = useState(false);

  const DRUGS_OPTIONS = ["Yes", "No", "Sometimes"];
  const [drugsModalVisible, setDrugsModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Get current user
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr || !user) {
          Alert.alert("Error", "No user session found");
          return;
        }

        // Fetch user row
        const { data: usr, error: usrErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (usrErr) throw usrErr;

        // Fetch user_images in ascending order (oldest first)
        const { data: imgs, error: imgErr } = await supabase
          .from("user_images")
          .select("url")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: true });
        if (imgErr) throw imgErr;

        // Initialize form state
        setSex(usr?.sex || "");
        setFirstName(usr?.first_name || " ");
        setAge(usr?.age?.toString() || " ");
        setCity(usr?.city || " ");
        setCountry(usr?.country || " ");
        setBio(usr?.bio || " ");
        setEthnicities(usr?.ethnicities || []);
        setRelationship(usr?.relationship || "");
        setHasKids(!!usr?.has_kids);
        setWantsKids(!!usr?.wants_kids);
        setReligion(usr?.religion || "");
        setAlcohol(usr?.alcohol || "");
        setCigarettes(usr?.cigarettes || "");
        setWeed(usr?.weed || "");
        setDrugs(usr?.drugs || "");
        setIncognito(!!usr?.incognito);

        // image slots: use existing URLs, then null placeholders
        const existing = imgs.map((r) => r.url);
        const slots = Array(6)
          .fill(null)
          .map((_, i) => existing[i] ?? null);
        setImages(slots);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Original add-new-photo flow
  const pickAndSaveImage = async (idx) => {
    try {
      // Get current authenticated user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw userErr || new Error("No user");

      // Launch image library, requesting base64 data
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      });
      if (res.canceled) return; // user aborted

      // Grab the first asset and its base64 string
      const asset = res.assets[0];
      const { uri: localUri, base64: b64String, fileName } = asset;
      if (!b64String) {
        throw new Error("No base64 data returned from picker");
      }

      // Determine MIME type by file extension (png, gif, jpg, etc.)
      let lower = (fileName || localUri).toLowerCase();
      let isPng = lower.endsWith(".png");
      let isGif = lower.endsWith(".gif");
      let extension, mimeType;
      if (isPng) {
        extension = "png";
        mimeType = "image/png";
      } else if (isGif) {
        extension = "gif";
        mimeType = "image/gif";
      } else {
        extension = "jpg";
        mimeType = "image/jpeg";
      }

      // Decode the base64 string into an ArrayBuffer
      const arrayBuffer = base64ToArrayBuffer(b64String);
      console.log(
        "📦 ArrayBuffer byteLength:",
        arrayBuffer.byteLength,
        "mimeType:",
        mimeType
      );
      if (arrayBuffer.byteLength === 0) {
        throw new Error("Decoded ArrayBuffer is 0 bytes!");
      }

      // Build a unique file path in your Supabase bucket
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      // Upload the raw ArrayBuffer to Supabase Storage
      const { error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
        });
      if (upErr) throw upErr;

      // Get the public URL of the uploaded image
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      // Insert the new record into your `user_images` table
      const { error: dbErr } = await supabase
        .from("user_images")
        .insert([{ user_id: user.id, url: publicUrl }]);
      if (dbErr) throw dbErr;

      // Update local state so the UI reflects the new image immediately
      const copy = [...images];
      copy[idx] = publicUrl;
      setImages(copy);
    } catch (e) {
      console.error("❌ pickAndSaveImage error:", e);
      Alert.alert("Error", "Could not upload image");
    }
  };

  // Delete photo logic
  const removeImage = async (idx) => {
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw userErr || new Error("No user");

      const urlToRemove = images[idx];
      if (!urlToRemove) return;

      // Delete from user_images table
      const { error: delErr } = await supabase
        .from("user_images")
        .delete()
        .eq("user_id", user.id)
        .eq("url", urlToRemove);
      if (delErr) throw delErr;

      // Delete actual file from Storage
      const parts = urlToRemove.split(`/${BUCKET_NAME}/`);
      if (parts.length > 1) {
        const filePath = parts[1];
        const { error: storageErr } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath]);
        if (storageErr) console.error("Storage remove error:", storageErr);
      }

      // Update local state
      const copy = [...images];
      copy[idx] = null;
      setImages(copy);
    } catch (e) {
      console.error("❌ removeImage error:", e);
      Alert.alert("Error", "Could not remove photo");
    }
  };

  // single-flow replace logic (upload new first, then delete old)
  const replaceFlow = async (idx) => {
    try {
      // Get current authenticated user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw userErr || new Error("No user");

      // Launch image library, requesting base64 data
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      });
      if (res.canceled) return; // user canceled → do nothing

      // Got a new image → upload it first
      const asset = res.assets[0];
      const { uri: localUri, base64: b64String, fileName } = asset;
      if (!b64String) throw new Error("No base64 data returned from picker");

      // Determine MIME type by file extension
      let lower = (fileName || localUri).toLowerCase();
      let isPng = lower.endsWith(".png");
      let isGif = lower.endsWith(".gif");
      let extension, mimeType;
      if (isPng) {
        extension = "png";
        mimeType = "image/png";
      } else if (isGif) {
        extension = "gif";
        mimeType = "image/gif";
      } else {
        extension = "jpg";
        mimeType = "image/jpeg";
      }

      // Decode & upload new image
      const arrayBuffer = base64ToArrayBuffer(b64String);
      if (arrayBuffer.byteLength === 0)
        throw new Error("Decoded ArrayBuffer is 0 bytes!");
      const newFilePath = `${user.id}/${Date.now()}.${extension}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(newFilePath, arrayBuffer, { contentType: mimeType });
      if (upErr) throw upErr;
      const {
        data: { publicUrl: newUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(newFilePath);

      // Insert new record into user_images
      const { error: dbErr } = await supabase
        .from("user_images")
        .insert([{ user_id: user.id, url: newUrl }]);
      if (dbErr) throw dbErr;

      // Remove old record and its file
      const oldUrl = images[idx];
      if (oldUrl) {
        // Delete old row
        await supabase
          .from("user_images")
          .delete()
          .eq("user_id", user.id)
          .eq("url", oldUrl);

        // Delete old file from storage
        const parts = oldUrl.split(`/${BUCKET_NAME}/`);
        if (parts.length > 1) {
          const oldFilePath = parts[1];
          const { error: storageErr } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([oldFilePath]);
          if (storageErr) console.error("Old file remove error:", storageErr);
        }
      }

      // Update local state to show new image
      const copy = [...images];
      copy[idx] = newUrl;
      setImages(copy);
    } catch (e) {
      console.error("❌ replaceFlow error:", e);
      Alert.alert("Error", "Could not replace photo");
    }
  };

  const handleImagePress = (idx) => {
    if (!images[idx]) {
      // empty slot → pick new
      pickAndSaveImage(idx);
    } else {
      // occupied → offer remove or replace
      Alert.alert(
        "Manage Photo",
        "What would you like to do with this photo?",
        [
          { text: "Remove Photo", onPress: () => removeImage(idx) },
          { text: "Replace Photo", onPress: () => replaceFlow(idx) },
          { text: "Cancel", style: "cancel" },
        ]
      );
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
        sex,
        first_name: firstName,
        age: Number(age) || null,
        city,
        country,
        bio,
        ethnicities,
        relationship,
        has_kids: hasKids,
        wants_kids: wantsKids,
        religion,
        alcohol,
        cigarettes,
        weed,
        drugs,
        incognito,
      };

      const { error } = await supabase
        .from("users")
        .upsert(payload, { returning: "minimal" });
      if (error) throw error;

      Alert.alert("Success", "Profile saved");
      if (onComplete) onComplete();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      const rootNav = navigation.getParent()?.getParent();
      rootNav?.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Auth" }] })
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim() !== "I UNDERSTAND") {
      Alert.alert("Error", "There was a mistake, please try again.");
      return;
    }
    try {
      setLoading(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw userErr || new Error("No user");

      const { data: imgs } = await supabase
        .from("user_images")
        .select("url")
        .eq("user_id", user.id);
      if (imgs && imgs.length) {
        const paths = imgs
          .map((r) => r.url.split(`/${BUCKET_NAME}/`)[1])
          .filter(Boolean);
        if (paths.length) {
          await supabase.storage.from(BUCKET_NAME).remove(paths);
        }
        await supabase.from("user_images").delete().eq("user_id", user.id);
      }

      const { error: delErr } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);
      if (delErr) throw delErr;
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      await supabase.auth.signOut();

      setDeleteConfirm("");
      setDeleteModalVisible(false);

      const rootNav = navigation.getParent()?.getParent();
      rootNav?.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Auth" }] })
      );
    } catch (err) {
      console.error("delete account error", err);
      Alert.alert("Error", "Could not delete account");
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
            onPress={() => handleImagePress(i)}
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
      <Text style={styles.section}>I am</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setSexModalVisible(true)}
      >
        <Text>{sex || "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={sexModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSexModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {SEX_OPTIONS.map((opt) => {
                const selected = sex === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setSex(opt);
                      setSexModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button title="Cancel" onPress={() => setSexModalVisible(false)} />
          </View>
        </View>
      </Modal>

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
        <TouchableOpacity
          style={styles.locationButton}
          onPress={fillLocationFromGPS}
        >
          <MaterialIcons name="my-location" size={24} />
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Bio</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Text style={styles.section}>Ethnicities</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setEthnicityModalVisible(true)}
      >
        <Text>
          {ethnicities.length > 0
            ? ethnicities.join(", ")
            : "Select ethnicities"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={ethnicityModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEthnicityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {ETHNICITY_OPTIONS.map((opt) => {
                const selected = ethnicities.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleEthnicity(opt)}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Done"
              onPress={() => setEthnicityModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Relationship</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setRelationshipModalVisible(true)}
      >
        <Text>{relationship || "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        visible={relationshipModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRelationshipModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {RELATIONSHIP_OPTIONS.map((opt) => {
                const selected = relationship === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setRelationship(opt);
                      setRelationshipModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setRelationshipModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Has kids</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setHasKidsModalVisible(true)}
      >
        <Text>{hasKids !== "" ? hasKids : "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        visible={hasKidsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHasKidsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {HAS_KIDS_OPTIONS.map((opt) => {
                const selected = hasKids === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setHasKids(opt);
                      setHasKidsModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setHasKidsModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Wants kids</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setWantsKidsModalVisible(true)}
      >
        <Text>{wantsKids || "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        visible={wantsKidsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWantsKidsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {WANTS_KIDS_OPTIONS.map((opt) => {
                const selected = wantsKids === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setWantsKids(opt);
                      setWantsKidsModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setWantsKidsModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
      <Text style={styles.section}>Religion</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setReligionModalVisible(true)}
      >
        <Text>{religion || "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        visible={religionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReligionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {RELIGION_OPTIONS.map((opt) => {
                const selected = religion === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setReligion(opt);
                      setReligionModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setReligionModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Alcohol</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setAlcoholModalVisible(true)}
      >
        <Text>{alcohol || "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        visible={alcoholModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAlcoholModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {ALCOHOL_OPTIONS.map((opt) => {
                const selected = alcohol === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setAlcohol(opt);
                      setAlcoholModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setAlcoholModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Cigarettes</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setCigarettesModalVisible(true)}
      >
        <Text>{cigarettes || "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        visible={cigarettesModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCigarettesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {CIGARETTES_OPTIONS.map((opt) => {
                const selected = cigarettes === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setCigarettes(opt);
                      setCigarettesModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setCigarettesModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Weed</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setWeedModalVisible(true)}
      >
        <Text>{weed || "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        visible={weedModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWeedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {WEED_OPTIONS.map((opt) => {
                const selected = weed === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setWeed(opt);
                      setWeedModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button title="Cancel" onPress={() => setWeedModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Drugs</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setDrugsModalVisible(true)}
      >
        <Text>{drugs || "Select an option"}</Text>
      </TouchableOpacity>
      <Modal
        visible={drugsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDrugsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {DRUGS_OPTIONS.map((opt) => {
                const selected = drugs === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      setDrugs(opt);
                      setDrugsModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={selected ? "check-box" : "check-box-outline-blank"}
                      size={24}
                    />
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setDrugsModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 10,
        }}
      >
        <Text style={{ marginRight: 8 }}>Incognito Mode</Text>
        <Switch value={incognito} onValueChange={setIncognito} />
      </View>

      <View style={{ marginVertical: 20 }}>
        <Button title={submitLabel} onPress={updateProfile} />
        {showLogout && <Button title="Logout" onPress={handleLogout} />}
        <Button
          title="Delete Account"
          color="red"
          onPress={() => setDeleteModalVisible(true)}
        />
      </View>
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={{ marginBottom: 12 }}>
              You are about to delete your account, this action is irreversable,
              type "I UNDERSTAND" to delete your account
            </Text>
            <TextInput
              style={styles.input}
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              placeholder="I UNDERSTAND"
            />
            <Button
              title="Confirm Deletion"
              color="red"
              onPress={handleDeleteAccount}
            />
            <Button
              title="Cancel"
              onPress={() => setDeleteModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
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
        // Get current user from Supabase Auth
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr || !user) throw userErr || new Error("No user");

        // Attempt to fetch existing row in `public.users`
        let { data: usr, error: usrErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (usrErr) throw usrErr;

        // If no row exists, insert/upsert a "blank" profile row
        if (!usr) {
          const blankProfile = {
            id: user.id,
            first_name: "",
            age: null,
            city: "",
            country: "",
            bio: "",
            ethnicities: [],
            relationship: "",
            has_kids: false,
            wants_kids: false,
            religion: "",
            alcohol: "",
            cigarettes: "",
            weed: "",
            drugs: "",
            incognito: false,
          };
          const { error: upsertErr } = await supabase
            .from("users")
            .upsert(blankProfile, { returning: "minimal" });
          if (upsertErr) throw upsertErr;

          // Re-fetch the newly created row so `usr` is not null
          const { data: newUsr, error: newUsrErr } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (newUsrErr) throw newUsrErr;
          usr = newUsr;
        }

        // Fetch all user_images for this user (may be empty initially)

        const { data: imgs, error: imgErr } = await supabase
          .from("user_images")
          .select("url")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: true });
        if (imgErr) throw imgErr;

        // Set local state now that we have a guaranteed `profile` object
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

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.carouselContainer}>
        <FlatList
          data={images}
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => i.toString()}
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
      </View>

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
        <Text>Relationship Type: {profile.relationship}</Text>
        <Text>Has kids: {profile.has_kids ? "Yes" : "No"}</Text>
        <Text>Wants kids: {profile.wants_kids ? "Yes" : "No"}</Text>
        <Text>Religion: {profile.religion}</Text>
        <Text>Alcohol: {profile.alcohol}</Text>
        <Text>Cigarettes: {profile.cigarettes}</Text>
        <Text>Weed: {profile.weed}</Text>
        <Text>Drugs: {profile.drugs}</Text>
      </View>
    </ScrollView>
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
  flex: { flex: 1 },
  locationButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    marginTop: 8,
  },
  safeArea: { flex: 1, backgroundColor: "#fff" },

  carouselContainer: {
    height: IMAGE_HEIGHT,
  },
  image: {
    width: width,
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
    zIndex: 1,
  },
  left: { left: 10 },
  right: { right: 10 },

  info: { padding: 16 },
  name: { fontSize: 24, fontWeight: "bold" },
  location: { fontSize: 16, color: "#666", marginBottom: 12 },
  bio: { marginTop: 4, fontSize: 14, color: "#333" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 16,
  },
});
