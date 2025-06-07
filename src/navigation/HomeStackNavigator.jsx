// src/navigation/HomeStackNavigator.jsx

import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import OtherUserProfile from "../screens/OtherUserProfile";
import SingleChatScreen from "../screens/SingleChatScreen";

const Stack = createStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeList" component={HomeScreen} />

      <Stack.Screen
        name="OtherUserProfile"
        component={OtherUserProfile}
      />

      <Stack.Screen
        name="SingleChatScreen"
        component={SingleChatScreen}
        options={({ route }) => ({
          // If otherUser.firstName is undefined, show a generic “Chat” title
          title: route.params?.otherUser?.firstName || "Chat",
        })}
      />
    </Stack.Navigator>
  );
}