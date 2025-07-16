// App.js
import React, { useState, useEffect } from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./Lib/supabase";
import AuthStack from "./src/navigation/AuthStack";
import TabNavigator from "./src/navigation/TabNavigator";
import OtherUserProfile from "./src/screens/OtherUserProfile";

const RootStack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (
        event === "SIGNED_IN" &&
        (session?.user?.email_confirmed_at || session?.user?.confirmed_at)
      ) {
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: "MainTabs", params: { screen: "UserProfile" } }],
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <RootStack.Screen name="MainTabs" component={TabNavigator} />
            <RootStack.Screen
              name="OtherUserProfile"
              component={OtherUserProfile}
              options={{ headerShown: true, title: "Profile" }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthStack} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
