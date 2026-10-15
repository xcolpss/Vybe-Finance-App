import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  StatusBar,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Image,
  Switch,
} from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import {
  downloadInvoicePdf,
  shareInvoicePdf,
  escapeHtml,
  invoicePdfErrorMessage,
  isUserCancelled,
} from "./src/utils/pdfExport";
import * as DocumentPicker from "expo-document-picker";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  initDatabase,
  getAccounts,
  addAccount,
  deleteAccount,
  restoreAccount,
  getClients,
  addClient,
  updateClient,
  deleteClient,
  restoreClient,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  restoreTransaction,
  getRecurringBills,
  addRecurringBill,
  deleteRecurringBill,
  getCategories,
  addCategory,
  deleteCategory,
  getBudgets,
  setBudgetLimit,
  deleteBudget,
  getUserCurrencies,
  addUserCurrency,
  getBaseCurrency,
  setBaseCurrency,
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  fundSavingsGoal,
  deleteSavingsGoal,
  getDebts,
  addDebt,
  updateDebtStatus,
  deleteDebt,
  getAuraTheme,
  setAuraTheme,
  getThemePreferences,
  setThemePreferences,
  clearAllLocalFinancialData,
  getInvoiceHistory,
  saveInvoiceHistory,
  getLiveRate,
  fetchLiveExchangeRates,
  exportTransactionsCSV,
  exportFullBackupJSON,
  restoreFullBackupJSON,
} from "./src/db/database";

// ================= MASTER REFINEMENT DESIGN TOKENS =================
const PRESET_THEMES = {
  vybeOriginal: {
    name: "Aura Cosmic",
    primary: "#8B5CF6",
    secondary: "#3B82F6",
  },
  cyberpunk: { name: "Cyber Neon", primary: "#FF2A85", secondary: "#00F0FF" },
  aurora: { name: "Aurora Mint", primary: "#00FFCC", secondary: "#7000FF" },
  solar: { name: "Solar Flare", primary: "#FFB800", secondary: "#FF4D00" },
  emerald: { name: "Emerald Pro", primary: "#2EE59D", secondary: "#00C4FF" },
  arctic: { name: "Arctic Frost", primary: "#38EF7D", secondary: "#11998E" },
};

const COLOR_SPECTRUM = [
  "#8B5CF6",
  "#3B82F6",
  "#22D3EE",
  "#2EE59D",
  "#FF2A85",
  "#FFB800",
  "#FF6B4A",
  "#A55EEA",
  "#45AAF2",
  "#2BCBBA",
  "#FA8231",
  "#00F0FF",
];

const VYBE_LOGO = require("./assets/adaptive-icon.png");
const VYBE_ICON_BADGE = require("./assets/icon.png");

const WORLD_CURRENCIES = [
  { code: "USD", country: "United States", flag: "🇺🇸" },
  { code: "EUR", country: "Eurozone", flag: "🇪🇺" },
  { code: "GBP", country: "United Kingdom", flag: "🇬🇧" },
  { code: "AED", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "CAD", country: "Canada", flag: "🇨🇦" },
  { code: "AUD", country: "Australia", flag: "🇦🇺" },
  { code: "SAR", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "PKR", country: "Pakistan", flag: "🇵🇰" },
  { code: "INR", country: "India", flag: "🇮🇳" },
  { code: "JPY", country: "Japan", flag: "🇯🇵" },
  { code: "CNY", country: "China", flag: "🇨🇳" },
  { code: "CHF", country: "Switzerland", flag: "🇨🇭" },
  { code: "SGD", country: "Singapore", flag: "🇸🇬" },
  { code: "MYR", country: "Malaysia", flag: "🇲🇾" },
  { code: "TRY", country: "Turkey", flag: "🇹🇷" },
  { code: "QAR", country: "Qatar", flag: "🇶🇦" },
  { code: "OMR", country: "Oman", flag: "🇴🇲" },
  { code: "KWD", country: "Kuwait", flag: "🇰🇼" },
  { code: "BHD", country: "Bahrain", flag: "🇧🇭" },
].sort((a, b) => a.code.localeCompare(b.code));

const BrandMark = ({
  size = 34,
  auraColor = "#8B5CF6",
  showWordmark = true,
  isDark = true,
}: {
  size?: number;
  auraColor?: string;
  showWordmark?: boolean;
  isDark?: boolean;
}) => (
  <View style={styles.brandMarkContainer}>
    <View
      style={[
        styles.brandLogoWrapper,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          borderColor: `${auraColor}55`,
          shadowColor: auraColor,
          backgroundColor: isDark ? "#11121D" : "#EAEBEE",
        },
      ]}
    >
      <Image
        source={VYBE_LOGO}
        style={{ width: size * 0.78, height: size * 0.78 }}
        resizeMode="contain"
      />
    </View>
    {showWordmark && (
      <View style={{ marginLeft: 11 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[
              styles.brandWordmark,
              { color: isDark ? "#F8FAFC" : "#11121D" },
            ]}
          >
            VYBE
          </Text>
          <View
            style={[
              styles.brandTagPill,
              {
                backgroundColor: `${auraColor}25`,
                borderColor: `${auraColor}66`,
              },
            ]}
          >
            <Text style={[styles.brandTagText, { color: auraColor }]}>
              MANAGER
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.brandSubword,
            { color: isDark ? "#A1A1B5" : "#475569" },
          ]}
        >
          LIQUID FINANCIAL ENGINE
        </Text>
      </View>
    )}
  </View>
);

