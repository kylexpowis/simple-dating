import React from "react";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import OtherUserProfile from "../screens/OtherUserProfile";
import SingleChatScreen from "../screens/SingleChatScreen";

const Stack = createStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeList"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="OtherUserProfile"
        component={OtherUserProfile}
        options={{
          title: "",
          headerShown: true,
          headerBackTitleVisible: false,
          ...TransitionPresets.ScaleFromCenterAndroid,
        }}
      />

      <Stack.Screen
        name="SingleChatScreen"
        component={SingleChatScreen}
        options={({ route }) => ({
          title: route.params?.otherUser?.firstName || "Chat",
          headerShown: true,
          headerBackTitleVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}
