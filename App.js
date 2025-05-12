import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import TabNavigator from "./src/navigation/TabNavigator";

import "react-native-url-polyfill/auto";
global.Buffer = require("buffer").Buffer;
global.self = global;

export default function App() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
