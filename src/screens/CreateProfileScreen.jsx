import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Button,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../Lib/supabase";

const SEX_OPTIONS = [
  "Male",
  "Female",
  "Trans Male",
  "Trans Female",
  "NonBinary",
];

const LOOKING_FOR_SEX_OPTIONS = [
  "Male",
  "Female",
  "Trans Male",
  "Trans Female",
  "NonBinary",
];

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

const SIMPLE_OPTIONS = ["Yes", "No", "Social", "Sometimes", "420"];

export default function CreateProfileScreen({ onComplete } = {}) {
  const navigation = useNavigation();
  const [sex, setSex] = useState("");
  const [lookingFor, setLookingFor] = useState([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [ethnicities, setEthnicities] = useState([]);
  const [relationship, setRelationship] = useState([]);
  const [wantsKids, setWantsKids] = useState(false);
  const [religion, setReligion] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [cigarettes, setCigarettes] = useState("");
  const [weed, setWeed] = useState("");
  const [drugs, setDrugs] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState(Array(6).fill(null));

  const [sexModal, setSexModal] = useState(false);
  const [lookingForModal, setLookingForModal] = useState(false);
  const [ethnicityModal, setEthnicityModal] = useState(false);
  const [relationshipModal, setRelationshipModal] = useState(false);
  const [religionModal, setReligionModal] = useState(false);
  const [alcoholModal, setAlcoholModal] = useState(false);
  const [cigarettesModal, setCigarettesModal] = useState(false);
  const [weedModal, setWeedModal] = useState(false);
  const [drugsModal, setDrugsModal] = useState(false);
  const [wantsKidsModal, setWantsKidsModal] = useState(false);

  const toggleEthnicity = (option) => {
    setEthnicities((curr) =>
      curr.includes(option)
        ? curr.filter((e) => e !== option)
        : [...curr, option]
    );
  };

  const toggleLookingFor = (option) => {
    setLookingFor((curr) =>
      curr.includes(option)
        ? curr.filter((e) => e !== option)
        : [...curr, option]
    );
  };

  const toggleRelationship = (option) => {
    setRelationship((curr) =>
      curr.includes(option)
        ? curr.filter((e) => e !== option)
        : [...curr, option]
    );
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) throw error || new Error("No user");

      const payload = {
        id: user.id,
        sex,
        first_name: name,
        age: Number(age) || null,
        city,
        country,
        bio,
        ethnicities,
        relationship,
        wants_kids: wantsKids,
        religion,
        alcohol,
        cigarettes,
        weed,
        drugs,
      };

      const { error: upsertErr } = await supabase
        .from("users")
        .upsert(payload, { returning: "minimal" });
      if (upsertErr) throw upsertErr;
      if (onComplete) onComplete();
    } catch (err) {
      console.error("create profile error", err);
      Alert.alert("Error", "Could not create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>Are you?</Text>
      <TouchableOpacity style={styles.input} onPress={() => setSexModal(true)}>
        <Text>{sex || "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={sexModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSexModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {SEX_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionRow}
                  onPress={() => {
                    setSex(opt);
                    setSexModal(false);
                  }}
                >
                  <MaterialIcons
                    name={sex === opt ? "check-box" : "check-box-outline-blank"}
                    size={24}
                  />
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setSexModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.section}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <Text style={styles.section}>City</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />

      <Text style={styles.section}>Country</Text>
      <TextInput
        style={styles.input}
        value={country}
        onChangeText={setCountry}
      />

      <Text style={styles.section}>Bio</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Text style={styles.section}>Ethnicities</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setEthnicityModal(true)}
      >
        <Text>
          {ethnicities.length ? ethnicities.join(", ") : "Select ethnicities"}
        </Text>
      </TouchableOpacity>
      <Modal
        visible={ethnicityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setEthnicityModal(false)}
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
            <Button title="Done" onPress={() => setEthnicityModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Looking For</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setLookingForModal(true)}
      >
        <Text>{lookingFor.length ? lookingFor.join(", ") : "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={lookingForModal}
        animationType="slide"
        transparent
        onRequestClose={() => setLookingForModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {LOOKING_FOR_SEX_OPTIONS.map((opt) => {
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
            <Button title="Done" onPress={() => setLookingForModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Relationship</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setRelationshipModal(true)}
      >
        <Text>{relationship.length ? relationship.join(", ") : "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={relationshipModal}
        animationType="slide"
        transparent
        onRequestClose={() => setRelationshipModal(false)}
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
            <Button title="Done" onPress={() => setRelationshipModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Wants Kids</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setWantsKidsModal(true)}
      >
        <Text>{wantsKids ? "Yes" : "No"}</Text>
      </TouchableOpacity>
      <Modal
        visible={wantsKidsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setWantsKidsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                setWantsKids(true);
                setWantsKidsModal(false);
              }}
            >
              <MaterialIcons
                name={wantsKids ? "check-box" : "check-box-outline-blank"}
                size={24}
              />
              <Text style={styles.optionText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                setWantsKids(false);
                setWantsKidsModal(false);
              }}
            >
              <MaterialIcons
                name={!wantsKids ? "check-box" : "check-box-outline-blank"}
                size={24}
              />
              <Text style={styles.optionText}>No</Text>
            </TouchableOpacity>
            <Button title="Cancel" onPress={() => setWantsKidsModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Religion</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setReligionModal(true)}
      >
        <Text>{religion || "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={religionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setReligionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {RELIGION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionRow}
                  onPress={() => {
                    setReligion(opt);
                    setReligionModal(false);
                  }}
                >
                  <MaterialIcons
                    name={
                      religion === opt ? "check-box" : "check-box-outline-blank"
                    }
                    size={24}
                  />
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setReligionModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Alcohol</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setAlcoholModal(true)}
      >
        <Text>{alcohol || "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={alcoholModal}
        animationType="slide"
        transparent
        onRequestClose={() => setAlcoholModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {["Yes", "No", "Social", "Sometimes"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionRow}
                  onPress={() => {
                    setAlcohol(opt);
                    setAlcoholModal(false);
                  }}
                >
                  <MaterialIcons
                    name={
                      alcohol === opt ? "check-box" : "check-box-outline-blank"
                    }
                    size={24}
                  />
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setAlcoholModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Cigarettes</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setCigarettesModal(true)}
      >
        <Text>{cigarettes || "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={cigarettesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setCigarettesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {["Yes", "No", "Social", "Sometimes"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionRow}
                  onPress={() => {
                    setCigarettes(opt);
                    setCigarettesModal(false);
                  }}
                >
                  <MaterialIcons
                    name={
                      cigarettes === opt
                        ? "check-box"
                        : "check-box-outline-blank"
                    }
                    size={24}
                  />
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setCigarettesModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Weed</Text>
      <TouchableOpacity style={styles.input} onPress={() => setWeedModal(true)}>
        <Text>{weed || "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={weedModal}
        animationType="slide"
        transparent
        onRequestClose={() => setWeedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {["Yes", "No", "Social", "420"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionRow}
                  onPress={() => {
                    setWeed(opt);
                    setWeedModal(false);
                  }}
                >
                  <MaterialIcons
                    name={
                      weed === opt ? "check-box" : "check-box-outline-blank"
                    }
                    size={24}
                  />
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setWeedModal(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Drugs</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setDrugsModal(true)}
      >
        <Text>{drugs || "Select"}</Text>
      </TouchableOpacity>
      <Modal
        visible={drugsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setDrugsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {["Yes", "No", "Sometimes"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionRow}
                  onPress={() => {
                    setDrugs(opt);
                    setDrugsModal(false);
                  }}
                >
                  <MaterialIcons
                    name={
                      drugs === opt ? "check-box" : "check-box-outline-blank"
                    }
                    size={24}
                  />
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setDrugsModal(false)} />
          </View>
        </View>
      </Modal>

      <View style={{ marginVertical: 20 }}>
        <Button
          title="Create Profile"
          onPress={handleCreate}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  section: { fontSize: 16, fontWeight: "600", marginTop: 16 },
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
