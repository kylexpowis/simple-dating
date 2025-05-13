// App.js
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { supabase } from "./Lib/supabase";
import AuthStack from "./src/navigation/AuthStack";
import TabNavigator from "./src/navigation/TabNavigator";

export default function App() {
  const [session, setSession] = useState(null);

  // App.js
  useEffect(() => {
    // restore persisted session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));

    // listen for login / logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer>
      {session ? <TabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}
