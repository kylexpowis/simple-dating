import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Button,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function PreferencesScreen() {
  const [ethnicities, setEthnicities] = useState([]);
  const [distance, setDistance] = useState("");
  const [hasKids, setHasKids] = useState("");
  const [lookingFor, setLookingFor] = useState([]);
  const [wantsKids, setWantsKids] = useState("");
  const [religion, setReligion] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [cigarettes, setCigarettes] = useState("");
  const [weed, setWeed] = useState("");
  const [drugs, setDrugs] = useState("");

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
  const [lookingForModalVisible, setLookingForModalVisible] = useState(false);
  const [wantsKidsModalVisible, setWantsKidsModalVisible] = useState(false);
  const [religionModalVisible, setReligionModalVisible] = useState(false);
  const [alcoholModalVisible, setAlcoholModalVisible] = useState(false);
  const [cigarettesModalVisible, setCigarettesModalVisible] = useState(false);
  const [weedModalVisible, setWeedModalVisible] = useState(false);
  const [drugsModalVisible, setDrugsModalVisible] = useState(false);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <Text style={styles.section}>Maximum Distance (km)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={distance}
        onChangeText={setDistance}
        placeholder="e.g. 100km"
      />
      {/* change to draggable radius with map */}

      <Text style={styles.section}>Has kids</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setHasKidsModalVisible(true)}
      >
        <Text>{hasKids || "Select an option"}</Text>
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

      <View style={{ marginVertical: 20 }}>
        <Button title="Save Preferences" onPress={() => {}} />
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