const EmptyState = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  auraColor,
  isDark = true,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  auraColor: string;
  isDark?: boolean;
}) => (
  <View
    style={[
      styles.emptyStateBox,
      {
        borderColor: `${auraColor}30`,
        backgroundColor: isDark ? "#11121D" : "#FFFFFF",
      },
    ]}
  >
    <View
      style={[
        styles.emptyLogoCircle,
        {
          backgroundColor: `${auraColor}15`,
          borderColor: `${auraColor}40`,
        },
      ]}
    >
      <Image
        source={VYBE_LOGO}
        style={{ width: 32, height: 32, opacity: 0.85 }}
        resizeMode="contain"
      />
    </View>
    <Text
      style={[
        styles.emptyStateTitle,
        { color: isDark ? "#F8FAFC" : "#11121D" },
      ]}
    >
      {title}
    </Text>
    <Text
      style={[styles.emptyStateSub, { color: isDark ? "#A1A1B5" : "#686B7C" }]}
    >
      {subtitle}
    </Text>
    {actionLabel && onAction && (
      <TouchableOpacity
        style={[
          styles.emptyStateBtn,
          { backgroundColor: `${auraColor}20`, borderColor: auraColor },
        ]}
        onPress={() => {
          try {
            Haptics.selectionAsync();
          } catch (e) {}
          onAction();
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.emptyStateBtnText, { color: auraColor }]}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function App() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recurringBills, setRecurringBills] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [invoiceHistoryList, setInvoiceHistoryList] = useState<any[]>([]);
  const [userCurrencies, setUserCurrencies] = useState<string[]>([
    "PKR",
    "USD",
    "EUR",
    "GBP",
    "AED",
  ]);

  const [primaryNav, setPrimaryNav] = useState<
    "home" | "activity" | "insights" | "accounts" | "more"
  >("home");
  const [moreSubTab, setMoreSubTab] = useState<
    "hub" | "bills" | "budgets" | "goals" | "debts" | "clients"
  >("hub");

  // Aura Engine V2 States
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [auraColor, setAuraColor] = useState("#8B5CF6");
  const [auraSecondaryColor, setAuraSecondaryColor] = useState("#3B82F6");
  const [auraIntensity, setAuraIntensity] = useState<
    "off" | "subtle" | "balanced" | "vivid"
  >("balanced");
  const [glassIntensity, setGlassIntensity] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [primaryHexInput, setPrimaryHexInput] = useState("#8B5CF6");
  const [secondaryHexInput, setSecondaryHexInput] = useState("#3B82F6");
  const [themeModal, setThemeModal] = useState(false);
  const [confirmPhraseInput, setConfirmPhraseInput] = useState("");
  const confirmPhraseRef = useRef("");

  // App Lock Security State
  const [appLockEnabled, setAppLockEnabled] = useState(false);

  // Master Refinement Theme Palette
  const THEME = useMemo(
    () => ({
      bg: isDarkMode ? "#09090F" : "#F1F3F9",
      surface: isDarkMode ? "#11121D" : "#FFFFFF",
      surfaceElevated: isDarkMode ? "#191A2A" : "#E2E5EE",
      surfaceGlass: isDarkMode
        ? "rgba(17, 18, 29, 0.88)"
        : "rgba(255, 255, 255, 0.92)",
      primaryViolet: auraColor,
      electricCyan: auraSecondaryColor,
      textPrimary: isDarkMode ? "#F8FAFC" : "#0F172A",
      textSecondary: isDarkMode ? "#A1A1B5" : "#475569",
      textMuted: isDarkMode ? "#64748B" : "#94A3B8",
      borderSubtle: `${auraColor}30`,
      borderCard: isDarkMode
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(15, 23, 42, 0.10)",
      positive: "#10B981",
      negative: "#F43F5E",
      warning: "#F59E0B",
      radius: {
        sm: 10,
        md: 14,
        lg: 20,
        xl: 26,
        pill: 999,
      },
    }),
    [isDarkMode, auraColor, auraSecondaryColor],
  );

  const [onboardingModal, setOnboardingModal] = useState(false);
  const [onboardStep, setOnboardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [userNameInput, setUserNameInput] = useState("");
  const [baseCurrencyChoice, setBaseCurrencyChoice] = useState("PKR");
  const [currencySearchQuery, setCurrencySearchQuery] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<1 | 2 | 3 | 4>(1);

  const [txModal, setTxModal] = useState(false);
  const [clientModal, setClientModal] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [fundGoalModal, setFundGoalModal] = useState<{
    visible: boolean;
    goal: any;
  }>({ visible: false, goal: null });
  const [debtModal, setDebtModal] = useState(false);

  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceHistoryModal, setInvoiceHistoryModal] = useState(false);
  const [invoiceHeading, setInvoiceHeading] = useState(
    "PROFESSIONAL SERVICE INVOICE",
  );
  const [invoiceClient, setInvoiceClient] = useState<any>(null);
  const [invoiceAccountId, setInvoiceAccountId] = useState<number>(1);
  const [invoiceMode, setInvoiceMode] = useState<"bullets" | "notes">(
    "bullets",
  );
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<
    { desc: string; price: string }[]
  >([{ desc: "3D Asset Modeling & Texturing", price: "25000" }]);

  const [victoryModal, setVictoryModal] = useState<{
    visible: boolean;
    title: string;
  }>({ visible: false, title: "" });
  const [menuModal, setMenuModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ visible: false, title: "", message: "", onConfirm: () => {} });

  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [undoAction, setUndoAction] = useState<{
    message: string;
    undoFn: () => void;
  } | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);

  const [selectedAccountFilter, setSelectedAccountFilter] = useState<
    number | null
  >(null);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<
    "all" | "in" | "out" | "transfer"
  >("all");
  const [timeFilter, setTimeFilter] = useState<
    "all" | "week" | "month" | "last_month" | "year" | "custom"
  >("all");
  const [rangeTab, setRangeTab] = useState<"start" | "end">("start");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  // Statement Export Advanced Range Selectors
  const [statementRangeTab, setStatementRangeTab] = useState<"start" | "end">(
    "start",
  );
  const [exportStartDate, setExportStartDate] = useState("2026-10-01");
  const [exportEndDate, setExportEndDate] = useState("2026-10-31");

  // Recurring Bill Advanced Range Selectors
  const [billRangeTab, setBillRangeTab] = useState<"start" | "end">("start");
  const [billStartDate, setBillStartDate] = useState("2026-10-01");
  const [billEndDate, setBillEndDate] = useState("2026-12-31");

  const [goalYear, setGoalYear] = useState("2026");
  const [goalMonth, setGoalMonth] = useState("12");
  const [goalDay, setGoalDay] = useState("31");

  const [debtYear, setDebtYear] = useState("2026");
  const [debtMonth, setDebtMonth] = useState("12");
  const [debtDay, setDebtDay] = useState("31");

  const [editingClient, setEditingClient] = useState<any>(null);
  const [editingTx, setEditingTx] = useState<any>(null);

  const [txType, setTxType] = useState<"in" | "out" | "transfer">("out");
  const [amountInput, setAmountInput] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [exchangeRate, setExchangeRate] = useState("276.80");
  const [overrideRateActive, setOverrideRateActive] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Groceries & Food");
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1);
  const [destAccountId, setDestAccountId] = useState<number>(2);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const [quickClientName, setQuickClientName] = useState("");
  const [showQuickClientInput, setShowQuickClientInput] = useState(false);

  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("wallet");
  const [accBalance, setAccBalance] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientCountry, setClientCountry] = useState("");
  const [clientCategory, setClientCategory] = useState("Upwork");

  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billCategory, setBillCategory] = useState("Software & Subscriptions");
  const [billAccountId, setBillAccountId] = useState(1);
  const [billDueDay, setBillDueDay] = useState("1");

  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"in" | "out">("out");
  const [budgetCategory, setBudgetCategory] = useState("Groceries & Food");
  const [budgetLimitInput, setBudgetLimitInput] = useState("");

  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalFundInput, setGoalFundInput] = useState("");
  const [fundingAccountId, setFundingAccountId] = useState<number>(1);

  const [debtTitle, setDebtTitle] = useState("");
  const [debtType, setDebtType] = useState<"lent" | "borrowed">("lent");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtAccountId, setDebtAccountId] = useState<number>(1);

  // Animations
  const slideAnim = useRef(new Animated.Value(-310)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(1)).current;
  const undoProgressAnim = useRef(new Animated.Value(1)).current;
  const insightsWelcomeAnim = useRef(new Animated.Value(0)).current;
  const barAnimProgress = useRef(new Animated.Value(0)).current;
  const accountScaleAnims = useRef<{ [key: number]: Animated.Value }>(
    {},
  ).current;

  const defaultExpenseCategories = [
    "Groceries & Food",
    "Housing & Rent",
    "Utilities",
    "Transport & Fuel",
    "Software & Subscriptions",
    "Shopping & Clothing",
    "Healthcare & Medical",
    "Entertainment",
    "Personal",
    "Business Expenses",
    "Other Expenses",
  ];

  const defaultIncomeCategories = [
    "Freelance / Client Payment",
    "Salary / Wage",
    "Business Revenue",
    "Investments",
    "Gift / Allowance",
    "Side Hustle",
    "Other Income",
  ];

  const allExpenseCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultExpenseCategories,
          ...customCategories
            .filter((c) => c.type === "out")
            .map((c) => c.name),
        ]),
      ),
    [customCategories],
  );

  const allIncomeCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultIncomeCategories,
          ...customCategories.filter((c) => c.type === "in").map((c) => c.name),
        ]),
      ),
    [customCategories],
  );

  useEffect(() => {
    initDatabase();
    loadData();

    const savedTheme = getAuraTheme();
    const savedPreferences = getThemePreferences();
    const activePrimary =
      savedPreferences.primaryAccent || savedTheme || "#8B5CF6";
    const activeSecondary = savedPreferences.secondaryAccent || "#3B82F6";

    setAuraColor(activePrimary);
    setPrimaryHexInput(activePrimary);
    setAuraSecondaryColor(activeSecondary);
    setSecondaryHexInput(activeSecondary);
    setAuraIntensity(savedPreferences.auraIntensity);
    setGlassIntensity(savedPreferences.glassIntensity);
    if (savedPreferences.mode === "light") {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(true);
    }

    const baseCur = getBaseCurrency();
    if (!baseCur) {
      setOnboardingModal(true);
      setOnboardStep(1);
    } else {
      setCurrency(baseCur);
    }
  }, []);

  useEffect(() => {
    if (primaryNav === "insights") {
      insightsWelcomeAnim.setValue(0);
      barAnimProgress.setValue(0);
      Animated.parallel([
        Animated.spring(insightsWelcomeAnim, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(barAnimProgress, {
          toValue: 1,
          duration: 750,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [primaryNav]);

  useEffect(() => {
    if (currency !== "PKR") {
      fetchLiveExchangeRates().then(() => {
        const rate = getLiveRate(currency);
        setExchangeRate(rate.toString());
      });
    }
  }, [currency]);

  const loadData = () => {
    const loadedAccounts = getAccounts();
    setAccounts(loadedAccounts);
    setClients(getClients());
    setTransactions(getTransactions());
    setRecurringBills(getRecurringBills());
    setCustomCategories(getCategories());
    setBudgets(getBudgets());
    setSavingsGoals(getSavingsGoals());
    setDebts(getDebts());
    setInvoiceHistoryList(getInvoiceHistory());
    setUserCurrencies(getUserCurrencies());

    loadedAccounts.forEach((acc: any) => {
      if (!accountScaleAnims[acc.id]) {
        accountScaleAnims[acc.id] = new Animated.Value(1);
      }
    });
  };

  const animateScreenTransition = () => {
    screenFadeAnim.setValue(0.88);
    Animated.timing(screenFadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePrimaryNavChange = (
    tab: "home" | "activity" | "insights" | "accounts" | "more",
  ) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setPrimaryNav(tab);
    if (tab !== "more") {
      setMoreSubTab("hub");
    }
    animateScreenTransition();
  };

  const openMoreFeature = (
    sub: "hub" | "bills" | "budgets" | "goals" | "debts" | "clients",
  ) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setPrimaryNav("more");
    setMoreSubTab(sub);
    animateScreenTransition();
  };

  const persistVisualPreferences = (
    overrides: Partial<ReturnType<typeof getThemePreferences>> = {},
  ) => {
    setThemePreferences({
      ...getThemePreferences(),
      primaryAccent: auraColor,
      secondaryAccent: auraSecondaryColor,
      auraIntensity,
      glassIntensity,
      mode: isDarkMode ? "dark" : "light",
      ...overrides,
    });
  };

  const isValidHex = (value: string) =>
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  const normalizeHex = (value: string) => {
    const raw = value.trim().replace(/^#/, "").toUpperCase();
    return `#${
      raw.length === 3
        ? raw
            .split("")
            .map((p) => p + p)
            .join("")
        : raw
    }`;
  };

  const changeAuraTheme = (primaryHex: string, secondaryHex?: string) => {
    if (!isValidHex(primaryHex)) return;
    const normalizedPrimary = normalizeHex(primaryHex);
    const normalizedSecondary =
      secondaryHex && isValidHex(secondaryHex)
        ? normalizeHex(secondaryHex)
        : auraSecondaryColor;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setAuraColor(normalizedPrimary);
    setPrimaryHexInput(normalizedPrimary);
    setAuraSecondaryColor(normalizedSecondary);
    setSecondaryHexInput(normalizedSecondary);
    setAuraTheme(normalizedPrimary);
    persistVisualPreferences({
      primaryAccent: normalizedPrimary,
      secondaryAccent: normalizedSecondary,
    });
    triggerCelebration();
  };

  const pickRandomTheme = () => {
    const randomHex =
      COLOR_SPECTRUM[Math.floor(Math.random() * COLOR_SPECTRUM.length)];
    const randomHex2 =
      COLOR_SPECTRUM[Math.floor(Math.random() * COLOR_SPECTRUM.length)];
    changeAuraTheme(randomHex, randomHex2);
  };

  const handleAccountPressIn = (id: number) => {
    if (accountScaleAnims[id]) {
      Animated.spring(accountScaleAnims[id], {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleAccountPressOut = (id: number) => {
    if (accountScaleAnims[id]) {
      Animated.spring(accountScaleAnims[id], {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }
  };

  const openMenu = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setMenuModal(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 75,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -310,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setMenuModal(false));
  };

  const triggerCelebration = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.03,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerVictoryCelebration = (title: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    triggerCelebration();
    setVictoryModal({ visible: true, title });
  };

  const triggerUndo = (message: string, undoFn: () => void) => {
    setUndoAction({ message, undoFn });
    undoProgressAnim.setValue(1);
    Animated.timing(undoProgressAnim, {
      toValue: 0,
      duration: 8000,
      useNativeDriver: false,
    }).start();

    setTimeout(() => setUndoAction(null), 8000);
  };

  const completeOnboarding = () => {
    setBaseCurrency(baseCurrencyChoice);
    setCurrency(baseCurrencyChoice);
    addUserCurrency(baseCurrencyChoice);
    setOnboardingModal(false);
    triggerCelebration();
  };

  const handleToggleAppLock = async (value: boolean) => {
    if (value) {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!compatible || !enrolled) {
          Alert.alert(
            "Biometrics Unavailable",
            "Your device does not have biometrics enrolled. App lock cannot be enabled.",
          );
          return;
        }
        const res = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to enable VYBE App Lock",
        });
        if (res.success) {
          setAppLockEnabled(true);
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
      } catch (e) {
        console.log("App lock auth error:", e);
      }
    } else {
      setAppLockEnabled(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        Alert.alert(
          "Authentication Required",
          "Please configure device biometrics to authorize vault reset.",
        );
        return;
      }

      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to Wipe All Local Vault Data",
      });
      if (!res.success) {
        return;
      }

      setConfirmPhraseInput("");
      confirmPhraseRef.current = "";
      setConfirmModal({
        visible: true,
        title: "⚠️ Clear Local Financial Data",
        message:
          'This will permanently erase all local accounts, transactions, and settings from device storage. Type "CLEAR VYBE" below to confirm.',
        onConfirm: () => {
          if (confirmPhraseRef.current.trim() !== "CLEAR VYBE") {
            Alert.alert(
              "Confirmation Mismatched",
              'You must type exactly "CLEAR VYBE" to execute data clearing.',
            );
            return;
          }
          try {
            clearAllLocalFinancialData();
            setConfirmPhraseInput("");
            confirmPhraseRef.current = "";
            loadData();
            setOnboardingModal(true);
            setOnboardStep(1);
            Alert.alert(
              "Vault Wiped",
              "All local database records have been successfully cleared.",
            );
          } catch (e) {
            setErrorModal({
              visible: true,
              message: "Failed to clear local database storage.",
            });
          }
        },
      });
    } catch (e) {
      console.log("Biometric clear error:", e);
    }
  };

  const handleSaveTransaction = () => {
    if (!amountInput) return;

    const parsedAmount = parseFloat(amountInput);
    const rate =
      currency === "PKR"
        ? 1.0
        : parseFloat(exchangeRate) || getLiveRate(currency);
    const finalPKRAmount = parsedAmount * rate;

    if (txType === "out" || txType === "transfer") {
      const sourceAcc = accounts.find((a) => a.id === selectedAccountId);
      if (sourceAcc && sourceAcc.balance < finalPKRAmount) {
        setErrorModal({
          visible: true,
          message: `Insufficient balance in "${sourceAcc.name}". Available: PKR ${sourceAcc.balance.toLocaleString()}, Required: PKR ${finalPKRAmount.toLocaleString()}.`,
        });
        return;
      }
    }

    if (txType === "transfer" && selectedAccountId === destAccountId) {
      setErrorModal({
        visible: true,
        message: `Source and Destination accounts cannot be the same!`,
      });
      return;
    }

    let clientId = selectedClientId;
    if (txType === "in" && showQuickClientInput && quickClientName) {
      const newC = addClient(
        quickClientName,
        "Independent",
        "Pakistan",
        "Direct",
      );
      if (newC) clientId = newC.id;
    }

    if (editingTx) {
      updateTransaction(editingTx.id, description, category, finalPKRAmount);
      setEditingTx(null);
    } else {
      const srcAcc = accounts.find((a) => a.id === selectedAccountId);
      const dstAcc = accounts.find((a) => a.id === destAccountId);

      let desc = description;
      if (txType === "transfer") {
        desc =
          desc ||
          `Transfer from ${srcAcc?.name || "Account"} to ${dstAcc?.name || "Account"}`;
      }

      addTransaction(
        1,
        selectedAccountId || accounts[0]?.id || 1,
        clientId,
        txType,
        finalPKRAmount,
        parsedAmount,
        currency,
        rate,
        desc || `${category}`,
        category,
        txType === "transfer" ? destAccountId : null,
      );
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    triggerCelebration();
    setAmountInput("");
    setDescription("");
    setQuickClientName("");
    setShowQuickClientInput(false);
    setSelectedClientId(null);
    setTxModal(false);
    loadData();
  };

  const handleSaveBill = () => {
    if (!billName || !billAmount) return;
    addRecurringBill(
      billName,
      parseFloat(billAmount),
      billCategory,
      billAccountId,
      parseInt(billDueDay) || 1,
    );
    setBillName("");
    setBillAmount("");
    loadData();
    triggerCelebration();
  };

  const payRecurringBillNow = (bill: any) => {
    const targetAcc =
      accounts.find((a) => a.id === bill.account_id) || accounts[0];
    if (targetAcc.balance < bill.amount) {
      setErrorModal({
        visible: true,
        message: `Insufficient balance in "${targetAcc.name}" to pay recurring bill "${bill.name}".`,
      });
      return;
    }
    addTransaction(
      1,
      targetAcc.id,
      null,
      "out",
      bill.amount,
      bill.amount,
      "PKR",
      1.0,
      `Auto Bill: ${bill.name}`,
      bill.category,
    );
    loadData();
    triggerCelebration();
  };

  const handleSaveGoal = () => {
    if (!goalTitle || !goalTargetAmount) return;
    const targetAmt = parseFloat(goalTargetAmount);
    const finalDateStr = `${goalYear}-${goalMonth}-${goalDay}`;

    if (editingGoalId) {
      updateSavingsGoal(editingGoalId, goalTitle, targetAmt, finalDateStr);
      setEditingGoalId(null);
    } else {
      addSavingsGoal(goalTitle, targetAmt, finalDateStr);
    }

    setGoalTitle("");
    setGoalTargetAmount("");
    setGoalModal(false);
    loadData();
    triggerCelebration();
  };

  const handleFundGoal = () => {
    if (!goalFundInput || !fundGoalModal.goal) return;
    const amt = parseFloat(goalFundInput);
    const sourceAcc = accounts.find((a) => a.id === fundingAccountId);

    if (sourceAcc && sourceAcc.balance < amt) {
      setErrorModal({
        visible: true,
        message: `Insufficient balance in "${sourceAcc.name}" to fund this goal.`,
      });
      return;
    }

    addTransaction(
      1,
      fundingAccountId,
      null,
      "out",
      amt,
      amt,
      "PKR",
      1.0,
      `Funding Goal: ${fundGoalModal.goal.title}`,
      "Savings Allocation",
    );

    const isCompleted = fundSavingsGoal(fundGoalModal.goal.id, amt);
    setGoalFundInput("");
    setFundGoalModal({ visible: false, goal: null });
    loadData();

    if (isCompleted) {
      triggerVictoryCelebration(fundGoalModal.goal.title);
    } else {
      triggerCelebration();
    }
  };

  const handleSaveDebt = () => {
    if (!debtTitle || !debtAmount) return;
    const amt = parseFloat(debtAmount);
    const acc = accounts.find((a) => a.id === debtAccountId);
    const finalDateStr = `${debtYear}-${debtMonth}-${debtDay}`;

    if (debtType === "lent" && acc && acc.balance < amt) {
      setErrorModal({
        visible: true,
        message: `Insufficient balance in "${acc.name}" to lend PKR ${amt.toLocaleString()}.`,
      });
      return;
    }

    if (debtType === "lent") {
      addTransaction(
        1,
        debtAccountId,
        null,
        "out",
        amt,
        amt,
        "PKR",
        1.0,
        `Lent money: ${debtTitle}`,
        "Debt & Loans",
      );
    } else {
      addTransaction(
        1,
        debtAccountId,
        null,
        "in",
        amt,
        amt,
        "PKR",
        1.0,
        `Borrowed money: ${debtTitle}`,
        "Debt & Loans",
      );
    }

    addDebt(debtTitle, debtType, amt, debtAccountId, finalDateStr);
    setDebtTitle("");
    setDebtAmount("");
    setDebtModal(false);
    loadData();
    triggerCelebration();
  };

  const handleSettleDebt = (debt: any) => {
    const acc = accounts.find((a) => a.id === debt.account_id) || accounts[0];
    if (debt.type === "borrowed" && acc.balance < debt.amount) {
      setErrorModal({
        visible: true,
        message: `Insufficient balance in "${acc.name}" to repay borrowed debt "${debt.title}".`,
      });
      return;
    }

    if (debt.type === "borrowed") {
      addTransaction(
        1,
        acc.id,
        null,
        "out",
        debt.amount,
        debt.amount,
        "PKR",
        1.0,
        `Repaid loan: ${debt.title}`,
        "Debt Settlement",
      );
    } else {
      addTransaction(
        1,
        acc.id,
        null,
        "in",
        debt.amount,
        debt.amount,
        "PKR",
        1.0,
        `Loan collected: ${debt.title}`,
        "Debt Settlement",
      );
    }

    updateDebtStatus(debt.id, "settled");
    loadData();
    triggerCelebration();
  };

  const handleSaveCategory = () => {
    if (!newCatName) return;
    addCategory(newCatName, newCatType);
    setNewCatName("");
    loadData();
    triggerCelebration();
  };

  const handleSaveBudget = () => {
    if (!budgetLimitInput) return;
    setBudgetLimit(budgetCategory, parseFloat(budgetLimitInput));
    setBudgetLimitInput("");
    loadData();
    triggerCelebration();
  };

  const handleSaveClient = () => {
    if (!clientName) return;
    if (editingClient) {
      updateClient(
        editingClient.id,
        clientName,
        clientCompany,
        clientCountry,
        clientCategory,
      );
      setEditingClient(null);
    } else {
      addClient(
        clientName,
        clientCompany || "Independent",
        clientCountry || "Global",
        clientCategory,
      );
    }
    setClientName("");
    setClientCompany("");
    setClientCountry("");
    setClientModal(false);
    loadData();
  };

  const handleSaveAccount = () => {
    if (!accName || !accBalance) return;
    const newAcc = addAccount(
      1,
      accName,
      accType,
      parseFloat(accBalance),
      "PKR",
    );
    if (newAcc) {
      accountScaleAnims[newAcc.id] = new Animated.Value(1);
    }
    setAccName("");
    setAccBalance("");
    setAccountModal(false);
    loadData();
  };

  const buildInvoiceData = () => {
    if (!invoiceClient) {
      setErrorModal({
        visible: true,
        message: "Please select a client for the invoice.",
      });
      return null;
    }

    const bankAcc = accounts.find((a) => a.id === invoiceAccountId);
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString();

    let totalCalculated = 0;
    let itemsHTML = "";

    if (invoiceMode === "bullets") {
      invoiceItems.forEach((item, idx) => {
        const p = parseFloat(item.price) || 0;
        totalCalculated += p;
        itemsHTML += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${idx + 1}. ${escapeHtml(item.desc || "Service Item")}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">PKR ${p.toLocaleString()}</td>
          </tr>
        `;
      });
    } else {
      totalCalculated = parseFloat(invoiceItems[0]?.price) || 0;
      itemsHTML = `
        <tr>
          <td colspan="2" style="padding: 12px; border-bottom: 1px solid #ddd;">${escapeHtml(invoiceNotes || invoiceItems[0]?.desc || "Professional Services Rendered")}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice</title>
        <style>
          @page { margin: 16px; }
          body { font-family: Helvetica, Arial, sans-serif; color: #111; padding: 24px; }
          .header { width: 100%; border-bottom: 2px solid ${auraColor}; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: ${auraColor}; }
          .meta { font-size: 12px; color: #555; text-align: right; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f4f5fa; padding: 10px; text-align: left; font-size: 12px; color: #444; }
          .total-box { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; color: #111; background: #f4f5fa; padding: 15px; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <table class="header">
          <tr>
            <td>
              <div class="title">${escapeHtml(invoiceHeading)}</div>
              <div style="font-size: 11px; color: #778; margin-top: 4px;">VYBE Manager • Liquid Engine</div>
            </td>
            <td class="meta">
              <div><strong>Date:</strong> ${escapeHtml(dateStr)}</div>
              <div><strong>Time:</strong> ${escapeHtml(timeStr)}</div>
            </td>
          </tr>
        </table>

        <div class="section">
          <div class="section-title">Client Details</div>
          <div><strong>Name:</strong> ${escapeHtml(invoiceClient.name)}</div>
          <div><strong>Company:</strong> ${escapeHtml(invoiceClient.company)} (${escapeHtml(invoiceClient.country)})</div>
          <div><strong>Category:</strong> ${escapeHtml(invoiceClient.category)}</div>
        </div>

        <div class="section">
          <div class="section-title">Payment Account / Routing</div>
          <div><strong>Bank/Wallet:</strong> ${escapeHtml(bankAcc?.name || "Main Wallet")} (${escapeHtml(bankAcc?.type || "wallet")})</div>
        </div>

        <div class="section">
          <div class="section-title">Line Items & Scope of Work</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <div class="total-box">
          Total Amount Due: PKR ${totalCalculated.toLocaleString()}
        </div>

        <div class="footer">
          Generated securely via VYBE Manager • Certified Digital Statement
        </div>
      </body>
      </html>
    `;

    return { htmlContent, totalCalculated };
  };

  const generateAndDownloadPDFInvoice = async () => {
    const data = buildInvoiceData();
    if (!data) return;
    const { htmlContent, totalCalculated } = data;

    try {
      saveInvoiceHistory(
        invoiceClient.name,
        invoiceHeading,
        totalCalculated,
        htmlContent,
      );
      loadData();

      const result = await downloadInvoicePdf({
        html: htmlContent,
        fileName: `Invoice_${invoiceClient?.name || "Client"}_${Date.now()}`,
      });

      if (!result.canceled) {
        setInvoiceModal(false);
        Alert.alert(
          "Invoice Saved",
          "PDF invoice has been saved directly to your device storage.",
          [{ text: "OK" }],
        );
      }
    } catch (e) {
      if (!isUserCancelled(e)) {
        setErrorModal({
          visible: true,
          message: invoicePdfErrorMessage(e),
        });
      }
    }
  };

  const generateAndSharePDFInvoice = async () => {
    const data = buildInvoiceData();
    if (!data) return;
    const { htmlContent, totalCalculated } = data;

    try {
      saveInvoiceHistory(
        invoiceClient.name,
        invoiceHeading,
        totalCalculated,
        htmlContent,
      );
      loadData();

      await shareInvoicePdf({
        html: htmlContent,
        fileName: `Invoice_${invoiceClient?.name || "Client"}_${Date.now()}`,
        dialogTitle: "Share PDF Invoice",
      });

      setInvoiceModal(false);
    } catch (e) {
      if (!isUserCancelled(e)) {
        setErrorModal({
          visible: true,
          message: invoicePdfErrorMessage(e),
        });
      }
    }
  };

  const downloadDeviceExcelCSV = async () => {
    try {
      const csvData = exportTransactionsCSV(exportStartDate, exportEndDate);
      const fileName = `VYBE_Statement_${exportStartDate}_to_${exportEndDate}.csv`;

      if (Platform.OS === "web") {
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(permanentUri, csvData, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(permanentUri, {
          mimeType: "text/csv",
          dialogTitle: "Download Excel/CSV Statement",
        });
      }
      setExportModal(false);
    } catch (e) {
      console.log("Excel/CSV export error:", e);
    }
  };

  const handleUploadBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "*/*"],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        let fileContent = "";
        if (Platform.OS === "web") {
          const resp = await fetch(fileUri);
          fileContent = await resp.text();
        } else {
          fileContent = await FileSystem.readAsStringAsync(fileUri);
        }
        const parsed = JSON.parse(fileContent);
        restoreFullBackupJSON(parsed);
        loadData();
        triggerCelebration();
        closeMenu();
      }
    } catch (e) {
      setErrorModal({
        visible: true,
        message: "Failed to restore backup file.",
      });
    }
  };

  const downloadBackup = async () => {
    try {
      const jsonString = exportFullBackupJSON();
      const fileName = `VYBE_Full_Backup_${Date.now()}.json`;

      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], {
          type: "application/json;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(permanentUri, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(permanentUri, {
          mimeType: "application/json",
          dialogTitle: "Download Full Backup JSON",
        });
      }
      closeMenu();
    } catch (e) {
      console.log("Export Backup error:", e);
    }
  };

  // Financial Calculations
  const totalNetWorth = useMemo(
    () => accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
    [accounts],
  );

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  const monthlyMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap: { [key: string]: number } = {};

    transactions.forEach((t: any) => {
      if (t.date && t.date.startsWith(currentMonthPrefix)) {
        if (t.type === "in") {
          income += Number(t.amount) || 0;
        } else if (t.type === "out") {
          const amt = Number(t.amount) || 0;
          expense += amt;
          catMap[t.category] = (catMap[t.category] || 0) + amt;
        }
      }
    });

    return { income, expense, catMap };
  }, [transactions, currentMonthPrefix]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      if (
        selectedAccountFilter &&
        Number(t.account_id) !== Number(selectedAccountFilter) &&
        Number(t.dest_account_id) !== Number(selectedAccountFilter)
      ) {
        return false;
      }
      if (ledgerTypeFilter !== "all" && t.type !== ledgerTypeFilter) {
        return false;
      }
      if (ledgerSearchQuery.trim() !== "") {
        const q = ledgerSearchQuery.toLowerCase();
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        const matchCat = (t.category || "").toLowerCase().includes(q);
        if (!matchDesc && !matchCat) return false;
      }

      const today = new Date().toISOString().split("T")[0];
      const txDate = t.date || "";

      if (timeFilter === "week") {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        if (txDate < oneWeekAgo) return false;
      } else if (timeFilter === "month") {
        if (!txDate.startsWith(today.slice(0, 7))) return false;
      } else if (timeFilter === "last_month") {
        const lastMonthPrefix = new Date(
          new Date().setMonth(new Date().getMonth() - 1),
        )
          .toISOString()
          .slice(0, 7);
        if (!txDate.startsWith(lastMonthPrefix)) return false;
      } else if (timeFilter === "year") {
        if (!txDate.startsWith(today.slice(0, 4))) return false;
      } else if (timeFilter === "custom") {
        if (txDate < startDate || txDate > endDate) return false;
      }
      return true;
    });
  }, [
    transactions,
    selectedAccountFilter,
    ledgerTypeFilter,
    ledgerSearchQuery,
    timeFilter,
    startDate,
    endDate,
  ]);

  const periodAnalytics = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    const breakdown: { [key: string]: number } = {};

    filteredTransactions.forEach((t: any) => {
      if (t.type === "in") {
        inflow += Number(t.amount) || 0;
      } else if (t.type === "out") {
        const amt = Number(t.amount) || 0;
        outflow += amt;
        breakdown[t.category] = (breakdown[t.category] || 0) + amt;
      }
    });

    const sortedCategories = Object.entries(breakdown).sort(
      (a, b) => b[1] - a[1],
    );

    return { inflow, outflow, sortedCategories };
  }, [filteredTransactions]);

  const filteredCurrencies = WORLD_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(currencySearchQuery.toLowerCase()),
  );

  // ================= UI RENDER HELPERS =================
  const renderTimeFilterPills = () => (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 12 }}
      >
        {[
          { key: "all", label: "All Time" },
          { key: "week", label: "This Week" },
          { key: "month", label: "This Month" },
          { key: "last_month", label: "Last Month" },
          { key: "year", label: "This Year" },
          { key: "custom", label: "Custom Range" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.pillChip,
              {
                backgroundColor: THEME.surfaceElevated,
                borderColor: THEME.borderCard,
              },
              timeFilter === f.key && {
                backgroundColor: auraColor,
                borderColor: auraColor,
              },
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch (e) {}
              setTimeFilter(f.key as any);
            }}
          >
            <Text
              style={[
                styles.pillChipText,
                {
                  color:
                    timeFilter === f.key
                      ? isDarkMode
                        ? THEME.bg
                        : "#FFF"
                      : THEME.textSecondary,
                },
                timeFilter === f.key && styles.pillChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {timeFilter === "custom" && (
        <View
          style={[
            styles.modernRangeBox,
            {
              borderColor: `${auraColor}40`,
              backgroundColor: THEME.surface,
            },
          ]}
        >
          <View
            style={[
              styles.rangeTabsRow,
              {
                backgroundColor: THEME.surfaceElevated,
                borderColor: THEME.borderCard,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.rangeTabBtn,
                rangeTab === "start" && { backgroundColor: auraColor },
              ]}
              onPress={() => setRangeTab("start")}
            >
              <Text
                style={[
                  styles.rangeTabText,
                  {
                    color:
                      rangeTab === "start"
                        ? isDarkMode
                          ? THEME.bg
                          : "#FFF"
                        : THEME.textSecondary,
                  },
                  rangeTab === "start" && styles.rangeTabTextActive,
                ]}
              >
                From: {startDate}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rangeTabBtn,
                rangeTab === "end" && { backgroundColor: auraColor },
              ]}
              onPress={() => setRangeTab("end")}
            >
              <Text
                style={[
                  styles.rangeTabText,
                  {
                    color:
                      rangeTab === "end"
                        ? isDarkMode
                          ? THEME.bg
                          : "#FFF"
                        : THEME.textSecondary,
                  },
                  rangeTab === "end" && styles.rangeTabTextActive,
                ]}
              >
                To: {endDate}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.rangeSubLabel, { color: auraColor }]}>
            Select Year:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}
          >
            {["2024", "2025", "2026", "2027"].map((yr) => {
              const active =
                rangeTab === "start"
                  ? startDate.startsWith(yr)
                  : endDate.startsWith(yr);
              return (
                <TouchableOpacity
                  key={yr}
                  style={[
                    styles.pillChip,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    active && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => {
                    if (rangeTab === "start") {
                      setStartDate(`${yr}${startDate.slice(4)}`);
                    } else {
                      setEndDate(`${yr}${endDate.slice(4)}`);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pillChipText,
                      {
                        color: active
                          ? isDarkMode
                            ? THEME.bg
                            : "#FFF"
                          : THEME.textSecondary,
                      },
                      active && styles.pillChipTextActive,
                    ]}
                  >
                    {yr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.rangeSubLabel, { color: auraColor }]}>
            Select Month:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}
          >
            {[
              { m: "01", name: "Jan" },
              { m: "02", name: "Feb" },
              { m: "03", name: "Mar" },
              { m: "04", name: "Apr" },
              { m: "05", name: "May" },
              { m: "06", name: "Jun" },
              { m: "07", name: "Jul" },
              { m: "08", name: "Aug" },
              { m: "09", name: "Sep" },
              { m: "10", name: "Oct" },
              { m: "11", name: "Nov" },
              { m: "12", name: "Dec" },
            ].map((mo) => {
              const active =
                rangeTab === "start"
                  ? startDate.slice(5, 7) === mo.m
                  : endDate.slice(5, 7) === mo.m;
              return (
                <TouchableOpacity
                  key={mo.m}
                  style={[
                    styles.pillChip,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    active && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => {
                    if (rangeTab === "start") {
                      setStartDate(
                        `${startDate.slice(0, 4)}-${mo.m}${startDate.slice(7)}`,
                      );
                    } else {
                      setEndDate(
                        `${endDate.slice(0, 4)}-${mo.m}${endDate.slice(7)}`,
                      );
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pillChipText,
                      {
                        color: active
                          ? isDarkMode
                            ? THEME.bg
                            : "#FFF"
                          : THEME.textSecondary,
                      },
                      active && styles.pillChipTextActive,
                    ]}
                  >
                    {mo.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.rangeSubLabel, { color: auraColor }]}>
            Select Day:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Array.from({ length: 31 }, (_, i) =>
              String(i + 1).padStart(2, "0"),
            ).map((d) => {
              const active =
                rangeTab === "start"
                  ? startDate.endsWith(d)
                  : endDate.endsWith(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.pillChip,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    active && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => {
                    if (rangeTab === "start") {
                      setStartDate(`${startDate.slice(0, 8)}${d}`);
                    } else {
                      setEndDate(`${endDate.slice(0, 8)}${d}`);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.pillChipText,
                      {
                        color: active
                          ? isDarkMode
                            ? THEME.bg
                            : "#FFF"
                          : THEME.textSecondary,
                      },
                      active && styles.pillChipTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </>
  );

  const renderTransactionRow = (tx: any) => {
    const isExpanded = expandedTxId === tx.id;
    const srcAcc = accounts.find((a) => a.id === tx.account_id);
    const dstAcc = accounts.find((a) => a.id === tx.dest_account_id);

    const isIn = tx.type === "in";
    const isTransfer = tx.type === "transfer";
    const accent = isIn
      ? THEME.positive
      : isTransfer
        ? THEME.electricCyan
        : THEME.negative;

    return (
      <TouchableOpacity
        key={tx.id}
        activeOpacity={0.88}
        onPress={() => setExpandedTxId(isExpanded ? null : tx.id)}
        style={[
          styles.txCard,
          { backgroundColor: THEME.surface, borderColor: THEME.borderCard },
          isExpanded && {
            borderColor: `${auraColor}80`,
            backgroundColor: THEME.surfaceElevated,
          },
        ]}
      >
        <View style={styles.txRowTop}>
          <View
            style={[
              styles.txTypeIndicator,
              {
                backgroundColor: `${accent}18`,
                borderColor: `${accent}55`,
              },
            ]}
          >
            <Text style={[styles.txTypeGlyph, { color: accent }]}>
              {isIn ? "↙" : isTransfer ? "⇄" : "↗"}
            </Text>
          </View>

          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={[styles.txTitle, { color: THEME.textPrimary }]}
                numberOfLines={1}
              >
                {tx.description || tx.category}
              </Text>
            </View>
            <Text
              style={[styles.txSub, { color: THEME.textSecondary }]}
              numberOfLines={1}
            >
              {tx.category} • {srcAcc?.name || "Main Wallet"}
              {dstAcc ? ` → ${dstAcc.name}` : ""} • {tx.date}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.txAmount, { color: accent }]}>
              {isIn ? "+" : isTransfer ? "⇄ " : "-"}
              {isPrivacyMode
                ? "••••••"
                : tx.original_currency && tx.original_currency !== "PKR"
                  ? `${tx.original_amount.toLocaleString()} ${tx.original_currency}`
                  : `PKR ${Number(tx.amount).toLocaleString()}`}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  marginTop: 4,
                  backgroundColor: `${accent}15`,
                  borderColor: `${accent}45`,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: accent }]}>
                {isIn ? "INFLOW" : isTransfer ? "TRANSFER" : "OUTFLOW"}
              </Text>
            </View>
          </View>
        </View>

        {isExpanded && (
          <View
            style={[
              styles.txExpandedDetails,
              { borderTopColor: THEME.borderCard },
            ]}
          >
            <View style={styles.txDetailGrid}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.txDetailLabel, { color: THEME.textSecondary }]}
                >
                  ROUTING ACCOUNT
                </Text>
                <Text style={[styles.txDetailValue, { color: auraColor }]}>
                  {srcAcc?.name || "Main Wallet"}
                  {dstAcc ? ` ➔ ${dstAcc.name}` : ""}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.txDetailLabel, { color: THEME.textSecondary }]}
                >
                  EXCHANGE RATE
                </Text>
                <Text style={[styles.txDetailValue, { color: THEME.positive }]}>
                  1 {tx.original_currency || "PKR"} = {tx.exchange_rate || 1.0}{" "}
                  PKR
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.txDetailLabel,
                { color: THEME.textSecondary, marginTop: 8 },
              ]}
            >
              MEMO / DESCRIPTION
            </Text>
            <Text style={[styles.txDetailMemo, { color: THEME.textPrimary }]}>
              {tx.description || "No additional memo recorded."}
            </Text>

            <View style={styles.txActionRow}>
              <TouchableOpacity
                style={[
                  styles.txInlineBtn,
                  {
                    borderColor: `${THEME.electricCyan}50`,
                    backgroundColor: `${THEME.electricCyan}15`,
                  },
                ]}
                onPress={() => {
                  setEditingTx(tx);
                  setDescription(tx.description);
                  setCategory(tx.category);
                  setAmountInput(tx.amount.toString());
                  setTxType(tx.type);
                  setTxModal(true);
                }}
              >
                <Text
                  style={[
                    styles.txInlineBtnText,
                    { color: THEME.electricCyan },
                  ]}
                >
                  Edit Entry
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.txInlineBtn,
                  {
                    borderColor: `${THEME.negative}50`,
                    backgroundColor: `${THEME.negative}15`,
                    marginLeft: 10,
                  },
                ]}
                onPress={() => {
                  setConfirmModal({
                    visible: true,
                    title: "Delete Transaction?",
                    message:
                      "Remove this record and revert its balance impact?",
                    onConfirm: () => {
                      const removed = deleteTransaction(tx.id);
                      loadData();
                      triggerUndo("Transaction deleted", () =>
                        restoreTransaction(removed),
                      );
                    },
                  });
                }}
              >
                <Text
                  style={[styles.txInlineBtnText, { color: THEME.negative }]}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAccountCard = (acc: any) => {
    const anim = accountScaleAnims[acc.id] || new Animated.Value(1);
    const isSelected = selectedAccountFilter === acc.id;
    const isPlatform = acc.type === "platform";

    return (
      <Animated.View
        key={acc.id}
        style={{ transform: [{ scale: anim }], marginBottom: 10 }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={() => handleAccountPressIn(acc.id)}
          onPressOut={() => handleAccountPressOut(acc.id)}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch (e) {}
            setSelectedAccountFilter(isSelected ? null : acc.id);
          }}
          style={[
            styles.accountCard,
            { backgroundColor: THEME.surface, borderColor: THEME.borderCard },
            isSelected && {
              borderColor: auraColor,
              backgroundColor: THEME.surfaceElevated,
            },
          ]}
        >
          <View
            style={[
              styles.accountBadgeIcon,
              {
                backgroundColor: isPlatform
                  ? `${THEME.electricCyan}18`
                  : `${auraColor}18`,
                borderColor: isPlatform
                  ? `${THEME.electricCyan}50`
                  : `${auraColor}50`,
              },
            ]}
          >
            <Text
              style={{
                color: isPlatform ? THEME.electricCyan : auraColor,
                fontWeight: "800",
                fontSize: 13,
              }}
            >
              {acc.currency || "PKR"}
            </Text>
          </View>

          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={[styles.accName, { color: THEME.textPrimary }]}
                numberOfLines={1}
              >
                {acc.name}
              </Text>
              <View
                style={[
                  styles.accTypePill,
                  { backgroundColor: THEME.surfaceElevated },
                ]}
              >
                <Text
                  style={[
                    styles.accType,
                    { color: isDarkMode ? THEME.textSecondary : "#555" },
                  ]}
                >
                  {String(acc.type || "wallet").toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.accSub, { color: THEME.textSecondary }]}>
              {isSelected
                ? "Filtering activity • Tap to clear"
                : "Tap to filter ledger activity"}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.accBalance}>
              {isPrivacyMode
                ? "••••••"
                : `PKR ${Number(acc.balance).toLocaleString()}`}
            </Text>
            <TouchableOpacity
              style={{ marginTop: 4, paddingVertical: 2, paddingHorizontal: 4 }}
              onPress={() => {
                setConfirmModal({
                  visible: true,
                  title: "Delete Account?",
                  message: `Remove "${acc.name}" from your active accounts?`,
                  onConfirm: () => {
                    const removed = deleteAccount(acc.id);
                    loadData();
                    triggerUndo(`Deleted "${acc.name}"`, () =>
                      restoreAccount(removed),
                    );
                  },
                });
              }}
            >
              <Text style={[styles.deleteText, { color: THEME.negative }]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={THEME.bg}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* ================= TOP APP HEADER (Notch-Safe) ================= */}
        <View
          style={[
            styles.topBarWrapper,
            {
              backgroundColor: THEME.bg,
              borderBottomColor: THEME.borderCard,
              paddingTop:
                Platform.OS === "ios"
                  ? 12
                  : StatusBar.currentHeight
                    ? StatusBar.currentHeight + 6
                    : 14,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.hamburgerBtn,
              {
                borderColor: `${auraColor}45`,
                backgroundColor: THEME.surface,
              },
            ]}
            onPress={openMenu}
            activeOpacity={0.8}
            accessibilityLabel="Open Navigation Drawer"
          >
            <Ionicons name="menu" size={20} color={auraColor} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <BrandMark
              size={34}
              auraColor={auraColor}
              showWordmark={true}
              isDark={isDarkMode}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.headerActionPill,
              {
                borderColor: `${auraColor}55`,
                backgroundColor: `${auraColor}16`,
              },
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch (e) {}
              setThemeModal(true);
            }}
            activeOpacity={0.8}
          >
            <View
              style={[styles.auraSwatchDot, { backgroundColor: auraColor }]}
            />
            <Text style={[styles.headerActionText, { color: auraColor }]}>
              Aura
            </Text>
          </TouchableOpacity>
        </View>

        {/* Undo Toast Banner */}
        {undoAction && (
          <View
            style={[
              styles.undoContainer,
              {
                borderColor: auraColor,
                marginHorizontal: 18,
                backgroundColor: THEME.surfaceElevated,
              },
            ]}
          >
            <View style={styles.undoBanner}>
              <Text style={[styles.undoText, { color: THEME.textPrimary }]}>
                {undoAction.message}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  undoAction.undoFn();
                  loadData();
                  setUndoAction(null);
                }}
              >
                <Text style={[styles.undoBtnText, { color: auraColor }]}>
                  UNDO
                </Text>
              </TouchableOpacity>
            </View>
            <Animated.View
              style={[
                styles.undoProgressBar,
                {
                  backgroundColor: auraColor,
                  width: undoProgressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        )}

        {/* ================= MAIN SCROLLABLE VIEWPORT ================= */}
        <Animated.ScrollView
          style={{ flex: 1, opacity: screenFadeAnim }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ================= SCREEN 1: HOME COMMAND CENTER ================= */}
          {primaryNav === "home" && (
            <>
              {/* Hero Net Worth Card with Aura Lighting */}
              <Animated.View
                style={[
                  styles.netPositionCard,
                  {
                    backgroundColor: THEME.surface,
                    borderColor: `${auraColor}55`,
                    transform: [{ scale: pulseAnim }],
                    shadowColor:
                      auraIntensity === "off" ? "transparent" : auraColor,
                    shadowOpacity:
                      auraIntensity === "vivid"
                        ? 0.38
                        : auraIntensity === "subtle"
                          ? 0.08
                          : 0.2,
                  },
                ]}
              >
                <View style={styles.netWorthHeaderRow}>
                  <View>
                    <Text
                      style={[styles.cardLabel, { color: THEME.textSecondary }]}
                    >
                      TOTAL NET WORTH
                    </Text>
                    <View style={styles.liveBadge}>
                      <View
                        style={[
                          styles.greenDot,
                          { backgroundColor: THEME.positive },
                        ]}
                      />
                      <Text
                        style={[
                          styles.liveText,
                          { color: THEME.textSecondary },
                        ]}
                      >
                        Offline SQLite Vault • {accounts.length} Accounts
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.eyeButton,
                      {
                        borderColor: `${auraColor}45`,
                        backgroundColor: THEME.surfaceElevated,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setIsPrivacyMode(!isPrivacyMode);
                    }}
                    activeOpacity={0.8}
                    accessibilityLabel="Toggle Privacy Mode"
                  >
                    <Feather
                      name={isPrivacyMode ? "eye-off" : "eye"}
                      size={16}
                      color={auraColor}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[styles.netAmount, { color: THEME.textPrimary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {isPrivacyMode
                    ? "••••••••••"
                    : `PKR ${totalNetWorth.toLocaleString()}`}
                </Text>

                {/* Monthly Cashflow Bar */}
                <View
                  style={[
                    styles.heroMetricsRow,
                    { borderTopColor: THEME.borderCard },
                  ]}
                >
                  <View style={styles.heroMetricItem}>
                    <Text
                      style={[
                        styles.heroMetricLabel,
                        { color: THEME.textSecondary },
                      ]}
                    >
                      THIS MONTH IN
                    </Text>
                    <Text
                      style={[
                        styles.heroMetricValue,
                        { color: THEME.positive },
                      ]}
                      numberOfLines={1}
                    >
                      {isPrivacyMode
                        ? "••••"
                        : `+PKR ${monthlyMetrics.income.toLocaleString()}`}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.heroMetricDivider,
                      { backgroundColor: THEME.borderCard },
                    ]}
                  />
                  <View style={styles.heroMetricItem}>
                    <Text
                      style={[
                        styles.heroMetricLabel,
                        { color: THEME.textSecondary },
                      ]}
                    >
                      THIS MONTH OUT
                    </Text>
                    <Text
                      style={[
                        styles.heroMetricValue,
                        { color: THEME.negative },
                      ]}
                      numberOfLines={1}
                    >
                      {isPrivacyMode
                        ? "••••"
                        : `-PKR ${monthlyMetrics.expense.toLocaleString()}`}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Quick Actions Command Bar */}
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={[
                    styles.quickActionTile,
                    {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setEditingTx(null);
                    setTxType("out");
                    setTxModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name="plus-circle" size={18} color="#09090F" />
                  <Text style={styles.quickActionLabelPrimary}>
                    Record Entry
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickActionTile,
                    {
                      backgroundColor: THEME.surface,
                      borderColor: THEME.borderCard,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setEditingTx(null);
                    setTxType("transfer");
                    setCategory("Account Transfer");
                    setTxModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={18}
                    color={THEME.electricCyan}
                  />
                  <Text
                    style={[
                      styles.quickActionLabel,
                      { color: THEME.textPrimary },
                    ]}
                  >
                    Transfer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickActionTile,
                    {
                      backgroundColor: THEME.surface,
                      borderColor: THEME.borderCard,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setAccountModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={18}
                    color={THEME.positive}
                  />
                  <Text
                    style={[
                      styles.quickActionLabel,
                      { color: THEME.textPrimary },
                    ]}
                  >
                    New Wallet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickActionTile,
                    {
                      backgroundColor: THEME.surface,
                      borderColor: THEME.borderCard,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setInvoiceModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name="file-text" size={18} color={auraColor} />
                  <Text
                    style={[
                      styles.quickActionLabel,
                      { color: THEME.textPrimary },
                    ]}
                  >
                    Invoice PDF
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Accounts Summary Section */}
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[styles.sectionTitle, { color: THEME.textPrimary }]}
                >
                  Accounts & Wallets
                </Text>
                <TouchableOpacity
                  onPress={() => handlePrimaryNavChange("accounts")}
                >
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    Manage All ({accounts.length}) →
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedAccountFilter && (
                <TouchableOpacity
                  style={[
                    styles.filterBanner,
                    {
                      borderColor: auraColor,
                      backgroundColor: `${auraColor}15`,
                    },
                  ]}
                  onPress={() => setSelectedAccountFilter(null)}
                >
                  <Text style={[styles.filterText, { color: auraColor }]}>
                    Filtering by selected wallet • Tap to show all accounts
                  </Text>
                </TouchableOpacity>
              )}

              {accounts.length === 0 ? (
                <EmptyState
                  title="No Wallets Configured"
                  subtitle="Add your bank account, mobile wallet, or USD platform balance to start tracking."
                  actionLabel="+ Add First Account"
                  onAction={() => setAccountModal(true)}
                  auraColor={auraColor}
                  isDark={isDarkMode}
                />
              ) : (
                accounts.slice(0, 3).map((acc) => renderAccountCard(acc))
              )}

              {/* Financial Guardrails Strip */}
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[styles.sectionTitle, { color: THEME.textPrimary }]}
                >
                  Financial Guardrails
                </Text>
                <TouchableOpacity
                  onPress={() => handlePrimaryNavChange("more")}
                >
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    All Modules →
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 14 }}
              >
                <TouchableOpacity
                  style={[
                    styles.moduleSummaryCard,
                    {
                      backgroundColor: THEME.surface,
                      borderColor: `${auraColor}40`,
                    },
                  ]}
                  onPress={() => openMoreFeature("bills")}
                >
                  <Text
                    style={[
                      styles.moduleSummaryTitle,
                      { color: THEME.textSecondary },
                    ]}
                  >
                    Recurring Bills
                  </Text>
                  <Text
                    style={[styles.moduleSummaryCount, { color: auraColor }]}
                  >
                    {recurringBills.length} Active
                  </Text>
                  <Text
                    style={[
                      styles.moduleSummaryHint,
                      { color: THEME.textMuted },
                    ]}
                  >
                    One-tap monthly payments
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.moduleSummaryCard,
                    {
                      backgroundColor: THEME.surface,
                      borderColor: `${THEME.warning}40`,
                    },
                  ]}
                  onPress={() => openMoreFeature("budgets")}
                >
                  <Text
                    style={[
                      styles.moduleSummaryTitle,
                      { color: THEME.textSecondary },
                    ]}
                  >
                    Monthly Budgets
                  </Text>
                  <Text
                    style={[
                      styles.moduleSummaryCount,
                      { color: THEME.warning },
                    ]}
                  >
                    {budgets.length} Guardrails
                  </Text>
                  <Text
                    style={[
                      styles.moduleSummaryHint,
                      { color: THEME.textMuted },
                    ]}
                  >
                    Category spending caps
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.moduleSummaryCard,
                    {
                      backgroundColor: THEME.surface,
                      borderColor: `${THEME.positive}40`,
                    },
                  ]}
                  onPress={() => openMoreFeature("goals")}
                >
                  <Text
                    style={[
                      styles.moduleSummaryTitle,
                      { color: THEME.textSecondary },
                    ]}
                  >
                    Savings Goals
                  </Text>
                  <Text
                    style={[
                      styles.moduleSummaryCount,
                      { color: THEME.positive },
                    ]}
                  >
                    {savingsGoals.length} Targets
                  </Text>
                  <Text
                    style={[
                      styles.moduleSummaryHint,
                      { color: THEME.textMuted },
                    ]}
                  >
                    Daily run-rate tracker
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.moduleSummaryCard,
                    {
                      backgroundColor: THEME.surface,
                      borderColor: `${THEME.electricCyan}40`,
                    },
                  ]}
                  onPress={() => openMoreFeature("debts")}
                >
                  <Text
                    style={[
                      styles.moduleSummaryTitle,
                      { color: THEME.textSecondary },
                    ]}
                  >
                    Loans & Debts
                  </Text>
                  <Text
                    style={[
                      styles.moduleSummaryCount,
                      { color: THEME.electricCyan },
                    ]}
                  >
                    {debts.filter((d) => d.status !== "settled").length} Pending
                  </Text>
                  <Text
                    style={[
                      styles.moduleSummaryHint,
                      { color: THEME.textMuted },
                    ]}
                  >
                    Receivables & payables
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Recent Ledger Activity Feed */}
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[styles.sectionTitle, { color: THEME.textPrimary }]}
                >
                  Recent Ledger Activity
                </Text>
                <TouchableOpacity
                  onPress={() => handlePrimaryNavChange("activity")}
                >
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    Full Ledger ({transactions.length}) →
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredTransactions.length === 0 ? (
                <EmptyState
                  title="No Ledger Transactions Yet"
                  subtitle="Record your first income, expense, or wallet transfer to populate your live timeline."
                  actionLabel="+ Record Transaction"
                  onAction={() => {
                    setEditingTx(null);
                    setTxModal(true);
                  }}
                  auraColor={auraColor}
                  isDark={isDarkMode}
                />
              ) : (
                filteredTransactions
                  .slice(0, 6)
                  .map((tx: any) => renderTransactionRow(tx))
              )}
            </>
          )}

          {/* ================= SCREEN 2: ACTIVITY LEDGER ================= */}
          {primaryNav === "activity" && (
            <>
              <View style={styles.screenHeaderBlock}>
                <Text
                  style={[styles.screenMainTitle, { color: THEME.textPrimary }]}
                >
                  Ledger Activity
                </Text>
                <Text
                  style={[
                    styles.screenSubTitle,
                    { color: THEME.textSecondary },
                  ]}
                >
                  Search, filter, and inspect every transaction with full
                  auditability.
                </Text>
              </View>

              <TextInput
                style={[
                  styles.searchBarInput,
                  {
                    backgroundColor: THEME.surface,
                    color: THEME.textPrimary,
                    borderColor: THEME.borderCard,
                  },
                ]}
                placeholder="Search description or category..."
                placeholderTextColor={THEME.textSecondary}
                value={ledgerSearchQuery}
                onChangeText={setLedgerSearchQuery}
              />

              {/* Type Filter Pills */}
              <View style={styles.ledgerTypeRow}>
                {[
                  { key: "all", label: "All" },
                  { key: "in", label: "Inflow" },
                  { key: "out", label: "Outflow" },
                  { key: "transfer", label: "Transfers" },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.ledgerTypePill,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: THEME.borderCard,
                      },
                      ledgerTypeFilter === t.key && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setLedgerTypeFilter(t.key as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.ledgerTypeText,
                        { color: THEME.textSecondary },
                        ledgerTypeFilter === t.key && {
                          color: isDarkMode ? THEME.bg : "#FFF",
                          fontWeight: "800",
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {renderTimeFilterPills()}

              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[styles.sectionTitle, { color: THEME.textPrimary }]}
                >
                  Matching Records ({filteredTransactions.length})
                </Text>
                <TouchableOpacity onPress={() => setExportModal(true)}>
                  <Text
                    style={[styles.actionLink, { color: THEME.electricCyan }]}
                  >
                    Export CSV 📥
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredTransactions.length === 0 ? (
                <EmptyState
                  title="No Matching Transactions"
                  subtitle="Try clearing your search query or adjusting the active date filter."
                  actionLabel="Reset Filters"
                  onAction={() => {
                    setLedgerSearchQuery("");
                    setLedgerTypeFilter("all");
                    setTimeFilter("all");
                    setSelectedAccountFilter(null);
                  }}
                  auraColor={auraColor}
                  isDark={isDarkMode}
                />
              ) : (
                filteredTransactions.map((tx: any) => renderTransactionRow(tx))
              )}
            </>
          )}

          {/* ================= SCREEN 3: INSIGHTS & ANALYTICS ================= */}
          {primaryNav === "insights" && (
            <Animated.View
              style={{
                opacity: insightsWelcomeAnim,
                transform: [
                  {
                    translateY: insightsWelcomeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.screenHeaderBlock}>
                <Text
                  style={[styles.screenMainTitle, { color: THEME.textPrimary }]}
                >
                  Financial Intelligence
                </Text>
                <Text
                  style={[
                    styles.screenSubTitle,
                    { color: THEME.textSecondary },
                  ]}
                >
                  Real-time cashflow ratios and category spending distribution
                  (transfers excluded).
                </Text>
              </View>

              {renderTimeFilterPills()}

              {/* Cashflow Comparison Card */}
              <View
                style={[
                  styles.modernRangeBox,
                  {
                    backgroundColor: THEME.surface,
                    borderColor: `${auraColor}45`,
                  },
                ]}
              >
                <Text
                  style={[styles.cardLabel, { color: THEME.textSecondary }]}
                >
                  PERIOD CASHFLOW VS BURN
                </Text>
                <View style={styles.insightComparisonRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.txDetailLabel,
                        { color: THEME.textSecondary },
                      ]}
                    >
                      TOTAL INFLOW
                    </Text>
                    <Text
                      style={[
                        styles.insightBigNumber,
                        { color: THEME.positive },
                      ]}
                    >
                      {isPrivacyMode
                        ? "••••••"
                        : `PKR ${periodAnalytics.inflow.toLocaleString()}`}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.txDetailLabel,
                        { color: THEME.textSecondary },
                      ]}
                    >
                      TOTAL OUTFLOW
                    </Text>
                    <Text
                      style={[
                        styles.insightBigNumber,
                        { color: THEME.negative },
                      ]}
                    >
                      {isPrivacyMode
                        ? "••••••"
                        : `PKR ${periodAnalytics.outflow.toLocaleString()}`}
                    </Text>
                  </View>
                </View>

                {/* Animated Dual Ratio Bar */}
                {periodAnalytics.inflow + periodAnalytics.outflow > 0 ? (
                  <View
                    style={[
                      styles.dualBarTrack,
                      { backgroundColor: THEME.surfaceElevated },
                    ]}
                  >
                    <Animated.View
                      style={{
                        flex: barAnimProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            0.01,
                            periodAnalytics.inflow /
                              (periodAnalytics.inflow +
                                periodAnalytics.outflow),
                          ],
                        }),
                        backgroundColor: THEME.positive,
                        height: "100%",
                      }}
                    />
                    <Animated.View
                      style={{
                        flex: barAnimProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            0.01,
                            periodAnalytics.outflow /
                              (periodAnalytics.inflow +
                                periodAnalytics.outflow),
                          ],
                        }),
                        backgroundColor: THEME.negative,
                        height: "100%",
                      }}
                    />
                  </View>
                ) : (
                  <Text
                    style={{
                      color: THEME.textSecondary,
                      fontSize: 11,
                      marginTop: 8,
                    }}
                  >
                    Record income or expenses in this period to visualize ratio.
                  </Text>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 10,
                  }}
                >
                  <Text style={{ color: THEME.textSecondary, fontSize: 11 }}>
                    Net Period Delta:
                  </Text>
                  <Text
                    style={{
                      color:
                        periodAnalytics.inflow - periodAnalytics.outflow >= 0
                          ? THEME.positive
                          : THEME.negative,
                      fontWeight: "800",
                      fontSize: 12,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {periodAnalytics.inflow - periodAnalytics.outflow >= 0
                      ? "+"
                      : ""}
                    PKR{" "}
                    {(
                      periodAnalytics.inflow - periodAnalytics.outflow
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Category Breakdown with Animated Fill Bars */}
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[styles.sectionTitle, { color: THEME.textPrimary }]}
                >
                  Expense Category Breakdown
                </Text>
                <TouchableOpacity onPress={() => setCategoryModal(true)}>
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    + Custom Categories
                  </Text>
                </TouchableOpacity>
              </View>

              {periodAnalytics.sortedCategories.length === 0 ? (
                <EmptyState
                  title="No Expense Data for Period"
                  subtitle="Outflow transactions recorded during the selected timeframe will automatically rank here."
                  auraColor={auraColor}
                  isDark={isDarkMode}
                />
              ) : (
                periodAnalytics.sortedCategories.map(([catName, amt], idx) => {
                  const pct =
                    periodAnalytics.outflow > 0
                      ? Math.round((amt / periodAnalytics.outflow) * 100)
                      : 0;
                  return (
                    <TouchableOpacity
                      key={catName}
                      style={[
                        styles.categoryRankCard,
                        {
                          backgroundColor: THEME.surface,
                          borderColor: THEME.borderCard,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setLedgerSearchQuery(catName);
                        handlePrimaryNavChange("activity");
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryRankTitle,
                            { color: THEME.textPrimary },
                          ]}
                        >
                          {idx + 1}. {catName}
                        </Text>
                        <Text
                          style={[
                            styles.categoryRankAmount,
                            { color: auraColor },
                          ]}
                        >
                          {isPrivacyMode
                            ? "••••"
                            : `PKR ${amt.toLocaleString()} (${pct}%)`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressTrack,
                          { backgroundColor: THEME.surfaceElevated },
                        ]}
                      >
                        <Animated.View
                          style={{
                            width: barAnimProgress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", `${Math.min(pct, 100)}%`],
                            }),
                            height: "100%",
                            backgroundColor:
                              idx === 0 ? auraColor : THEME.electricCyan,
                            borderRadius: 5,
                          }}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </Animated.View>
          )}

          {/* ================= SCREEN 4: ACCOUNTS & WALLETS ================= */}
          {primaryNav === "accounts" && (
            <>
              <View style={styles.screenHeaderBlock}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.screenMainTitle,
                        { color: THEME.textPrimary },
                      ]}
                    >
                      Wallets & Liquidity
                    </Text>
                    <Text
                      style={[
                        styles.screenSubTitle,
                        { color: THEME.textSecondary },
                      ]}
                    >
                      Manage bank accounts, local wallets, and foreign currency
                      platforms.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.payBillBtn,
                      {
                        backgroundColor: auraColor,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                      },
                    ]}
                    onPress={() => setAccountModal(true)}
                  >
                    <Text
                      style={{
                        color: isDarkMode ? THEME.bg : "#FFF",
                        fontWeight: "800",
                        fontSize: 12,
                      }}
                    >
                      + New Wallet
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {accounts.length === 0 ? (
                <EmptyState
                  title="No Active Accounts"
                  subtitle="Create your first wallet to track your liquid net worth."
                  actionLabel="+ Add Account"
                  onAction={() => setAccountModal(true)}
                  auraColor={auraColor}
                  isDark={isDarkMode}
                />
              ) : (
                accounts.map((acc) => renderAccountCard(acc))
              )}

              {/* Clients & Counterparties Directory */}
              <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
                <Text
                  style={[styles.sectionTitle, { color: THEME.textPrimary }]}
                >
                  Clients & Counterparties ({clients.length})
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingClient(null);
                    setClientModal(true);
                  }}
                >
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    + Add Client
                  </Text>
                </TouchableOpacity>
              </View>

              {clients.length === 0 ? (
                <EmptyState
                  title="No Counterparties Saved"
                  subtitle="Add freelance clients or companies to link inflows and generate PDF invoices."
                  actionLabel="+ Add Client"
                  onAction={() => setClientModal(true)}
                  auraColor={auraColor}
                  isDark={isDarkMode}
                />
              ) : (
                clients.map((c) => (
                  <View
                    key={c.id}
                    style={[
                      styles.clientCard,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: THEME.borderCard,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.clientAvatar,
                        {
                          backgroundColor: `${auraColor}20`,
                          borderColor: `${auraColor}50`,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: auraColor,
                          fontWeight: "800",
                          fontSize: 14,
                        }}
                      >
                        {(c.name || "C").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.clientName,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        {c.name}{" "}
                        <Text
                          style={[styles.clientCompany, { color: auraColor }]}
                        >
                          ({c.category})
                        </Text>
                      </Text>
                      <Text
                        style={[
                          styles.clientMeta,
                          { color: THEME.textSecondary },
                        ]}
                      >
                        {c.company} • {c.country}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingClient(c);
                        setClientName(c.name);
                        setClientCompany(c.company);
                        setClientCountry(c.country);
                        setClientModal(true);
                      }}
                      style={{ marginRight: 12 }}
                    >
                      <Text
                        style={[styles.editText, { color: THEME.electricCyan }]}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setConfirmModal({
                          visible: true,
                          title: "Delete Client?",
                          message: `Remove client "${c.name}"?`,
                          onConfirm: () => {
                            const removed = deleteClient(c.id);
                            loadData();
                            triggerUndo("Deleted client", () =>
                              restoreClient(removed),
                            );
                          },
                        });
                      }}
                    >
                      <Text
                        style={[styles.deleteText, { color: THEME.negative }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}

          {/* ================= SCREEN 5: MORE COMMAND HUB & SUB-SCREENS ================= */}
          {primaryNav === "more" && (
            <>
              {/* Sub-navigation Pill Bar inside More (Fixed missing text visibility) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 14 }}
              >
                {[
                  { key: "hub", label: "⚡ Command Hub" },
                  { key: "bills", label: "📅 Bills" },
                  { key: "budgets", label: "🛡️ Budgets" },
                  { key: "goals", label: "🎯 Goals" },
                  { key: "debts", label: "🤝 Debts" },
                  { key: "clients", label: "👥 Clients" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.pillChip,
                      {
                        backgroundColor: THEME.surfaceElevated,
                        borderColor: THEME.borderCard,
                      },
                      moreSubTab === item.key && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setMoreSubTab(item.key as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        {
                          color:
                            moreSubTab === item.key
                              ? isDarkMode
                                ? THEME.bg
                                : "#FFF"
                              : THEME.textSecondary,
                        },
                        moreSubTab === item.key && styles.pillChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* HUB OVERVIEW */}
              {moreSubTab === "hub" && (
                <View>
                  <View style={styles.screenHeaderBlock}>
                    <Text
                      style={[
                        styles.screenMainTitle,
                        { color: THEME.textPrimary },
                      ]}
                    >
                      VYBE Command Suite
                    </Text>
                    <Text
                      style={[
                        styles.screenSubTitle,
                        { color: THEME.textSecondary },
                      ]}
                    >
                      Access specialized planning modules, PDF invoicing, and
                      encrypted vault backups.
                    </Text>
                  </View>

                  <View style={styles.hubGrid}>
                    <TouchableOpacity
                      style={[
                        styles.hubTile,
                        {
                          backgroundColor: THEME.surface,
                          borderColor: `${auraColor}45`,
                        },
                      ]}
                      onPress={() => setMoreSubTab("bills")}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={22}
                        color={auraColor}
                        style={{ marginBottom: 8 }}
                      />
                      <Text
                        style={[
                          styles.hubTileTitle,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Recurring Bills
                      </Text>
                      <Text
                        style={[
                          styles.hubTileSub,
                          { color: THEME.textSecondary },
                        ]}
                      >
                        {recurringBills.length} active subscriptions
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.hubTile,
                        {
                          backgroundColor: THEME.surface,
                          borderColor: `${THEME.warning}45`,
                        },
                      ]}
                      onPress={() => setMoreSubTab("budgets")}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={22}
                        color={THEME.warning}
                        style={{ marginBottom: 8 }}
                      />
                      <Text
                        style={[
                          styles.hubTileTitle,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Monthly Budgets
                      </Text>
                      <Text
                        style={[
                          styles.hubTileSub,
                          { color: THEME.textSecondary },
                        ]}
                      >
                        {budgets.length} spending caps
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.hubTile,
                        {
                          backgroundColor: THEME.surface,
                          borderColor: `${THEME.positive}45`,
                        },
                      ]}
                      onPress={() => setMoreSubTab("goals")}
                    >
                      <Ionicons
                        name="flag-outline"
                        size={22}
                        color={THEME.positive}
                        style={{ marginBottom: 8 }}
                      />
                      <Text
                        style={[
                          styles.hubTileTitle,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Savings Goals
                      </Text>
                      <Text
                        style={[
                          styles.hubTileSub,
                          { color: THEME.textSecondary },
                        ]}
                      >
                        {savingsGoals.length} active targets
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.hubTile,
                        {
                          backgroundColor: THEME.surface,
                          borderColor: `${THEME.electricCyan}45`,
                        },
                      ]}
                      onPress={() => setMoreSubTab("debts")}
                    >
                      <Ionicons
                        name="people-outline"
                        size={22}
                        color={THEME.electricCyan}
                        style={{ marginBottom: 8 }}
                      />
                      <Text
                        style={[
                          styles.hubTileTitle,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Debts & Loans
                      </Text>
                      <Text
                        style={[
                          styles.hubTileSub,
                          { color: THEME.textSecondary },
                        ]}
                      >
                        {debts.length} tracked records
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: THEME.textPrimary,
                        marginTop: 14,
                        marginBottom: 10,
                      },
                    ]}
                  >
                    Invoicing, Security & Data Operations
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.drawerNavItem,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: THEME.borderCard,
                      },
                    ]}
                    onPress={() => setInvoiceModal(true)}
                  >
                    <Feather
                      name="file-text"
                      size={18}
                      color={auraColor}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.drawerNavText,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Generate Professional PDF Invoice
                      </Text>
                      <Text
                        style={[styles.accSub, { color: THEME.textSecondary }]}
                      >
                        Create itemized or lump-sum client statements
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.drawerNavItem,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: THEME.borderCard,
                      },
                    ]}
                    onPress={() => setInvoiceHistoryModal(true)}
                  >
                    <Ionicons
                      name="folder-open-outline"
                      size={18}
                      color={THEME.electricCyan}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.drawerNavText,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Invoice Vault (30-Day History)
                      </Text>
                      <Text
                        style={[styles.accSub, { color: THEME.textSecondary }]}
                      >
                        {invoiceHistoryList.length} archived PDF invoices ready
                        to share
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.drawerNavItem,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: THEME.borderCard,
                      },
                    ]}
                    onPress={() => setCategoryModal(true)}
                  >
                    <Ionicons
                      name="pricetags-outline"
                      size={18}
                      color={THEME.warning}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.drawerNavText,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Category Manager
                      </Text>
                      <Text
                        style={[styles.accSub, { color: THEME.textSecondary }]}
                      >
                        Configure custom inflow & outflow categories
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.drawerNavItem,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: THEME.borderCard,
                      },
                    ]}
                    onPress={() => setExportModal(true)}
                  >
                    <Feather
                      name="download"
                      size={18}
                      color={THEME.positive}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.drawerNavText,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Export Excel / CSV Statement
                      </Text>
                      <Text
                        style={[styles.accSub, { color: THEME.textSecondary }]}
                      >
                        Download date-filtered spreadsheet reports
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.drawerNavItem,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: THEME.borderCard,
                      },
                    ]}
                    onPress={downloadBackup}
                  >
                    <Feather
                      name="hard-drive"
                      size={18}
                      color={auraColor}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.drawerNavText,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Export Full JSON Backup
                      </Text>
                      <Text
                        style={[styles.accSub, { color: THEME.textSecondary }]}
                      >
                        Save a complete snapshot of your offline database
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.drawerNavItem,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: THEME.borderCard,
                      },
                    ]}
                    onPress={handleUploadBackup}
                  >
                    <Feather
                      name="upload"
                      size={18}
                      color={THEME.electricCyan}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.drawerNavText,
                          { color: THEME.textPrimary },
                        ]}
                      >
                        Restore JSON Backup
                      </Text>
                      <Text
                        style={[styles.accSub, { color: THEME.textSecondary }]}
                      >
                        Import a previously exported VYBE backup file
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* SUB-SCREEN: RECURRING BILLS (With Advanced Date Range Selector) */}
              {moreSubTab === "bills" && (
                <View>
                  <Text
                    style={[styles.sectionTitle, { color: THEME.textPrimary }]}
                  >
                    Automated Subscriptions & Bills
                  </Text>
                  <Text
                    style={{
                      color: THEME.textSecondary,
                      fontSize: 12,
                      marginBottom: 16,
                    }}
                  >
                    Manage monthly overheads and trigger instant one-tap
                    payments.
                  </Text>

                  <View
                    style={[
                      styles.modernRangeBox,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: `${auraColor}40`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: THEME.textPrimary, marginBottom: 10 },
                      ]}
                    >
                      + Register New Bill
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: THEME.surfaceElevated,
                          color: THEME.textPrimary,
                        },
                      ]}
                      placeholder="Bill Name (e.g. Netflix, Internet, Rent)"
                      placeholderTextColor={THEME.textSecondary}
                      value={billName}
                      onChangeText={setBillName}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: THEME.surfaceElevated,
                          color: THEME.textPrimary,
                        },
                      ]}
                      placeholder="Monthly Amount (PKR)"
                      placeholderTextColor={THEME.textSecondary}
                      keyboardType="numeric"
                      value={billAmount}
                      onChangeText={(t) =>
                        setBillAmount(t.replace(/[^0-9.]/g, ""))
                      }
                    />

                    <Text style={[styles.labelSub, { color: "#FFFFFF" }]}>
                      Due Day of Month (1-31):
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: THEME.surfaceElevated,
                          color: THEME.textPrimary,
                        },
                      ]}
                      placeholder="e.g. 15"
                      placeholderTextColor={THEME.textSecondary}
                      keyboardType="numeric"
                      value={billDueDay}
                      onChangeText={(t) =>
                        setBillDueDay(t.replace(/[^0-9]/g, ""))
                      }
                    />

                    <Text style={[styles.labelSub, { color: "#FFFFFF" }]}>
                      Pay From Account:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 16 }}
                    >
                      {accounts.map((acc) => (
                        <TouchableOpacity
                          key={acc.id}
                          style={[
                            styles.pillChip,
                            {
                              backgroundColor: THEME.surfaceElevated,
                              borderColor: THEME.borderCard,
                            },
                            billAccountId === acc.id && {
                              backgroundColor: auraColor,
                              borderColor: auraColor,
                            },
                          ]}
                          onPress={() => setBillAccountId(acc.id)}
                        >
                          <Text
                            style={[
                              styles.pillChipText,
                              {
                                color:
                                  billAccountId === acc.id
                                    ? isDarkMode
                                      ? THEME.bg
                                      : "#FFF"
                                    : THEME.textSecondary,
                              },
                              billAccountId === acc.id &&
                                styles.pillChipTextActive,
                            ]}
                          >
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        { backgroundColor: auraColor, shadowColor: auraColor },
                      ]}
                      onPress={handleSaveBill}
                    >
                      <Text style={styles.addButtonText}>
                        Save Recurring Bill
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: THEME.textPrimary,
                        marginTop: 10,
                        marginBottom: 10,
                      },
                    ]}
                  >
                    Active Subscriptions ({recurringBills.length})
                  </Text>
                  {recurringBills.length === 0 ? (
                    <EmptyState
                      title="No Recurring Bills"
                      subtitle="Add your monthly subscriptions above for quick one-tap settlement."
                      auraColor={auraColor}
                      isDark={isDarkMode}
                    />
                  ) : (
                    recurringBills.map((b: any) => {
                      const currentDayNum = new Date().getDate();
                      const isDueSoon =
                        Math.abs(b.due_day - currentDayNum) <= 3;
                      const acc = accounts.find((a) => a.id === b.account_id);
                      return (
                        <View
                          key={b.id}
                          style={[
                            styles.clientCard,
                            {
                              backgroundColor: THEME.surface,
                              borderColor: THEME.borderCard,
                            },
                            isDueSoon && {
                              borderColor: THEME.negative,
                              backgroundColor: "rgba(255, 94, 126, 0.08)",
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 2,
                              }}
                            >
                              <Text
                                style={[
                                  styles.clientName,
                                  { color: THEME.textPrimary },
                                ]}
                              >
                                {b.name}
                              </Text>
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    marginLeft: 8,
                                    backgroundColor: isDueSoon
                                      ? "rgba(255,94,126,0.15)"
                                      : `${auraColor}20`,
                                    borderColor: isDueSoon
                                      ? THEME.negative
                                      : auraColor,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusText,
                                    {
                                      color: isDueSoon
                                        ? THEME.negative
                                        : auraColor,
                                    },
                                  ]}
                                >
                                  Due Day {b.due_day}
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={{
                                color: THEME.negative,
                                fontSize: 13,
                                fontWeight: "bold",
                              }}
                            >
                              PKR {b.amount.toLocaleString()} •{" "}
                              {acc?.name || "Account"}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.payBillBtn,
                              {
                                backgroundColor: auraColor,
                                marginRight: 10,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                              },
                            ]}
                            onPress={() => payRecurringBillNow(b)}
                          >
                            <Text
                              style={{
                                color: isDarkMode ? THEME.bg : "#FFF",
                                fontSize: 11,
                                fontWeight: "800",
                              }}
                            >
                              Pay Now
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              deleteRecurringBill(b.id);
                              loadData();
                            }}
                          >
                            <Text
                              style={[
                                styles.deleteText,
                                { color: THEME.negative },
                              ]}
                            >
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* SUB-SCREEN: BUDGETS */}
              {moreSubTab === "budgets" && (
                <View>
                  <Text
                    style={[styles.sectionTitle, { color: THEME.textPrimary }]}
                  >
                    Monthly Budget Guardrails
                  </Text>
                  <Text
                    style={{
                      color: THEME.textSecondary,
                      fontSize: 12,
                      marginBottom: 16,
                    }}
                  >
                    Set monthly spending limits per category. Dynamic bars warn
                    you as you approach thresholds.
                  </Text>

                  <View
                    style={[
                      styles.modernRangeBox,
                      {
                        backgroundColor: THEME.surface,
                        borderColor: `${auraColor}40`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: THEME.textPrimary, marginBottom: 10 },
                      ]}
                    >
                      Set Category Monthly Limit
                    </Text>

                    <Text style={[styles.labelSub, { color: "#FFFFFF" }]}>
                      Select Category:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 12 }}
                    >
                      {allExpenseCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.pillChip,
                            {
                              backgroundColor: THEME.surfaceElevated,
                              borderColor: THEME.borderCard,
                            },
                            budgetCategory === cat && {
                              backgroundColor: auraColor,
                              borderColor: auraColor,
                            },
                          ]}
                          onPress={() => setBudgetCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.pillChipText,
                              {
                                color:
                                  budgetCategory === cat
                                    ? isDarkMode
                                      ? THEME.bg
                                      : "#FFF"
                                    : THEME.textSecondary,
                              },
                              budgetCategory === cat &&
                                styles.pillChipTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: THEME.surfaceElevated,
                          color: THEME.textPrimary,
                        },
                      ]}
                      placeholder="Monthly Limit (PKR)"
                      placeholderTextColor={THEME.textSecondary}
                      keyboardType="numeric"
                      value={budgetLimitInput}
                      onChangeText={(t) =>
                        setBudgetLimitInput(t.replace(/[^0-9.]/g, ""))
                      }
                    />

                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        { backgroundColor: auraColor, shadowColor: auraColor },
                      ]}
                      onPress={handleSaveBudget}
                    >
                      <Text style={styles.addButtonText}>
                        Save Budget Limit
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: THEME.textPrimary,
                        marginTop: 10,
                        marginBottom: 10,
                      },
                    ]}
                  >
                    Active Budgets & Progress
                  </Text>
                  {budgets.length === 0 ? (
                    <EmptyState
                      title="No Budget Limits Configured"
                      subtitle="Select a spending category above and set a monthly PKR cap."
                      auraColor={auraColor}
                      isDark={isDarkMode}
                    />
                  ) : (
                    budgets.map((b: any) => {
                      const spent = monthlyMetrics.catMap[b.category] || 0;
                      const ratio = Math.min(
                        Math.round((spent / b.monthly_limit) * 100),
                        100,
                      );
                      const isWarning = ratio >= 80;
                      const isExceeded = ratio >= 100;

                      return (
                        <View
                          key={b.id}
                          style={[
                            styles.modernRangeBox,
                            {
                              backgroundColor: THEME.surface,
                              borderColor: THEME.borderCard,
                            },
                            isExceeded && {
                              borderColor: THEME.negative,
                              backgroundColor: "rgba(255,94,126,0.06)",
                            },
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: THEME.textPrimary,
                                fontSize: 13,
                                fontWeight: "700",
                              }}
                            >
                              {b.category}
                            </Text>
                            <Text
                              style={{
                                color: isExceeded
                                  ? THEME.negative
                                  : isWarning
                                    ? THEME.warning
                                    : THEME.positive,
                                fontSize: 13,
                                fontWeight: "bold",
                              }}
                            >
                              PKR {spent.toLocaleString()} /{" "}
                              {b.monthly_limit.toLocaleString()} ({ratio}%)
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.progressTrack,
                              { backgroundColor: THEME.surfaceElevated },
                            ]}
                          >
                            <View
                              style={{
                                width: `${ratio}%`,
                                height: "100%",
                                backgroundColor: isExceeded
                                  ? THEME.negative
                                  : isWarning
                                    ? THEME.warning
                                    : auraColor,
                                borderRadius: 5,
                              }}
                            />
                          </View>
                          <TouchableOpacity
                            style={{ marginTop: 10, alignSelf: "flex-end" }}
                            onPress={() => {
                              deleteBudget(b.category);
                              loadData();
                            }}
                          >
                            <Text
                              style={[
                                styles.deleteText,
                                { color: THEME.negative },
                              ]}
                            >
                              Remove Budget
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* SUB-SCREEN: SAVINGS GOALS */}
              {moreSubTab === "goals" && (
                <View>
                  <View style={styles.sectionHeaderRow}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: THEME.textPrimary },
                      ]}
                    >
                      Automated Savings Goals
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingGoalId(null);
                        setGoalTitle("");
                        setGoalTargetAmount("");
                        setGoalModal(true);
                      }}
                    >
                      <Text style={[styles.actionLink, { color: auraColor }]}>
                        + Create Goal
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{
                      color: THEME.textSecondary,
                      fontSize: 12,
                      marginBottom: 16,
                    }}
                  >
                    Set target amounts and deadlines. The engine calculates your
                    required daily savings run-rate.
                  </Text>

                  {savingsGoals.length === 0 ? (
                    <EmptyState
                      title="No Savings Goals Yet"
                      subtitle="Create a target goal to calculate your daily savings run-rate."
                      actionLabel="+ Create Goal"
                      onAction={() => setGoalModal(true)}
                      auraColor={auraColor}
                      isDark={isDarkMode}
                    />
                  ) : (
                    savingsGoals.map((g: any) => {
                      const progress = Math.min(
                        Math.round((g.current_amount / g.target_amount) * 100),
                        100,
                      );

                      const todayMs = new Date().getTime();
                      const targetMs = new Date(g.target_date).getTime();
                      const daysDiff = Math.max(
                        Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24)),
                        1,
                      );
                      const remainingAmt = Math.max(
                        g.target_amount - g.current_amount,
                        0,
                      );
                      const dailyNeeded = Math.ceil(remainingAmt / daysDiff);

                      return (
                        <View
                          key={g.id}
                          style={[
                            styles.modernRangeBox,
                            {
                              backgroundColor: THEME.surface,
                              borderColor: THEME.borderCard,
                            },
                            g.completed === 1 && {
                              borderColor: THEME.positive,
                              backgroundColor: "rgba(46,229,157,0.06)",
                            },
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: THEME.textPrimary,
                                fontSize: 14,
                                fontWeight: "700",
                              }}
                            >
                              {g.title}
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                {
                                  backgroundColor: g.completed
                                    ? "rgba(46,229,157,0.15)"
                                    : `${auraColor}20`,
                                  borderColor: g.completed
                                    ? THEME.positive
                                    : auraColor,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  {
                                    color: g.completed
                                      ? THEME.positive
                                      : auraColor,
                                  },
                                ]}
                              >
                                {g.completed
                                  ? "Completed 🎉"
                                  : `${daysDiff} Days Left`}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={{
                              color: THEME.positive,
                              fontSize: 14,
                              fontWeight: "bold",
                              marginBottom: 6,
                            }}
                          >
                            PKR {g.current_amount.toLocaleString()} /{" "}
                            {g.target_amount.toLocaleString()} ({progress}%)
                          </Text>

                          <View
                            style={[
                              styles.progressTrack,
                              {
                                backgroundColor: THEME.surfaceElevated,
                                marginBottom: 10,
                              },
                            ]}
                          >
                            <View
                              style={{
                                width: `${progress}%`,
                                height: "100%",
                                backgroundColor: g.completed
                                  ? THEME.positive
                                  : auraColor,
                                borderRadius: 5,
                              }}
                            />
                          </View>

                          {!g.completed && (
                            <Text
                              style={{
                                color: THEME.textSecondary,
                                fontSize: 11,
                                marginBottom: 12,
                              }}
                            >
                              💡 Save{" "}
                              <Text
                                style={{
                                  color: THEME.textPrimary,
                                  fontWeight: "bold",
                                }}
                              >
                                PKR {dailyNeeded.toLocaleString()}
                              </Text>{" "}
                              / day to hit target by {g.target_date}
                            </Text>
                          )}

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "flex-end",
                              alignItems: "center",
                            }}
                          >
                            <TouchableOpacity
                              style={[
                                styles.payBillBtn,
                                {
                                  backgroundColor: THEME.surfaceElevated,
                                  borderWidth: 1,
                                  borderColor: THEME.electricCyan,
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  marginRight: 8,
                                },
                              ]}
                              onPress={() => {
                                setEditingGoalId(g.id);
                                setGoalTitle(g.title);
                                setGoalTargetAmount(g.target_amount.toString());
                                if (g.target_date) {
                                  const parts = g.target_date.split("-");
                                  if (parts.length === 3) {
                                    setGoalYear(parts[0]);
                                    setGoalMonth(parts[1]);
                                    setGoalDay(parts[2]);
                                  }
                                }
                                setGoalModal(true);
                              }}
                            >
                              <Text
                                style={{
                                  color: THEME.electricCyan,
                                  fontSize: 11,
                                  fontWeight: "bold",
                                }}
                              >
                                Edit
                              </Text>
                            </TouchableOpacity>

                            {!g.completed && (
                              <TouchableOpacity
                                style={[
                                  styles.payBillBtn,
                                  {
                                    backgroundColor: auraColor,
                                    paddingVertical: 8,
                                    paddingHorizontal: 14,
                                    marginRight: 8,
                                  },
                                ]}
                                onPress={() =>
                                  setFundGoalModal({ visible: true, goal: g })
                                }
                              >
                                <Text
                                  style={{
                                    color: isDarkMode ? THEME.bg : "#FFF",
                                    fontSize: 11,
                                    fontWeight: "800",
                                  }}
                                >
                                  + Fund Goal
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => {
                                deleteSavingsGoal(g.id);
                                loadData();
                              }}
                            >
                              <Text
                                style={[
                                  styles.deleteText,
                                  { color: THEME.negative },
                                ]}
                              >
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* SUB-SCREEN: DEBTS & LOANS */}
              {moreSubTab === "debts" && (
                <View>
                  <View style={styles.sectionHeaderRow}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: THEME.textPrimary },
                      ]}
                    >
                      Smart Debt & Loan Tracker
                    </Text>
                    <TouchableOpacity onPress={() => setDebtModal(true)}>
                      <Text style={[styles.actionLink, { color: auraColor }]}>
                        + Track Loan / Debt
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{
                      color: THEME.textSecondary,
                      fontSize: 12,
                      marginBottom: 16,
                    }}
                  >
                    Manage money lent out and debts owed. Automatically syncs
                    with your bank accounts when settled.
                  </Text>

                  {debts.length === 0 ? (
                    <EmptyState
                      title="No Active Loans or Debts"
                      subtitle="Track money lent or borrowed with automatic bank balance synchronization."
                      actionLabel="+ Track Loan / Debt"
                      onAction={() => setDebtModal(true)}
                      auraColor={auraColor}
                      isDark={isDarkMode}
                    />
                  ) : (
                    debts.map((d: any) => {
                      const acc = accounts.find((a) => a.id === d.account_id);
                      const isLent = d.type === "lent";
                      const isSettled = d.status === "settled";

                      return (
                        <View
                          key={d.id}
                          style={[
                            styles.modernRangeBox,
                            {
                              backgroundColor: THEME.surface,
                              borderColor: THEME.borderCard,
                            },
                            isSettled && {
                              borderColor: THEME.positive,
                              backgroundColor: "rgba(46,229,157,0.06)",
                            },
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: THEME.textPrimary,
                                fontSize: 14,
                                fontWeight: "700",
                              }}
                            >
                              {d.title}
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                {
                                  backgroundColor: isSettled
                                    ? "rgba(46,229,157,0.15)"
                                    : isLent
                                      ? `${auraColor}20`
                                      : "rgba(255,94,126,0.15)",
                                  borderColor: isSettled
                                    ? THEME.positive
                                    : isLent
                                      ? auraColor
                                      : THEME.negative,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  {
                                    color: isSettled
                                      ? THEME.positive
                                      : isLent
                                        ? auraColor
                                        : THEME.negative,
                                  },
                                ]}
                              >
                                {isSettled
                                  ? "Settled ✓"
                                  : isLent
                                    ? "Lent (Receivable)"
                                    : "Borrowed (Payable)"}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={{
                              color: isLent ? THEME.positive : THEME.negative,
                              fontSize: 15,
                              fontWeight: "bold",
                              marginBottom: 4,
                            }}
                          >
                            PKR {d.amount.toLocaleString()} • Bank:{" "}
                            {acc?.name || "Main Wallet"}
                          </Text>
                          <Text
                            style={{
                              color: THEME.textSecondary,
                              fontSize: 11,
                              marginBottom: 12,
                            }}
                          >
                            Due Date: {d.due_date}
                          </Text>

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "flex-end",
                              alignItems: "center",
                            }}
                          >
                            {!isSettled && (
                              <TouchableOpacity
                                style={[
                                  styles.payBillBtn,
                                  {
                                    backgroundColor: auraColor,
                                    paddingVertical: 8,
                                    paddingHorizontal: 14,
                                    marginRight: 8,
                                  },
                                ]}
                                onPress={() => handleSettleDebt(d)}
                              >
                                <Text
                                  style={{
                                    color: isDarkMode ? THEME.bg : "#FFF",
                                    fontSize: 11,
                                    fontWeight: "800",
                                  }}
                                >
                                  Mark Settled
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => {
                                deleteDebt(d.id);
                                loadData();
                              }}
                            >
                              <Text
                                style={[
                                  styles.deleteText,
                                  { color: THEME.negative },
                                ]}
                              >
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* SUB-SCREEN: CLIENTS */}
              {moreSubTab === "clients" && (
                <View>
                  <View style={styles.sectionHeaderRow}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: THEME.textPrimary },
                      ]}
                    >
                      Clients & Counterparties
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingClient(null);
                        setClientModal(true);
                      }}
                    >
                      <Text style={[styles.actionLink, { color: auraColor }]}>
                        + Add Client
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {clients.length === 0 ? (
                    <EmptyState
                      title="No Clients Added"
                      subtitle="Save your clients to track freelance revenue and generate PDF invoices."
                      actionLabel="+ Add Client"
                      onAction={() => setClientModal(true)}
                      auraColor={auraColor}
                      isDark={isDarkMode}
                    />
                  ) : (
                    clients.map((c) => (
                      <View
                        key={c.id}
                        style={[
                          styles.clientCard,
                          {
                            backgroundColor: THEME.surface,
                            borderColor: THEME.borderCard,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.clientName,
                              { color: THEME.textPrimary },
                            ]}
                          >
                            {c.name}{" "}
                            <Text
                              style={[
                                styles.clientCompany,
                                { color: auraColor },
                              ]}
                            >
                              ({c.category})
                            </Text>
                          </Text>
                          <Text
                            style={[
                              styles.clientMeta,
                              { color: THEME.textSecondary },
                            ]}
                          >
                            {c.company} • {c.country}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingClient(c);
                            setClientName(c.name);
                            setClientCompany(c.company);
                            setClientCountry(c.country);
                            setClientModal(true);
                          }}
                          style={{ marginRight: 12 }}
                        >
                          <Text
                            style={[
                              styles.editText,
                              { color: THEME.electricCyan },
                            ]}
                          >
                            Edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setConfirmModal({
                              visible: true,
                              title: "Delete Client?",
                              message: `Remove client "${c.name}"?`,
                              onConfirm: () => {
                                const removed = deleteClient(c.id);
                                loadData();
                                triggerUndo("Deleted client", () =>
                                  restoreClient(removed),
                                );
                              },
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.deleteText,
                              { color: THEME.negative },
                            ]}
                          >
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </Animated.ScrollView>

        {/* ================= BOTTOM NAVIGATION BAR ================= */}
        <View
          style={[
            styles.bottomNavContainer,
            {
              backgroundColor: THEME.surface,
              borderTopColor: `${auraColor}30`,
            },
          ]}
        >
          {[
            { key: "home", label: "Home", glyph: "grid-outline" },
            {
              key: "activity",
              label: "Activity",
              glyph: "swap-vertical-outline",
            },
            {
              key: "insights",
              label: "Insights",
              glyph: "stats-chart-outline",
            },
            { key: "accounts", label: "Accounts", glyph: "wallet-outline" },
            { key: "more", label: "More", glyph: "menu-outline" },
          ].map((item) => {
            const active = primaryNav === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.bottomNavItem}
                onPress={() => handlePrimaryNavChange(item.key as any)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.bottomNavPill,
                    active && {
                      backgroundColor: `${auraColor}22`,
                      borderColor: `${auraColor}66`,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.glyph as any}
                    size={18}
                    color={active ? auraColor : THEME.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.bottomNavLabel,
                    {
                      color: active ? THEME.textPrimary : THEME.textSecondary,
                      fontWeight: active ? "800" : "600",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </KeyboardAvoidingView>

      {/* ================= THEME STUDIO & AURA ENGINE MODAL ================= */}
      <Modal visible={themeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: THEME.surface,
                borderColor: `${auraColor}50`,
                maxHeight: "92%",
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={[styles.modalTitle, { color: THEME.textPrimary }]}>
                  Theme Studio & Aura Engine
                </Text>
                <TouchableOpacity onPress={() => setThemeModal(false)}>
                  <Text
                    style={{
                      color: auraColor,
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mode Toggle */}
              <Text style={[styles.labelSub, { color: THEME.textSecondary }]}>
                Interface Mode:
              </Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    isDarkMode && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setIsDarkMode(true);
                    persistVisualPreferences({ mode: "dark" });
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: THEME.textSecondary },
                      isDarkMode && { color: THEME.bg, fontWeight: "bold" },
                    ]}
                  >
                    Dark Cyberpunk
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    !isDarkMode && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setIsDarkMode(false);
                    persistVisualPreferences({ mode: "light" });
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: THEME.textSecondary },
                      !isDarkMode && { color: "#FFF", fontWeight: "bold" },
                    ]}
                  >
                    Light Luminous
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Aura Intensity Selector */}
              <Text style={[styles.labelSub, { color: THEME.textSecondary }]}>
                Ambient Aura Intensity:
              </Text>
              <View style={styles.toggleRow}>
                {(["subtle", "balanced", "vivid", "off"] as const).map(
                  (lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: THEME.surfaceElevated,
                          borderColor: THEME.borderCard,
                          paddingHorizontal: 2,
                        },
                        auraIntensity === lvl && {
                          backgroundColor: auraColor,
                          borderColor: auraColor,
                        },
                      ]}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch (e) {}
                        setAuraIntensity(lvl);
                        persistVisualPreferences({ auraIntensity: lvl });
                      }}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          { color: THEME.textSecondary, fontSize: 10 },
                          auraIntensity === lvl && {
                            color: isDarkMode ? THEME.bg : "#FFF",
                            fontWeight: "bold",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {lvl.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              {/* Preset Gallery */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: THEME.textPrimary, marginVertical: 8 },
                ]}
              >
                Preset Themes Gallery
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                {Object.entries(PRESET_THEMES).map(([key, t]) => (
                  <TouchableOpacity
                    key={key}
                    style={{
                      width: "48%",
                      backgroundColor: THEME.surfaceElevated,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor:
                        auraColor === t.primary ? t.primary : THEME.borderCard,
                    }}
                    onPress={() => changeAuraTheme(t.primary, t.secondary)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: t.primary,
                          marginRight: 6,
                        }}
                      />
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: t.secondary,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        color: THEME.textPrimary,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.labelSub, { color: THEME.textSecondary }]}>
                Custom Spectrum Picker:
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 20,
                  justifyContent: "space-between",
                }}
              >
                {COLOR_SPECTRUM.map((hex) => (
                  <TouchableOpacity
                    key={hex}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: hex,
                      margin: 5,
                      borderWidth: auraColor === hex ? 3 : 1,
                      borderColor: "#FFFFFF",
                    }}
                    onPress={() => changeAuraTheme(hex)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= STATEMENT EXPORT MODAL (With Advanced Date Range Picker) ================= */}
      <Modal visible={exportModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: THEME.surface,
                maxHeight: "90%",
                borderColor: `${auraColor}50`,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: THEME.textPrimary }]}>
                Export Statement Range (Excel/CSV)
              </Text>

              <View
                style={[
                  styles.modernRangeBox,
                  {
                    backgroundColor: THEME.surfaceElevated,
                    borderColor: `${auraColor}40`,
                  },
                ]}
              >
                <Text style={[styles.rangeSubLabel, { color: auraColor }]}>
                  Select Date Range:
                </Text>
                <View
                  style={[
                    styles.rangeTabsRow,
                    {
                      backgroundColor: THEME.bg,
                      borderColor: THEME.borderCard,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.rangeTabBtn,
                      statementRangeTab === "start" && {
                        backgroundColor: auraColor,
                      },
                    ]}
                    onPress={() => setStatementRangeTab("start")}
                  >
                    <Text
                      style={[
                        styles.rangeTabText,
                        {
                          color:
                            statementRangeTab === "start"
                              ? isDarkMode
                                ? THEME.bg
                                : "#FFF"
                              : THEME.textSecondary,
                        },
                        statementRangeTab === "start" &&
                          styles.rangeTabTextActive,
                      ]}
                    >
                      From: {exportStartDate}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.rangeTabBtn,
                      statementRangeTab === "end" && {
                        backgroundColor: auraColor,
                      },
                    ]}
                    onPress={() => setStatementRangeTab("end")}
                  >
                    <Text
                      style={[
                        styles.rangeTabText,
                        {
                          color:
                            statementRangeTab === "end"
                              ? isDarkMode
                                ? THEME.bg
                                : "#FFF"
                              : THEME.textSecondary,
                        },
                        statementRangeTab === "end" &&
                          styles.rangeTabTextActive,
                      ]}
                    >
                      To: {exportEndDate}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.rangeSubLabel, { color: auraColor }]}>
                  Select Year:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  {["2024", "2025", "2026", "2027"].map((yr) => {
                    const active =
                      statementRangeTab === "start"
                        ? exportStartDate.startsWith(yr)
                        : exportEndDate.startsWith(yr);
                    return (
                      <TouchableOpacity
                        key={yr}
                        style={[
                          styles.pillChip,
                          {
                            backgroundColor: THEME.surface,
                            borderColor: THEME.borderCard,
                          },
                          active && {
                            backgroundColor: auraColor,
                            borderColor: auraColor,
                          },
                        ]}
                        onPress={() => {
                          if (statementRangeTab === "start") {
                            setExportStartDate(
                              `${yr}${exportStartDate.slice(4)}`,
                            );
                          } else {
                            setExportEndDate(`${yr}${exportEndDate.slice(4)}`);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.pillChipText,
                            {
                              color: active
                                ? isDarkMode
                                  ? THEME.bg
                                  : "#FFF"
                                : THEME.textSecondary,
                            },
                            active && styles.pillChipTextActive,
                          ]}
                        >
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.rangeSubLabel, { color: auraColor }]}>
                  Select Month:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  {[
                    { m: "01", name: "Jan" },
                    { m: "02", name: "Feb" },
                    { m: "03", name: "Mar" },
                    { m: "04", name: "Apr" },
                    { m: "05", name: "May" },
                    { m: "06", name: "Jun" },
                    { m: "07", name: "Jul" },
                    { m: "08", name: "Aug" },
                    { m: "09", name: "Sep" },
                    { m: "10", name: "Oct" },
                    { m: "11", name: "Nov" },
                    { m: "12", name: "Dec" },
                  ].map((mo) => {
                    const active =
                      statementRangeTab === "start"
                        ? exportStartDate.slice(5, 7) === mo.m
                        : exportEndDate.slice(5, 7) === mo.m;
                    return (
                      <TouchableOpacity
                        key={mo.m}
                        style={[
                          styles.pillChip,
                          {
                            backgroundColor: THEME.surface,
                            borderColor: THEME.borderCard,
                          },
                          active && {
                            backgroundColor: auraColor,
                            borderColor: auraColor,
                          },
                        ]}
                        onPress={() => {
                          if (statementRangeTab === "start") {
                            setExportStartDate(
                              `${exportStartDate.slice(0, 4)}-${mo.m}${exportStartDate.slice(7)}`,
                            );
                          } else {
                            setExportEndDate(
                              `${exportEndDate.slice(0, 4)}-${mo.m}${exportEndDate.slice(7)}`,
                            );
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.pillChipText,
                            {
                              color: active
                                ? isDarkMode
                                  ? THEME.bg
                                  : "#FFF"
                                : THEME.textSecondary,
                            },
                            active && styles.pillChipTextActive,
                          ]}
                        >
                          {mo.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setExportModal(false)}
                >
                  <Text
                    style={[
                      styles.cancelBtnText,
                      { color: THEME.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: auraColor,
                      marginLeft: 8,
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      flex: 1,
                    },
                  ]}
                  onPress={downloadDeviceExcelCSV}
                >
                  <Text style={styles.saveBtnText}>Download Excel/CSV 📥</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= VICTORY CELEBRATION MODAL ================= */}
      <Modal
        visible={victoryModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: THEME.surface,
                alignItems: "center",
                borderColor: THEME.positive,
              },
            ]}
          >
            <Image
              source={VYBE_LOGO}
              style={{ width: 56, height: 56, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.modalTitle,
                { color: THEME.positive, textAlign: "center" },
              ]}
            >
              Goal Target Reached! 🎉
            </Text>
            <Text
              style={{
                color: THEME.textPrimary,
                fontSize: 13,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              You have completed funding for "{victoryModal.title}".
            </Text>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: THEME.positive,
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                },
              ]}
              onPress={() => setVictoryModal({ visible: false, title: "" })}
            >
              <Text style={[styles.saveBtnText, { color: "#09090F" }]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= ONBOARDING WIZARD ================= */}
      <Modal visible={onboardingModal} animationType="fade" transparent={true}>
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(8, 9, 13, 0.96)" },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: THEME.surface,
                alignItems: "center",
                paddingVertical: 30,
                borderColor: `${auraColor}55`,
              },
            ]}
          >
            <View style={{ marginBottom: 16 }}>
              <BrandMark
                size={48}
                auraColor={auraColor}
                showWordmark={false}
                isDark={isDarkMode}
              />
            </View>

            {onboardStep === 1 && (
              <View style={{ width: "100%", alignItems: "center" }}>
                <Text
                  style={[
                    styles.modalTitle,
                    { fontSize: 22, textAlign: "center", color: auraColor },
                  ]}
                >
                  VYBE Manager
                </Text>
                <Text
                  style={{
                    color: THEME.textSecondary,
                    fontSize: 13,
                    textAlign: "center",
                    marginBottom: 22,
                    lineHeight: 19,
                  }}
                >
                  Your offline-first financial liquid engine. Let’s personalize
                  your command center. What is your name?
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      color: THEME.textPrimary,
                      width: "100%",
                      textAlign: "center",
                      fontSize: 15,
                    },
                  ]}
                  placeholder="Enter your name"
                  placeholderTextColor={THEME.textSecondary}
                  value={userNameInput}
                  onChangeText={setUserNameInput}
                />
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor: auraColor,
                      width: "100%",
                      padding: 16,
                      borderRadius: 14,
                      alignItems: "center",
                      marginTop: 10,
                    },
                  ]}
                  onPress={() => {
                    if (!userNameInput) return;
                    setOnboardStep(2);
                  }}
                >
                  <Text style={styles.saveBtnText}>Continue ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {onboardStep === 2 && (
              <View style={{ width: "100%" }}>
                <Text
                  style={[
                    styles.modalTitle,
                    { fontSize: 20, textAlign: "center", color: auraColor },
                  ]}
                >
                  Select Base Currency
                </Text>
                <Text
                  style={{
                    color: THEME.textSecondary,
                    fontSize: 12,
                    textAlign: "center",
                    marginBottom: 14,
                  }}
                >
                  Search or pick your primary reporting currency:
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      color: THEME.textPrimary,
                      marginBottom: 10,
                    },
                  ]}
                  placeholder="Search currency code or country..."
                  placeholderTextColor={THEME.textSecondary}
                  value={currencySearchQuery}
                  onChangeText={setCurrencySearchQuery}
                />

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 200, marginBottom: 16 }}
                >
                  {filteredCurrencies.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={[
                        styles.clientCard,
                        { backgroundColor: THEME.surfaceElevated },
                        baseCurrencyChoice === c.code && {
                          borderColor: auraColor,
                          backgroundColor: `${auraColor}20`,
                        },
                      ]}
                      onPress={() => setBaseCurrencyChoice(c.code)}
                    >
                      <Text style={{ fontSize: 20, marginRight: 10 }}>
                        {c.flag}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: THEME.textPrimary,
                            fontWeight: "bold",
                            fontSize: 13,
                          }}
                        >
                          {c.code} - {c.country}
                        </Text>
                      </View>
                      {baseCurrencyChoice === c.code && (
                        <Text
                          style={{
                            color: auraColor,
                            fontWeight: "bold",
                            fontSize: 12,
                          }}
                        >
                          Selected ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor: auraColor,
                      width: "100%",
                      padding: 16,
                      borderRadius: 14,
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => setOnboardStep(3)}
                >
                  <Text style={styles.saveBtnText}>
                    Next: Aura Theme Spectrum
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {onboardStep === 3 && (
              <View style={{ width: "100%", alignItems: "center" }}>
                <Text
                  style={[
                    styles.modalTitle,
                    { fontSize: 20, textAlign: "center", color: auraColor },
                  ]}
                >
                  Customize Aura Accent
                </Text>
                <Text
                  style={{
                    color: THEME.textSecondary,
                    fontSize: 12,
                    textAlign: "center",
                    marginBottom: 18,
                  }}
                >
                  Choose your signature cyberpunk accent hue:
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginBottom: 22,
                  }}
                >
                  {COLOR_SPECTRUM.map((hex) => (
                    <TouchableOpacity
                      key={hex}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        backgroundColor: hex,
                        margin: 7,
                        borderWidth: auraColor === hex ? 3 : 1,
                        borderColor: "#FFFFFF",
                      }}
                      onPress={() => changeAuraTheme(hex)}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor: auraColor,
                      width: "100%",
                      padding: 16,
                      borderRadius: 14,
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => setOnboardStep(4)}
                >
                  <Text style={styles.saveBtnText}>Next: Legal & Privacy</Text>
                </TouchableOpacity>
              </View>
            )}

            {onboardStep === 4 && (
              <View style={{ width: "100%" }}>
                <Text
                  style={[
                    styles.modalTitle,
                    { fontSize: 18, textAlign: "center", color: auraColor },
                  ]}
                >
                  Terms & Offline Vault Guarantee
                </Text>
                <ScrollView
                  style={{
                    backgroundColor: THEME.surfaceElevated,
                    borderRadius: 12,
                    padding: 12,
                    maxHeight: 175,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: THEME.borderCard,
                  }}
                  showsVerticalScrollIndicator={true}
                >
                  <Text
                    style={{
                      color: THEME.textSecondary,
                      fontSize: 11,
                      lineHeight: 17,
                    }}
                  >
                    1. Acceptance of Terms: By operating VYBE Manager, you agree
                    to these terms.{"\n\n"}
                    2. Local-First Architecture: VYBE Manager operates 100%
                    offline on your device via local SQLite persistence.{"\n\n"}
                    3. Financial Accuracy Disclaimer: Exchange rates and
                    run-rate calculations are provided as bookkeeping aids.
                    Verify your manual entries and maintain regular JSON
                    backups.{"\n\n"}
                    4. Data Ownership: Your financial records never leave your
                    device unless you explicitly export or share a statement.
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                >
                  <View
                    style={[
                      styles.themeGearIcon,
                      {
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        borderColor: auraColor,
                        backgroundColor: termsAccepted
                          ? auraColor
                          : "transparent",
                      },
                    ]}
                  />
                  <Text
                    style={{
                      color: THEME.textPrimary,
                      fontSize: 12,
                      marginLeft: 10,
                    }}
                  >
                    I accept the Terms & Offline Vault conditions.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor: termsAccepted
                        ? auraColor
                        : THEME.surfaceElevated,
                      width: "100%",
                      padding: 16,
                      borderRadius: 14,
                      alignItems: "center",
                      opacity: termsAccepted ? 1 : 0.6,
                    },
                  ]}
                  disabled={!termsAccepted}
                  onPress={() => setOnboardStep(5)}
                >
                  <Text style={styles.saveBtnText}>Next: Quick Tour ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {onboardStep === 5 && (
              <View style={{ width: "100%", alignItems: "center" }}>
                <Text
                  style={[
                    styles.modalTitle,
                    { fontSize: 19, textAlign: "center", color: auraColor },
                  ]}
                >
                  Command Center Walkthrough
                </Text>

                <View
                  style={{
                    backgroundColor: THEME.surfaceElevated,
                    borderRadius: 16,
                    padding: 18,
                    width: "100%",
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: `${auraColor}66`,
                  }}
                >
                  {tutorialStep === 1 && (
                    <>
                      <Text
                        style={{
                          color: auraColor,
                          fontWeight: "bold",
                          fontSize: 15,
                          marginBottom: 6,
                        }}
                      >
                        1. Brand Header & Vault Drawer
                      </Text>
                      <Text
                        style={{
                          color: THEME.textPrimary,
                          fontSize: 12,
                          lineHeight: 18,
                        }}
                      >
                        Tap the top-left menu button anytime for PDF Invoicing,
                        30-Day Invoice History, CSV Exports, JSON Backups, and
                        Biometric Reset.
                      </Text>
                    </>
                  )}
                  {tutorialStep === 2 && (
                    <>
                      <Text
                        style={{
                          color: auraColor,
                          fontWeight: "bold",
                          fontSize: 15,
                          marginBottom: 6,
                        }}
                      >
                        2. Net Position & Privacy Shield
                      </Text>
                      <Text
                        style={{
                          color: THEME.textPrimary,
                          fontSize: 12,
                          lineHeight: 18,
                        }}
                      >
                        Your real-time consolidated net worth and monthly
                        cashflow sit at the top. Tap the eye icon to mask
                        balances in public.
                      </Text>
                    </>
                  )}
                  {tutorialStep === 3 && (
                    <>
                      <Text
                        style={{
                          color: auraColor,
                          fontWeight: "bold",
                          fontSize: 15,
                          marginBottom: 6,
                        }}
                      >
                        3. Bottom Navigation Bar
                      </Text>
                      <Text
                        style={{
                          color: THEME.textPrimary,
                          fontSize: 12,
                          lineHeight: 18,
                        }}
                      >
                        Switch effortlessly between Home, Activity Ledger,
                        Financial Insights, Accounts, and the More Command
                        Suite.
                      </Text>
                    </>
                  )}
                  {tutorialStep === 4 && (
                    <>
                      <Text
                        style={{
                          color: auraColor,
                          fontWeight: "bold",
                          fontSize: 15,
                          marginBottom: 6,
                        }}
                      >
                        4. Multi-Currency & PDF Invoicing
                      </Text>
                      <Text
                        style={{
                          color: THEME.textPrimary,
                          fontSize: 12,
                          lineHeight: 18,
                        }}
                      >
                        Record transactions in 20+ currencies with live FX rates
                        and generate branded client invoices instantly.
                      </Text>
                    </>
                  )}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  {tutorialStep > 1 && (
                    <TouchableOpacity
                      style={[
                        styles.modalBtn,
                        styles.cancelBtn,
                        { flex: 1, marginRight: 8 },
                      ]}
                      onPress={() => setTutorialStep((tutorialStep - 1) as any)}
                    >
                      <Text
                        style={[
                          styles.cancelBtnText,
                          { color: THEME.textSecondary },
                        ]}
                      >
                        Back
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      {
                        backgroundColor: auraColor,
                        flex: 2,
                        padding: 14,
                        borderRadius: 12,
                        alignItems: "center",
                      },
                    ]}
                    onPress={() => {
                      if (tutorialStep < 4) {
                        setTutorialStep((tutorialStep + 1) as any);
                      } else {
                        completeOnboarding();
                      }
                    }}
                  >
                    <Text style={styles.saveBtnText}>
                      {tutorialStep === 4 ? "Launch VYBE Engine 🚀" : "Next ➔"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= ERROR MODAL ================= */}
      <Modal
        visible={errorModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: THEME.surface,
                alignItems: "center",
                borderColor: `${THEME.negative}60`,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: THEME.negative, textAlign: "center" },
              ]}
            >
              Action Blocked
            </Text>
            <Text
              style={{
                color: THEME.textPrimary,
                fontSize: 13,
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 19,
              }}
            >
              {errorModal.message}
            </Text>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                {
                  backgroundColor: auraColor,
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                },
              ]}
              onPress={() => setErrorModal({ visible: false, message: "" })}
            >
              <Text style={styles.saveBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= CONFIRMATION MODAL ================= */}
      <Modal
        visible={confirmModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: THEME.surface,
                alignItems: "center",
                borderColor: `${auraColor}50`,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: THEME.textPrimary, textAlign: "center" },
              ]}
            >
              {confirmModal.title}
            </Text>
            <Text
              style={{
                color: THEME.textSecondary,
                fontSize: 13,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {confirmModal.message}
            </Text>

            {confirmModal.title === "⚠️ Clear Local Financial Data" && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: THEME.surfaceElevated,
                    color: THEME.textPrimary,
                    width: "100%",
                    marginBottom: 18,
                    borderColor:
                      confirmPhraseInput === "CLEAR VYBE"
                        ? auraColor
                        : THEME.borderCard,
                  },
                ]}
                value={confirmPhraseInput}
                onChangeText={(value) => {
                  confirmPhraseRef.current = value;
                  setConfirmPhraseInput(value);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Type CLEAR VYBE"
                placeholderTextColor={THEME.textSecondary}
                accessibilityLabel="Type CLEAR VYBE to confirm local data deletion"
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setConfirmPhraseInput("");
                  confirmPhraseRef.current = "";
                  setConfirmModal({
                    visible: false,
                    title: "",
                    message: "",
                    onConfirm: () => {},
                  });
                }}
              >
                <Text
                  style={[styles.cancelBtnText, { color: THEME.textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: THEME.negative, marginLeft: 8 },
                  confirmModal.title === "⚠️ Clear Local Financial Data" &&
                  confirmPhraseInput.trim() !== "CLEAR VYBE"
                    ? { opacity: 0.45 }
                    : null,
                ]}
                disabled={
                  confirmModal.title === "⚠️ Clear Local Financial Data" &&
                  confirmPhraseInput.trim() !== "CLEAR VYBE"
                }
                onPress={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({
                    visible: false,
                    title: "",
                    message: "",
                    onConfirm: () => {},
                  });
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= ADD ACCOUNT MODAL ================= */}
      <Modal visible={accountModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: THEME.surface, borderColor: `${auraColor}50` },
            ]}
          >
            <Text style={[styles.modalTitle, { color: THEME.textPrimary }]}>
              Add Bank Account or Wallet
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: THEME.surfaceElevated,
                  color: THEME.textPrimary,
                },
              ]}
              placeholder="Account Name (e.g. Meezan Bank, SadaPay)"
              placeholderTextColor={THEME.textSecondary}
              value={accName}
              onChangeText={setAccName}
            />

            <Text style={styles.labelSub}>Account Type:</Text>
            <View style={styles.toggleRow}>
              {[
                { key: "wallet", label: "Local Wallet / Bank" },
                { key: "platform", label: "Global Platform" },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    accType === t.key && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => setAccType(t.key)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: THEME.textSecondary },
                      accType === t.key && {
                        color: isDarkMode ? THEME.bg : "#FFF",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: THEME.surfaceElevated,
                  color: THEME.textPrimary,
                },
              ]}
              placeholder="Opening Balance (PKR)"
              placeholderTextColor={THEME.textSecondary}
              keyboardType="numeric"
              value={accBalance}
              onChangeText={(t) => setAccBalance(t.replace(/[^0-9.]/g, ""))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setAccountModal(false)}
              >
                <Text
                  style={[styles.cancelBtnText, { color: THEME.textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: auraColor,
                    marginLeft: 8,
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flex: 1,
                  },
                ]}
                onPress={handleSaveAccount}
              >
                <Text style={styles.saveBtnText}>Save Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= TRANSACTION MODAL ================= */}
      <Modal visible={txModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: THEME.surface,
                maxHeight: "92%",
                borderColor: `${auraColor}50`,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: THEME.textPrimary }]}>
                {editingTx ? "Edit Transaction" : "Record Ledger Entry"}
              </Text>

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    txType === "in" && styles.toggleInActive,
                  ]}
                  onPress={() => {
                    setTxType("in");
                    setCategory(allIncomeCategories[0] || "Salary");
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: THEME.textSecondary },
                      txType === "in" && styles.toggleTextActive,
                    ]}
                  >
                    ↙ Inflow
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    txType === "out" && styles.toggleOutActive,
                  ]}
                  onPress={() => {
                    setTxType("out");
                    setCategory(allExpenseCategories[0] || "Groceries & Food");
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: THEME.textSecondary },
                      txType === "out" && styles.toggleTextActive,
                    ]}
                  >
                    ↗ Outflow
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: THEME.surfaceElevated,
                      borderColor: THEME.borderCard,
                    },
                    txType === "transfer" && {
                      backgroundColor: THEME.electricCyan,
                      borderColor: THEME.electricCyan,
                    },
                  ]}
                  onPress={() => {
                    setTxType("transfer");
                    setCategory("Account Transfer");
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: THEME.textSecondary },
                      txType === "transfer" && {
                        color: isDarkMode ? THEME.bg : "#FFF",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    ⇄ Transfer
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.labelSub}>Transaction Currency:</Text>
                <TouchableOpacity onPress={() => setCurrencyModal(true)}>
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    + Global Currencies
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {userCurrencies.map((cur) => (
                  <TouchableOpacity
                    key={cur}
                    style={[
                      styles.pillChip,
                      {
                        backgroundColor: THEME.surfaceElevated,
                        borderColor: THEME.borderCard,
                      },
                      currency === cur && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setCurrency(cur)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        {
                          color:
                            currency === cur
                              ? isDarkMode
                                ? THEME.bg
                                : "#FFF"
                              : THEME.textSecondary,
                        },
                        currency === cur && styles.pillChipTextActive,
                      ]}
                    >
                      {cur}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {currency !== "PKR" && (
                <View
                  style={{
                    marginBottom: 12,
                    backgroundColor: THEME.surfaceElevated,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: THEME.borderCard,
                  }}
                >
                  <Text
                    style={{
                      color: THEME.positive,
                      fontSize: 11,
                      marginBottom: 4,
                    }}
                  >
                    Live FX Rate: 1 {currency} = {getLiveRate(currency)} PKR
                  </Text>

                  <TouchableOpacity
                    style={{ marginVertical: 4 }}
                    onPress={() => setOverrideRateActive(!overrideRateActive)}
                  >
                    <Text
                      style={{
                        color: auraColor,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {overrideRateActive
                        ? "✓ Using Custom Net Rate"
                        : "+ Override with custom bank/platform rate"}
                    </Text>
                  </TouchableOpacity>

                  {overrideRateActive && (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: THEME.surface,
                          color: THEME.textPrimary,
                          marginTop: 6,
                          marginBottom: 0,
                        },
                      ]}
                      placeholder="Enter exact rate received..."
                      placeholderTextColor={THEME.textSecondary}
                      keyboardType="numeric"
                      value={exchangeRate}
                      onChangeText={setExchangeRate}
                    />
                  )}
                </View>
              )}

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: THEME.surfaceElevated,
                    color: THEME.textPrimary,
                  },
                ]}
                placeholder={`Amount (${currency})`}
                placeholderTextColor={THEME.textSecondary}
                keyboardType="numeric"
                value={amountInput}
                onChangeText={(t) => setAmountInput(t.replace(/[^0-9.]/g, ""))}
              />

              {txType !== "transfer" && (
                <>
                  <Text style={styles.labelSub}>Category:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 12 }}
                  >
                    {(txType === "in"
                      ? allIncomeCategories
                      : allExpenseCategories
                    ).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.pillChip,
                          {
                            backgroundColor: THEME.surfaceElevated,
                            borderColor: THEME.borderCard,
                          },
                          category === cat && {
                            backgroundColor: auraColor,
                            borderColor: auraColor,
                          },
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.pillChipText,
                            {
                              color:
                                category === cat
                                  ? isDarkMode
                                    ? THEME.bg
                                    : "#FFF"
                                  : THEME.textSecondary,
                            },
                            category === cat && styles.pillChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.labelSub}>
                {txType === "transfer"
                  ? "From Account (Source):"
                  : "Account / Wallet:"}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.pillChip,
                      {
                        backgroundColor: THEME.surfaceElevated,
                        borderColor: THEME.borderCard,
                      },
                      selectedAccountId === acc.id && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setSelectedAccountId(acc.id)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        {
                          color:
                            selectedAccountId === acc.id
                              ? isDarkMode
                                ? THEME.bg
                                : "#FFF"
                              : THEME.textSecondary,
                        },
                        selectedAccountId === acc.id &&
                          styles.pillChipTextActive,
                      ]}
                    >
                      {acc.name} (PKR {acc.balance.toLocaleString()})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {txType === "transfer" && (
                <>
                  <Text style={styles.labelSub}>To Account (Destination):</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 12 }}
                  >
                    {accounts
                      .filter((acc) => acc.id !== selectedAccountId)
                      .map((acc) => (
                        <TouchableOpacity
                          key={acc.id}
                          style={[
                            styles.pillChip,
                            {
                              backgroundColor: THEME.surfaceElevated,
                              borderColor: THEME.borderCard,
                            },
                            destAccountId === acc.id && {
                              backgroundColor: THEME.electricCyan,
                              borderColor: THEME.electricCyan,
                            },
                          ]}
                          onPress={() => setDestAccountId(acc.id)}
                        >
                          <Text
                            style={[
                              styles.pillChipText,
                              {
                                color:
                                  destAccountId === acc.id
                                    ? isDarkMode
                                      ? THEME.bg
                                      : "#FFF"
                                    : THEME.textSecondary,
                              },
                              destAccountId === acc.id &&
                                styles.pillChipTextActive,
                            ]}
                          >
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </>
              )}

              {txType === "in" && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.labelSub}>Received From Client:</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setShowQuickClientInput(!showQuickClientInput)
                      }
                    >
                      <Text style={[styles.actionLink, { color: auraColor }]}>
                        {showQuickClientInput
                          ? "Select Existing"
                          : "+ Quick Add"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showQuickClientInput ? (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: THEME.surfaceElevated,
                          color: THEME.textPrimary,
                        },
                      ]}
                      placeholder="New Client Name"
                      placeholderTextColor={THEME.textSecondary}
                      value={quickClientName}
                      onChangeText={setQuickClientName}
                    />
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 12 }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.pillChip,
                          {
                            backgroundColor: THEME.surfaceElevated,
                            borderColor: THEME.borderCard,
                          },
                          selectedClientId === null && {
                            backgroundColor: auraColor,
                            borderColor: auraColor,
                          },
                        ]}
                        onPress={() => setSelectedClientId(null)}
                      >
                        <Text
                          style={[
                            styles.pillChipText,
                            {
                              color:
                                selectedClientId === null
                                  ? isDarkMode
                                    ? THEME.bg
                                    : "#FFF"
                                  : THEME.textSecondary,
                            },
                            selectedClientId === null &&
                              styles.pillChipTextActive,
                          ]}
                        >
                          None / Direct
                        </Text>
                      </TouchableOpacity>
                      {clients.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.pillChip,
                            {
                              backgroundColor: THEME.surfaceElevated,
                              borderColor: THEME.borderCard,
                            },
                            selectedClientId === c.id && {
                              backgroundColor: auraColor,
                              borderColor: auraColor,
                            },
                          ]}
                          onPress={() => setSelectedClientId(c.id)}
                        >
                          <Text
                            style={[
                              styles.pillChipText,
                              {
                                color:
                                  selectedClientId === c.id
                                    ? isDarkMode
                                      ? THEME.bg
                                      : "#FFF"
                                    : THEME.textSecondary,
                              },
                              selectedClientId === c.id &&
                                styles.pillChipTextActive,
                            ]}
                          >
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: THEME.surfaceElevated,
                    color: THEME.textPrimary,
                  },
                ]}
                placeholder="Memo / Description (optional)"
                placeholderTextColor={THEME.textSecondary}
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setTxModal(false)}
                >
                  <Text
                    style={[
                      styles.cancelBtnText,
                      { color: THEME.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: auraColor,
                      marginLeft: 8,
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      flex: 1,
                    },
                  ]}
                  onPress={handleSaveTransaction}
                >
                  <Text style={styles.saveBtnText}>Save Entry</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= CLIENT MODAL ================= */}
      <Modal visible={clientModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: THEME.surface, borderColor: `${auraColor}50` },
            ]}
          >
            <Text style={[styles.modalTitle, { color: THEME.textPrimary }]}>
              {editingClient ? "Edit Client" : "New Client / Counterparty"}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: THEME.surfaceElevated,
                  color: THEME.textPrimary,
                },
              ]}
              placeholder="Client Name"
              placeholderTextColor={THEME.textSecondary}
              value={clientName}
              onChangeText={setClientName}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: THEME.surfaceElevated,
                  color: THEME.textPrimary,
                },
              ]}
              placeholder="Company / Organization"
              placeholderTextColor={THEME.textSecondary}
              value={clientCompany}
              onChangeText={setClientCompany}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: THEME.surfaceElevated,
                  color: THEME.textPrimary,
                },
              ]}
              placeholder="Country"
              placeholderTextColor={THEME.textSecondary}
              value={clientCountry}
              onChangeText={setClientCountry}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setClientModal(false)}
              >
                <Text
                  style={[styles.cancelBtnText, { color: THEME.textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: auraColor,
                    marginLeft: 8,
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flex: 1,
                  },
                ]}
                onPress={handleSaveClient}
              >
                <Text style={styles.saveBtnText}>Save Client</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ================= FROSTED BRANDED NAVIGATION DRAWER ================= */}
      <Modal visible={menuModal} animationType="none" transparent={true}>
        <View style={styles.drawerBackdrop}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeMenu}
          />
          <Animated.View
            style={[
              styles.drawerContent,
              {
                backgroundColor: THEME.surface,
                borderColor: `${auraColor}40`,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View
              style={[
                styles.drawerHeader,
                { borderBottomColor: THEME.borderCard },
              ]}
            >
              <Image
                source={VYBE_ICON_BADGE}
                style={styles.drawerLogoImage}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.drawerUserName, { color: THEME.textPrimary }]}
                >
                  {userNameInput || "VYBE Operator"}
                </Text>
                <Text style={[styles.drawerUserSub, { color: auraColor }]}>
                  VYBE MANAGER
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.drawerDivider,
                { backgroundColor: THEME.borderCard },
              ]}
            />

            {/* Biometric App Lock Toggle Item in Hamburger Menu */}
            <View
              style={[
                styles.drawerNavItem,
                {
                  backgroundColor: THEME.surfaceElevated,
                  borderColor: THEME.borderCard,
                  justifyContent: "space-between",
                },
              ]}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={18}
                  color={auraColor}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={[styles.drawerNavText, { color: THEME.textPrimary }]}
                >
                  App Lock (Biometrics)
                </Text>
              </View>
              <Switch
                value={appLockEnabled}
                onValueChange={handleToggleAppLock}
                trackColor={{ false: THEME.surface, true: auraColor }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.drawerNavItem,
                {
                  backgroundColor: THEME.surfaceElevated,
                  borderColor: THEME.borderCard,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setThemeModal(true);
              }}
            >
              <Ionicons
                name="color-palette-outline"
                size={18}
                color={auraColor}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[styles.drawerNavText, { color: THEME.textPrimary }]}
              >
                Theme Studio & Aura
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.drawerNavItem,
                {
                  backgroundColor: THEME.surfaceElevated,
                  borderColor: THEME.borderCard,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setCategoryModal(true);
              }}
            >
              <Ionicons
                name="pricetags-outline"
                size={18}
                color={THEME.warning}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[styles.drawerNavText, { color: THEME.textPrimary }]}
              >
                Category Manager
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.drawerNavItem,
                {
                  backgroundColor: THEME.surfaceElevated,
                  borderColor: THEME.borderCard,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setInvoiceModal(true);
              }}
            >
              <Feather
                name="file-text"
                size={18}
                color={THEME.electricCyan}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[styles.drawerNavText, { color: THEME.textPrimary }]}
              >
                Generate Client Invoice
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.drawerNavItem,
                {
                  backgroundColor: THEME.surfaceElevated,
                  borderColor: THEME.borderCard,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setInvoiceHistoryModal(true);
              }}
            >
              <Ionicons
                name="folder-open-outline"
                size={18}
                color={auraColor}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[styles.drawerNavText, { color: THEME.textPrimary }]}
              >
                Invoice History (30 Days)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.drawerNavItem,
                {
                  backgroundColor: THEME.surfaceElevated,
                  borderColor: THEME.borderCard,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setExportModal(true);
              }}
            >
              <Feather
                name="download"
                size={18}
                color={THEME.positive}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[styles.drawerNavText, { color: THEME.textPrimary }]}
              >
                Export Statement (Excel/CSV)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.drawerNavItem,
                {
                  backgroundColor: THEME.surfaceElevated,
                  borderColor: THEME.borderCard,
                },
              ]}
              activeOpacity={0.8}
              onPress={downloadBackup}
            >
              <Feather
                name="hard-drive"
                size={18}
                color={auraColor}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[styles.drawerNavText, { color: THEME.textPrimary }]}
              >
                Export Full Backup (JSON)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.drawerNavItem,
                {
                  backgroundColor: THEME.surfaceElevated,
                  borderColor: THEME.borderCard,
                },
              ]}
              activeOpacity={0.8}
              onPress={handleUploadBackup}
            >
              <Feather
                name="upload"
                size={18}
                color={THEME.electricCyan}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[styles.drawerNavText, { color: THEME.textPrimary }]}
              >
                Upload & Restore Backup (JSON)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.drawerNavItem,
                {
                  borderColor: "rgba(255,94,126,0.3)",
                  backgroundColor: "rgba(255,94,126,0.06)",
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                handleClearAllData();
              }}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={THEME.negative}
                style={{ marginRight: 12 }}
              />
              <Text style={[styles.drawerNavText, { color: THEME.negative }]}>
                Clear All Data (Biometric)
              </Text>
            </TouchableOpacity>

            <View style={{ marginTop: "auto" }}>
              <TouchableOpacity
                style={[
                  styles.drawerSignOut,
                  {
                    backgroundColor: THEME.surfaceElevated,
                    borderColor: THEME.borderCard,
                  },
                ]}
                activeOpacity={0.8}
                onPress={closeMenu}
              >
                <Text
                  style={{
                    color: THEME.textSecondary,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Close Drawer
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  brandMarkContainer: { flexDirection: "row", alignItems: "center" },
  brandLogoWrapper: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  brandWordmark: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  brandTagPill: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  brandTagText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  brandSubword: {
    fontSize: 8.5,
    fontWeight: "600",
    letterSpacing: 0.9,
    marginTop: 1,
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerActionPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  auraSwatchDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  headerActionText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  scrollContent: { padding: 18, paddingBottom: 32 },

  netPositionCard: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  netWorthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  netAmount: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.3,
    fontVariant: ["tabular-nums"],
    marginVertical: 4,
  },
  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  liveBadge: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  greenDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: "600" },
  heroMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  heroMetricItem: { flex: 1 },
  heroMetricDivider: { width: 1, height: 26, marginHorizontal: 14 },
  heroMetricLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  heroMetricValue: {
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  quickActionTile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  quickActionLabelPrimary: {
    color: "#09090F",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },
  quickActionLabel: { fontSize: 10, fontWeight: "700", marginTop: 3 },

  moduleSummaryCard: {
    width: 148,
    borderRadius: 14,
    padding: 13,
    marginRight: 10,
    borderWidth: 1,
  },
  moduleSummaryTitle: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  moduleSummaryCount: { fontSize: 15, fontWeight: "900", marginBottom: 2 },
  moduleSummaryHint: { fontSize: 10 },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", letterSpacing: 0.2 },
  actionLink: { fontSize: 12, fontWeight: "700" },
  screenHeaderBlock: { marginBottom: 14 },
  screenMainTitle: { fontSize: 20, fontWeight: "900", marginBottom: 3 },
  screenSubTitle: { fontSize: 12, lineHeight: 17 },

  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
  },
  accountBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 12,
  },
  accName: { fontSize: 14, fontWeight: "700" },
  accTypePill: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  accType: { fontSize: 8.5, fontWeight: "800", letterSpacing: 0.5 },
  accSub: { fontSize: 11, marginTop: 2 },
  accBalance: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  txCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  txRowTop: { flexDirection: "row", alignItems: "center" },
  txTypeIndicator: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 11,
  },
  txTypeGlyph: { fontSize: 15, fontWeight: "900" },
  txTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  txSub: { fontSize: 11 },
  txAmount: { fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] },
  txExpandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  txDetailGrid: { flexDirection: "row", justifyContent: "space-between" },
  txDetailLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  txDetailValue: { fontSize: 12, fontWeight: "700" },
  txDetailMemo: { fontSize: 12, marginBottom: 12 },
  txActionRow: { flexDirection: "row", justifyContent: "flex-end" },
  txInlineBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  txInlineBtnText: { fontSize: 11, fontWeight: "700" },

  searchBarInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    borderWidth: 1,
    marginBottom: 10,
  },
  ledgerTypeRow: { flexDirection: "row", marginBottom: 12 },
  ledgerTypePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
  },
  ledgerTypeText: { fontSize: 11, fontWeight: "700" },

  insightComparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 12,
  },
  insightBigNumber: {
    fontSize: 17,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  dualBarTrack: {
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    overflow: "hidden",
  },
  categoryRankCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  categoryRankTitle: { fontSize: 13, fontWeight: "700" },
  categoryRankAmount: {
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },

  hubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  hubTile: {
    width: "48.5%",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  hubTileEmoji: { fontSize: 22, marginBottom: 8 },
  hubTileTitle: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  hubTileSub: { fontSize: 11 },

  emptyStateBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    marginVertical: 10,
  },
  emptyLogoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  emptyStateSub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 14,
  },
  emptyStateBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  emptyStateBtnText: { fontSize: 12, fontWeight: "800" },

  bottomNavContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 18 : 10,
    paddingHorizontal: 8,
  },
  bottomNavItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  bottomNavPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 3,
  },
  bottomNavLabel: { fontSize: 10 },

  statusBadge: {
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  payBillBtn: {
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  filterText: { fontSize: 12, fontWeight: "700" },

  drawerBackdrop: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.68)",
  },
  drawerContent: {
    width: 285,
    height: "100%",
    borderRightWidth: 1,
    padding: 22,
    position: "absolute",
    left: 0,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  drawerLogoImage: { width: 44, height: 44, borderRadius: 12, marginRight: 12 },
  drawerUserName: { fontSize: 15, fontWeight: "800" },
  drawerUserSub: {
    fontSize: 9.5,
    marginTop: 2,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  drawerDivider: { height: 1, marginBottom: 10 },
  drawerNavItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginBottom: 8,
    borderWidth: 1,
  },
  drawerNavText: { fontSize: 13, fontWeight: "700" },
  drawerSignOut: {
    padding: 13,
    borderRadius: 13,
    alignItems: "center",
    borderWidth: 1,
  },

  modernRangeBox: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  rangeTabsRow: {
    flexDirection: "row",
    marginBottom: 12,
    padding: 4,
    borderRadius: 11,
    borderWidth: 1,
  },
  rangeTabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },
  rangeTabText: { fontSize: 12, fontWeight: "600" },
  rangeTabTextActive: { color: "#09090F", fontWeight: "800" },
  rangeSubLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 4,
  },

  undoContainer: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  undoBanner: {
    padding: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  undoText: { fontSize: 12, fontWeight: "600" },
  undoBtnText: { fontSize: 12, fontWeight: "800" },
  undoProgressBar: { height: 3 },

  addButton: { borderRadius: 13, padding: 14, alignItems: "center" },
  addButtonText: { color: "#09090F", fontSize: 13, fontWeight: "800" },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 11,
  },
  clientName: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  clientCompany: { fontSize: 11, fontWeight: "700" },
  clientMeta: { fontSize: 11 },
  editText: { fontSize: 11, fontWeight: "700" },
  deleteText: { fontSize: 11, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", marginBottom: 14 },
  input: {
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1,
    fontSize: 13,
  },
  labelSub: { fontSize: 11.5, fontWeight: "700", marginBottom: 6 },
  toggleRow: { flexDirection: "row", marginBottom: 12 },
  toggleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 6,
  },
  toggleInActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  toggleOutActive: { backgroundColor: "#F43F5E", borderColor: "#F43F5E" },
  toggleText: { fontSize: 11, fontWeight: "700" },
  toggleTextActive: { color: "#09090F", fontWeight: "800" },

  pillChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
  },
  pillChipText: { fontSize: 11, fontWeight: "600" },
  pillChipTextActive: { color: "#09090F", fontWeight: "800" },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  cancelBtn: { marginRight: 8, borderWidth: 1 },
  cancelBtnText: { fontWeight: "700", fontSize: 13 },
  saveBtn: {},
  saveBtnText: { color: "#09090F", fontWeight: "800", fontSize: 13 },
  themeGearIcon: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
});
