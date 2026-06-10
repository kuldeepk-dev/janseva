import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OfficerQueueScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Complaint Queue</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {[
          { id: "JSP-9821", cat: "Sanitation & Drainage", priority: "Critical" },
          { id: "JSP-9844", cat: "Street Lighting", priority: "High" },
          { id: "JSP-9902", cat: "Water Supply Issue", priority: "Medium" },
        ].map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.row}
            onPress={() => router.push(`/officer/complaint/${item.id}` as never)}
          >
            <View>
              <Text style={styles.id}>#{item.id}</Text>
              <Text style={styles.cat}>{item.cat}</Text>
            </View>
            <View style={styles.tag}>
              <MaterialIcons name="priority-high" size={14} color="#264191" />
              <Text style={styles.tagText}>{item.priority}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
    backgroundColor: "#FFFFFF",
  },
  title: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  content: { padding: 16, gap: 10, paddingBottom: 92 },
  row: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  id: { color: "#121C28", fontSize: 15, fontWeight: "700" },
  cat: { color: "#5A6272", marginTop: 2, fontSize: 12 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EAF0FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  tagText: { color: "#264191", fontSize: 11, fontWeight: "700" },
});
