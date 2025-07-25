import React, { useState, useEffect } from "react";
import * as Linking from "expo-linking";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./Lib/supabase";
import AuthStack from "./src/navigation/AuthStack";
import TabNavigator from "./src/navigation/TabNavigator";
import CreateProfileScreen from "./src/screens/CreateProfileScreen";
import SelectProfileImage from "./src/screens/SelectProfileImage";

const RootStack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) {
        setProfileComplete(false);
        setHasImage(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("users")
          .select("first_name")
          .eq("id", session.user.id)
          .maybeSingle();
        if (error) throw error;
        setProfileComplete(!!data?.first_name);
      } catch (e) {
        console.error("profile fetch error", e);
        setProfileComplete(false);
      }
    };
    fetchProfile();
  }, [session]);

  useEffect(() => {
    const checkImages = async () => {
      if (!session) {
        setHasImage(false);
        return;
      }
      try {
        const { count, error } = await supabase
          .from("user_images")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        if (error) throw error;
        setHasImage((count || 0) > 0);
      } catch (e) {
        console.error("image fetch error", e);
        setHasImage(false);
      }
    };
    checkImages();
  }, [session]);

  const linking = {
    prefixes: [Linking.createURL("/")],
  };

  return (
    <NavigationContainer Linking={Linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : !profileComplete ? (
          <RootStack.Screen name="CreateProfile">
            {() => (
              <CreateProfileScreen
                onComplete={() => setProfileComplete(true)}
              />
            )}
          </RootStack.Screen>
        ) : !hasImage ? (
          <RootStack.Screen name="SelectProfileImage">
            {() => <SelectProfileImage onComplete={() => setHasImage(true)} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Main" component={TabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
