import * as Location from "expo-location";
import { supabase } from "./supabase";

/**
 * Requests location permission, fetches the current position, gets the logged in
 * user's ID from Supabase auth and updates their location in the "users" table.
 */
export async function updateUserLocation() {
  // 1. Ask for foreground location permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Location permission not granted");
  }

  // 2. Get the current location
  const { coords } = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = coords;

  // 3. Get the logged in user's ID
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    throw sessionError || new Error("No logged in user");
  }

  const userId = session.user.id;

  // 4. Update the user's row with latest coordinates and timestamp
  const { error } = await supabase
    .from("users")
    .update({
      latitude,
      longitude,
      last_location_update: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
