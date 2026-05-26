import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME } from "../constants/permissions";

export default function Index() {
  const { isHydrated, isLoggedIn, userRole } = useAuth();

  if (!isHydrated) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator size="large" color="#00236F" />
      </View>
    );
  }

  if (isLoggedIn && userRole) {
    return <Redirect href={ROLE_HOME[userRole] as never} />;
  }

  return <Redirect href="/login" />;
}
