import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PreferencesScreen() {
  const [ethnicities, setEthnicities] = useState([]);
  const [distance, setDistance] = useState("");
  const [hasKids, setHasKids] = useState([]);
  const [lookingFor, setLookingFor] = useState([]); // sex/gender options
  const [relationship, setRelationship] = useState([]);
  const [wantsKids, setWantsKids] = useState([]);
  const [religion, setReligion] = useState([]);
  const [alcohol, setAlcohol] = useState([]);
  const [cigarettes, setCigarettes] = useState([]);
  const [weed, setWeed] = useState([]);
  const [drugs, setDrugs] = useState([]);

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

  const HAS_KIDS_OPTIONS = ["Yes", "No"];

  const LOOKING_FOR_OPTIONS = [
    "Male",
    "Female",
    "Trans Male",
    "Trans Female",
    "Non Binary",
  ];

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

  const WANTS_KIDS_OPTIONS = ["Yes", "No", "Not Sure"];

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

  const ALCOHOL_OPTIONS = ["Yes", "No", "Social"];
  const CIGARETTES_OPTIONS = ["Yes", "No", "Social"];
  const WEED_OPTIONS = ["Yes", "No", "Social", "420"];
  const DRUGS_OPTIONS = ["Yes", "No", "Sometimes"];

  const [ethnicityModalVisible, setEthnicityModalVisible] = useState(false);
  const [hasKidsModalVisible, setHasKidsModalVisible] = useState(false);
  const [lookingForModalVisible, setLookingForModalVisible] = useState(false); // sex/gender options
  const [relationshipModalVisible, setRelationshipModalVisible] =
    useState(false);
  const [wantsKidsModalVisible, setWantsKidsModalVisible] = useState(false);
  const [religionModalVisible, setReligionModalVisible] = useState(false);
  const [alcoholModalVisible, setAlcoholModalVisible] = useState(false);
  const [cigarettesModalVisible, setCigarettesModalVisible] = useState(false);
  const [weedModalVisible, setWeedModalVisible] = useState(false);
  const [drugsModalVisible, setDrugsModalVisible] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("searchPrefs");
        if (saved) {
          const prefs = JSON.parse(saved);
          setEthnicities(prefs.ethnicities || []);
          setDistance(prefs.distance || "");
          setHasKids(
            Array.isArray(prefs.hasKids)
              ? prefs.hasKids
              : prefs.hasKids
              ? [prefs.hasKids]
              : []
          );
          setLookingFor(prefs.lookingFor || []);
          setRelationship(prefs.relationship || []);
          setWantsKids(
            Array.isArray(prefs.wantsKids)
              ? prefs.wantsKids
              : prefs.wantsKids
              ? [prefs.wantsKids]
              : []
          );
          setReligion(
            Array.isArray(prefs.religion)
              ? prefs.religion
              : prefs.religion
              ? [prefs.religion]
              : []
          );
          setAlcohol(
            Array.isArray(prefs.alcohol)
              ? prefs.alcohol
              : prefs.alcohol
              ? [prefs.alcohol]
              : []
          );
          setCigarettes(
            Array.isArray(prefs.cigarettes)
              ? prefs.cigarettes
              : prefs.cigarettes
              ? [prefs.cigarettes]
              : []
          );
          setWeed(
            Array.isArray(prefs.weed)
              ? prefs.weed
              : prefs.weed
              ? [prefs.weed]
              : []
          );
          setDrugs(
            Array.isArray(prefs.drugs)
              ? prefs.drugs
              : prefs.drugs
              ? [prefs.drugs]
              : []
          );
        }
      } catch (e) {
        console.error("Error loading preferences", e);
      }
    })();
  }, []);

  const toggleEthnicity = (opt) => {
    setEthnicities((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleLookingFor = (opt) => {
    setLookingFor((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleHasKids = (opt) => {
    setHasKids((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleWantsKids = (opt) => {
    setWantsKids((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleReligion = (opt) => {
    setReligion((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleAlcohol = (opt) => {
    setAlcohol((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleCigarettes = (opt) => {
    setCigarettes((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleWeed = (opt) => {
    setWeed((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleDrugs = (opt) => {
    setDrugs((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const toggleRelationship = (opt) => {
    setRelationship((curr) =>
      curr.includes(opt) ? curr.filter((e) => e !== opt) : [...curr, opt]
    );
  };

  const handleSave = async () => {
    const prefs = {
      ethnicities,
      distance,
      hasKids,
      lookingFor,
      relationship,
      wantsKids,
      religion,
      alcohol,
      cigarettes,
      weed,
      drugs,
    };
    try {
      await AsyncStorage.setItem("searchPrefs", JSON.stringify(prefs));
      Alert.alert("Preferences Saved");
    } catch (e) {
      console.error("Error saving preferences", e);
      Alert.alert("Error", "Could not save preferences");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>
        Make sure to select everything youre intested in{" "}
      </Text>
      <Text style={styles.section}>Ethnicities</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setEthnicityModalVisible(true)}
      >
        <Text>
          {ethnicities.length ? ethnicities.join(", ") : "Select ethnicities"}
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

      <Text style={styles.section}>Looking for</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setLookingForModalVisible(true)}
      >
        <Text>
          {lookingFor.length > 0 ? lookingFor.join(", ") : "Select options"}
        </Text>
      </TouchableOpacity>
      <Modal
        visible={lookingForModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLookingForModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {LOOKING_FOR_OPTIONS.map((opt) => {
                const selected = lookingFor.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleLookingFor(opt)}
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
              onPress={() => setLookingForModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Relationship</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setRelationshipModalVisible(true)}
      >
        <Text>
          {relationship.length > 0 ? relationship.join(", ") : "Select options"}
        </Text>
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
                const selected = relationship.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleRelationship(opt)}
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
              onPress={() => setRelationshipModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Wants kids</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setWantsKidsModalVisible(true)}
      >
        <Text>
          {wantsKids.length > 0 ? wantsKids.join(", ") : "Select options"}
        </Text>
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
                const selected = wantsKids.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleWantsKids(opt)}
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
              onPress={() => setWantsKidsModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Has kids</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setHasKidsModalVisible(true)}
      >
        <Text>
          {hasKids.length > 0 ? hasKids.join(", ") : "Select options"}
        </Text>
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
                const selected = hasKids.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleHasKids(opt)}
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
              onPress={() => setHasKidsModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
      <Text style={styles.section}>Religion</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setReligionModalVisible(true)}
      >
        <Text>
          {religion.length > 0 ? religion.join(", ") : "Select options"}
        </Text>
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
                const selected = religion.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleReligion(opt)}
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
        <Text>
          {alcohol.length > 0 ? alcohol.join(", ") : "Select options"}
        </Text>
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
                const selected = alcohol.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleAlcohol(opt)}
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
        <Text>
          {cigarettes.length > 0 ? cigarettes.join(", ") : "Select options"}
        </Text>
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
                const selected = cigarettes.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleCigarettes(opt)}
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
        <Text>{weed.length > 0 ? weed.join(", ") : "Select options"}</Text>
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
                const selected = weed.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleWeed(opt)}
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
            <Button title="Done" onPress={() => setWeedModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Drugs</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setDrugsModalVisible(true)}
      >
        <Text>{drugs.length > 0 ? drugs.join(", ") : "Select options"}</Text>
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
                const selected = drugs.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => toggleDrugs(opt)}
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
            <Button title="Done" onPress={() => setDrugsModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Maximum Distance (km)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={distance}
        onChangeText={setDistance}
        placeholder="e.g. 100km"
      />
      {/* change to draggable radius with map */}

      <View style={{ marginVertical: 20 }}>
        <Button title="Save Preferences" onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  section: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionText: { marginLeft: 8 },
});
