import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import OtherUserProfile from "../screens/OtherUserProfile";

const Stack = createStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeList" component={HomeScreen} />
      <Stack.Screen name="OtherUserProfile" component={OtherUserProfile} />
      <Stack.Screen
        name="SingleChat"
        component={SingleChatScreen}
        options={({ route }) => ({
          title: route.params.otherUser.firstName,
        })}
      />
    </Stack.Navigator>
  );
}
