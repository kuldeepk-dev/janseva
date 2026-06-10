import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  getDepartments,
  type Department,
} from "../../services/complaintService";
import {
  createRoutingRule,
  deleteRoutingRule,
  getRoutingRules,
  testRoutingRule,
  updateRoutingRule,
  type RoutingRule,
} from "../../services/routingService";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_SLA_DAYS = "3";
const SLA_MIN = 1;
const SLA_MAX = 14;

export default function AdminRoutingScreen() {
  const router = useRouter();
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newDepartmentId, setNewDepartmentId] = useState<string | null>(null);
  const [newSlaDays, setNewSlaDays] = useState(DEFAULT_SLA_DAYS);
  const [showNewRule, setShowNewRule] = useState(false);
  const [newDeptOpen, setNewDeptOpen] = useState(false);
  const [quickDepartmentId, setQuickDepartmentId] = useState<string | null>(
    null,
  );
  const [quickDeptOpen, setQuickDeptOpen] = useState(false);
  const [quickSlaDays, setQuickSlaDays] = useState(DEFAULT_SLA_DAYS);
  const [testCategory, setTestCategory] = useState("");
  const [testResult, setTestResult] = useState<RoutingRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const departmentMap = useMemo(
    () => new Map(departments.map(item => [item.id, item])),
    [departments],
  );

  const selectedRule = rules.find(rule => rule.id === selectedRuleId) ?? null;

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (apiConfigError) {
        setError(apiConfigError);
        return;
      }
      try {
        const [rulesData, departmentData] = await Promise.all([
          getRoutingRules(),
          getDepartments(),
        ]);
        if (!isActive) return;
        setRules(rulesData);
        setDepartments(departmentData);
        setSelectedRuleId(rulesData[0]?.id ?? null);
        setNewDepartmentId(departmentData[0]?.id ?? null);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Failed to load.";
        setError(message);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRule) return;
    setQuickDepartmentId(selectedRule.department_id ?? null);
    setQuickSlaDays(String(selectedRule.sla_days ?? DEFAULT_SLA_DAYS));
  }, [selectedRule]);

  const resolveDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return "Unassigned";
    return departmentMap.get(departmentId)?.name ?? "Unknown Department";
  };

  const resolveDepartmentSub = (departmentId: string | null) => {
    if (!departmentId) return "Admin Review Queue";
    const department = departmentMap.get(departmentId);
    return department?.contact ?? "Department Hub";
  };

  const resolveCategoryIcon = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes("edu")) return "school";
    if (normalized.includes("water")) return "water-drop";
    if (normalized.includes("security") || normalized.includes("police")) {
      return "security";
    }
    if (normalized.includes("health")) return "local-hospital";
    return "assignment";
  };

  const parseSla = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return SLA_MIN;
    return Math.min(SLA_MAX, Math.max(SLA_MIN, parsed));
  };

  const handleToggleNewRule = () => {
    setShowNewRule(prev => !prev);
  };

  const handleAddRule = async () => {
    setError(null);
    if (apiConfigError) {
      setError(apiConfigError);
      return;
    }
    if (!showNewRule) {
      setShowNewRule(true);
      return;
    }
    if (!newCategory.trim()) {
      setError("Enter a source category.");
      return;
    }
    if (!newDepartmentId) {
      setError("Select a target department.");
      return;
    }
    const parsedSla = Number(newSlaDays);
    if (!Number.isFinite(parsedSla) || parsedSla <= 0) {
      setError("SLA days must be a positive number.");
      return;
    }
    setIsSaving(true);
    try {
      const created = await createRoutingRule({
        category: newCategory.trim(),
        department_id: newDepartmentId,
        sla_days: parsedSla,
      });
      setRules(prev => [created, ...prev]);
      setSelectedRuleId(created.id);
      setNewCategory("");
      setNewSlaDays(DEFAULT_SLA_DAYS);
      Alert.alert("Routing", "Rule added successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickUpdate = async () => {
    if (!selectedRule) return;
    setError(null);
    const parsedSla = Number(quickSlaDays);
    if (!Number.isFinite(parsedSla) || parsedSla <= 0) {
      setError("SLA days must be a positive number.");
      return;
    }
    if (!quickDepartmentId) {
      setError("Select a target department.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateRoutingRule(selectedRule.id, {
        department_id: quickDepartmentId,
        sla_days: parsedSla,
      });
      setRules(prev =>
        prev.map(item => (item.id === updated.id ? updated : item)),
      );
      Alert.alert("Routing", "Mapping updated successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setError(null);
    setTestResult(null);
    if (!testCategory.trim()) {
      setError("Enter a category to test.");
      return;
    }
    try {
      const { rule } = await testRoutingRule(testCategory.trim());
      setTestResult(rule);
      if (!rule) {
        Alert.alert("Routing", "No routing rule matched this category.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to test.";
      setError(message);
    }
  };

  const handleDeleteRule = (rule: RoutingRule) => {
    Alert.alert("Delete rule", `Remove routing for ${rule.category}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRoutingRule(rule.id);
            setRules(prev => prev.filter(item => item.id !== rule.id));
            if (selectedRuleId === rule.id) {
              setSelectedRuleId(null);
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to delete.";
            setError(message);
          }
        },
      },
    ]);
  };

  const handleEditRule = (rule: RoutingRule) => {
    setSelectedRuleId(rule.id);
    setQuickDepartmentId(rule.department_id ?? null);
    setQuickSlaDays(String(rule.sla_days ?? DEFAULT_SLA_DAYS));
  };

  const quickSlaValue = parseSla(quickSlaDays);
  const quickSlaPercent =
    ((quickSlaValue - SLA_MIN) / (SLA_MAX - SLA_MIN)) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/admin/settings" as never);
              }
            }}
          >
            <MaterialIcons name="menu" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>Jan Seva Portal</Text>
        </View>
        <TouchableOpacity style={styles.langBtn}>
          <MaterialIcons name="language" size={18} color="#00236F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Complaint Routing Matrix</Text>
        <Text style={styles.pageSub}>
          Configure automated escalations and department assignments based on
          complaint categories.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAddRule}
          disabled={isSaving}
          activeOpacity={0.9}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {isSaving
              ? "Saving..."
              : showNewRule
                ? "Save Rule"
                : "Add New Rule"}
          </Text>
        </TouchableOpacity>

        {showNewRule ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>New Rule Details</Text>
              <TouchableOpacity onPress={handleToggleNewRule}>
                <MaterialIcons name="close" size={20} color="#444651" />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Source Category</Text>
            <TextInput
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="e.g. Water, Education"
              placeholderTextColor="#757682"
              style={styles.input}
            />

            <Text style={styles.label}>Target Department</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setNewDeptOpen(prev => !prev)}
            >
              <Text style={styles.selectText}>
                {newDepartmentId
                  ? resolveDepartmentName(newDepartmentId)
                  : "Select department"}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={20}
                color="#444651"
              />
            </TouchableOpacity>
            {newDeptOpen ? (
              <View style={styles.selectMenu}>
                {departments.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.selectOption}
                    onPress={() => {
                      setNewDepartmentId(item.id);
                      setNewDeptOpen(false);
                    }}
                  >
                    <Text style={styles.selectOptionText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>SLA Resolution Timer (Days)</Text>
            <TextInput
              value={newSlaDays}
              onChangeText={setNewSlaDays}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Active Mappings</Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>
                {rules.length} Rules Active
              </Text>
            </View>
          </View>
          <View style={styles.tableHeader}>
            <View style={styles.tableIconSpacer} />
            <Text style={styles.tableHeaderCategory}>Source Category</Text>
            <Text style={styles.tableHeaderTarget}>Target Department</Text>
            <Text style={styles.tableHeaderSla}>SLA (Days)</Text>
            <Text style={styles.tableHeaderActions}>Actions</Text>
          </View>
          {rules.map(rule => {
            const active = rule.id === selectedRuleId;
            const slaStyle =
              rule.sla_days <= 1
                ? styles.slaBadgeCritical
                : rule.sla_days <= 3
                  ? styles.slaBadgeFast
                  : styles.slaBadgeNormal;
            return (
              <TouchableOpacity
                key={rule.id}
                style={[styles.mappingRow, active && styles.mappingRowActive]}
                onPress={() => setSelectedRuleId(rule.id)}
              >
                <View style={styles.mappingIcon}>
                  <MaterialIcons
                    name={resolveCategoryIcon(rule.category) as any}
                    size={18}
                    color="#1E3A8A"
                  />
                </View>
                <View style={styles.mappingContent}>
                  <Text style={styles.mappingCategory}>{rule.category}</Text>
                </View>
                <View style={styles.mappingTarget}>
                  <Text style={styles.mappingDept}>
                    {resolveDepartmentName(rule.department_id)}
                  </Text>
                  <Text style={styles.mappingSub}>
                    {resolveDepartmentSub(rule.department_id)}
                  </Text>
                </View>
                <View style={[styles.slaBadge, slaStyle]}>
                  <Text style={styles.slaBadgeText}>{rule.sla_days} Days</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handleEditRule(rule)}>
                    <MaterialIcons name="edit" size={18} color="#1E3A8A" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteRule(rule)}>
                    <MaterialIcons name="delete" size={18} color="#B3261E" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
          {!rules.length ? (
            <Text style={styles.emptyText}>No routing rules added yet.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Edit</Text>
          <Text style={styles.label}>Target Department</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setQuickDeptOpen(prev => !prev)}
          >
            <Text style={styles.selectText}>
              {quickDepartmentId
                ? resolveDepartmentName(quickDepartmentId)
                : "Select department"}
            </Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={20}
              color="#444651"
            />
          </TouchableOpacity>
          {quickDeptOpen ? (
            <View style={styles.selectMenu}>
              {departments.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.selectOption}
                  onPress={() => {
                    setQuickDepartmentId(item.id);
                    setQuickDeptOpen(false);
                  }}
                >
                  <Text style={styles.selectOptionText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.slaRow}>
            <Text style={styles.label}>SLA Resolution Timer</Text>
            <Text style={styles.slaValue}>{quickSlaValue} Days</Text>
          </View>
          <View style={styles.sliderWrap}>
            <View style={styles.sliderTrack}>
              <View
                style={[styles.sliderFill, { width: `${quickSlaPercent}%` }]}
              />
              <View
                style={[styles.sliderKnob, { left: `${quickSlaPercent}%` }]}
              />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Critical (1d)</Text>
              <Text style={styles.sliderLabel}>Routine (14d)</Text>
            </View>
          </View>
          <TextInput
            value={quickSlaDays}
            onChangeText={setQuickSlaDays}
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleQuickUpdate}
            disabled={!selectedRule || isSaving}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Update Mapping Logic</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testCard}>
          <Text style={styles.cardTitleLight}>Test Routing</Text>
          <Text style={styles.cardSubLight}>
            Verify your logic by simulating a complaint entry.
          </Text>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={18} color="#C5C5D3" />
            <TextInput
              value={testCategory}
              onChangeText={setTestCategory}
              placeholder="Type complaint keyword..."
              placeholderTextColor="#8C8E99"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTest}
            activeOpacity={0.9}
          >
            <Text style={styles.testButtonText}>Run Logic Test</Text>
          </TouchableOpacity>
          {testResult ? (
            <Text style={styles.testResult}>
              Routed to {resolveDepartmentName(testResult.department_id)} with
              SLA {testResult.sla_days} days.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Constituency Flow Chart</Text>
          <Text style={styles.cardSub}>
            This matrix governs how complaints from 120,000 residents are
            distributed across nodal agencies. Proper mapping reduces resolution
            time by 34% on average.
          </Text>
          <View style={styles.metricsRow}>
            <View>
              <Text style={styles.metricValue}>1.8s</Text>
              <Text style={styles.metricLabel}>Auto-Route Time</Text>
            </View>
            <View>
              <Text style={styles.metricValue}>99.2%</Text>
              <Text style={styles.metricLabel}>Accuracy</Text>
            </View>
          </View>
          <View style={styles.imageMock}>
            <MaterialIcons name="insights" size={44} color="#90A8FF" />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FF" },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { color: "#00236F", fontSize: 18, fontWeight: "700" },
  langBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, paddingBottom: 90, gap: 14 },
  pageTitle: { color: "#121C28", fontSize: 22, fontWeight: "700" },
  pageSub: { color: "#444651", fontSize: 13, lineHeight: 20 },
  primaryButton: {
    backgroundColor: "#00236F",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardTitle: { color: "#121C28", fontSize: 18, fontWeight: "700" },
  cardSub: { color: "#444651", fontSize: 13, lineHeight: 19 },
  label: { color: "#444651", fontSize: 12, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#D6D8E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#121C28",
    fontSize: 13,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: "#D6D8E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  selectText: { color: "#121C28", fontSize: 13, fontWeight: "600" },
  selectMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D6D8E2",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F6",
  },
  selectOptionText: { color: "#121C28", fontSize: 13 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F1F3FA",
  },
  chipActive: { backgroundColor: "#00236F" },
  chipText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusChip: {
    backgroundColor: "#D9F7E8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: { color: "#00714D", fontSize: 11, fontWeight: "700" },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E3EE",
  },
  tableIconSpacer: { width: 34 },
  tableHeaderText: {
    color: "#757682",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  tableHeaderCategory: {
    color: "#757682",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  tableHeaderTarget: {
    color: "#757682",
    fontSize: 11,
    fontWeight: "700",
    flex: 1.2,
  },
  tableHeaderSla: {
    color: "#757682",
    fontSize: 11,
    fontWeight: "700",
    width: 86,
  },
  tableHeaderActions: {
    color: "#757682",
    fontSize: 11,
    fontWeight: "700",
    width: 54,
    textAlign: "right",
  },
  mappingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E3EE",
  },
  mappingRowActive: { backgroundColor: "#F2F6FF", borderRadius: 10 },
  mappingIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#EDF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  mappingContent: { flex: 1 },
  mappingCategory: { color: "#121C28", fontSize: 13, fontWeight: "700" },
  mappingTarget: { flex: 1.2 },
  mappingDept: { color: "#121C28", fontSize: 12, fontWeight: "700" },
  mappingSub: { color: "#757682", fontSize: 11, marginTop: 2 },
  slaBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: "center",
  },
  slaBadgeText: { color: "#1E3A8A", fontSize: 11, fontWeight: "700" },
  slaBadgeCritical: { backgroundColor: "#FAD9D6" },
  slaBadgeFast: { backgroundColor: "#E1E9FB" },
  slaBadgeNormal: { backgroundColor: "#EEF1FF" },
  actionRow: {
    width: 52,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emptyText: { color: "#757682", fontSize: 12, fontStyle: "italic" },
  slaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slaValue: { color: "#00236F", fontSize: 12, fontWeight: "700" },
  sliderWrap: { gap: 8, marginTop: 4 },
  sliderTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E9FB",
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#1E3A8A",
  },
  sliderKnob: {
    position: "absolute",
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1E3A8A",
    marginLeft: -8,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: { color: "#757682", fontSize: 10 },
  secondaryButton: {
    marginTop: 4,
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  testCard: {
    backgroundColor: "#202A36",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardTitleLight: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  cardSubLight: { color: "#C5C5D3", fontSize: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2F3B4A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { color: "#FFFFFF", flex: 1, fontSize: 13 },
  testButton: {
    backgroundColor: "#7AF6C5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  testButtonText: { color: "#0B3B2B", fontSize: 13, fontWeight: "700" },
  testResult: { color: "#CFFBEA", fontSize: 12 },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  metricValue: { color: "#00236F", fontSize: 18, fontWeight: "800" },
  metricLabel: { color: "#757682", fontSize: 11, marginTop: 2 },
  imageMock: {
    marginTop: 10,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#E5EBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: "#B3261E", fontSize: 12 },
});
