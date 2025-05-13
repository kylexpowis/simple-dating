import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import TabNavigator from "./src/navigation/TabNavigator";
import { supabase } from "../simple-dating/Lib/supabase"; // ✅ Make sure this path matches your setup

import "react-native-url-polyfill/auto"; // ✅ Keep this for auth/network compatibility
global.Buffer = require("buffer").Buffer; // ✅ Required for supabase-js v2 in RN
global.self = global;

export default function App() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error("Auth error:", error);
      else console.log("Logged in user:", data.user);
    });
  }, []);

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
