import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ProfileScreen from "../screens/ProfileScreen";
import PreferencesScreen from "../screens/PreferencesScreen";

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: "Profile",
          headerBackTitleVisible: false,
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate("Preferences")}
            >
              <MaterialIcons name="search" size={24} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{
          title: "Search Settings",
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
