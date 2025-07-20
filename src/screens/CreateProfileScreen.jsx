import React from "react";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { EditProfileScreen } from "./ProfileScreen";

export default function CreateProfileScreen({ onComplete }) {
  const navigation = useNavigation();

  const handleComplete = () => {
    onComplete && onComplete();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "MainTabs" }] })
    );
  };

  return (
    <EditProfileScreen
      onComplete={handleComplete}
      submitLabel="Create Profile"
      showLogout={false}
    />
  );
}