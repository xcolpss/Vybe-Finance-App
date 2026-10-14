import React, { useState, useEffect, useRef } from "react";
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
  Dimensions,
  Share,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as LocalAuthentication from "expo-local-authentication";
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
  getInvoiceHistory,
  saveInvoiceHistory,
  getLiveRate,
  fetchLiveExchangeRates,
  exportTransactionsCSV,
  exportFullBackupJSON,
  restoreFullBackupJSON,
} from "./src/db/database";

const screenWidth = Dimensions.get("window").width;

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
].sort((a, b) => a.code.localeCompare(b.code));

const COLOR_SPECTRUM = [
  "#8279FF",
  "#48D5AE",
  "#54A9FF",
  "#FF778F",
  "#F1C40F",
  "#FF5733",
  "#9b59b6",
  "#3498db",
  "#1abc9c",
  "#e67e22",
  "#e74c3c",
];

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

  // Navigation Tab State (5 Tabs)
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "bills" | "budgets" | "goals" | "debts"
  >("dashboard");

  // Theme & Security State
  const [auraColor, setAuraColor] = useState("#8279FF");
  const [themeModal, setThemeModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Modals & Menus
  const [onboardingModal, setOnboardingModal] = useState(false);
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

  // Invoice Generator & History State
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
  const [currencySearchQuery, setCurrencySearchQuery] = useState("");
  const [baseCurrencyChoice, setBaseCurrencyChoice] = useState("PKR");

  // Privacy & Undo State
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [undoAction, setUndoAction] = useState<{
    message: string;
    undoFn: () => void;
  } | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);

  // Filters & Ranges
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<
    number | null
  >(null);
  const [timeFilter, setTimeFilter] = useState<
    "all" | "week" | "month" | "last_month" | "year" | "custom"
  >("all");
  const [rangeTab, setRangeTab] = useState<"start" | "end">("start");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  // Export Range
  const [exportRangeTab, setExportRangeTab] = useState<"start" | "end">(
    "start",
  );
  const [exportStartDate, setExportStartDate] = useState("2026-10-01");
  const [exportEndDate, setExportEndDate] = useState("2026-10-31");

  // Goal Date Picker State
  const [goalYear, setGoalYear] = useState("2026");
  const [goalMonth, setGoalMonth] = useState("12");
  const [goalDay, setGoalDay] = useState("31");

  // Debt Date Picker State
  const [debtYear, setDebtYear] = useState("2026");
  const [debtMonth, setDebtMonth] = useState("12");
  const [debtDay, setDebtDay] = useState("31");

  const [editingClient, setEditingClient] = useState<any>(null);
  const [editingTx, setEditingTx] = useState<any>(null);

  // Transaction form
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

  // Account form
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("wallet");
  const [accBalance, setAccBalance] = useState("");

  // Client form
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientCountry, setClientCountry] = useState("");
  const [clientCategory, setClientCategory] = useState("Upwork");

  // Recurring Bill form
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billCategory, setBillCategory] = useState("Software & Subscriptions");
  const [billAccountId, setBillAccountId] = useState(1);
  const [billDueDay, setBillDueDay] = useState("1");

  // Category & Budget form
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"in" | "out">("out");
  const [budgetCategory, setBudgetCategory] = useState("Groceries & Food");
  const [budgetLimitInput, setBudgetLimitInput] = useState("");

  // Savings Goal Form State
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalFundInput, setGoalFundInput] = useState("");
  const [fundingAccountId, setFundingAccountId] = useState<number>(1);

  // Debt Form State
  const [debtTitle, setDebtTitle] = useState("");
  const [debtType, setDebtType] = useState<"lent" | "borrowed">("lent");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtAccountId, setDebtAccountId] = useState<number>(1);

  // Animation values
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const auraGlowAnim = useRef(new Animated.Value(0.5)).current;
  const undoProgressAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;
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

  const allExpenseCategories = Array.from(
    new Set([
      ...defaultExpenseCategories,
      ...customCategories.filter((c) => c.type === "out").map((c) => c.name),
    ]),
  );
  const allIncomeCategories = Array.from(
    new Set([
      ...defaultIncomeCategories,
      ...customCategories.filter((c) => c.type === "in").map((c) => c.name),
    ]),
  );

  useEffect(() => {
    initDatabase();
    loadData();
    startAuraAmbientGlow();

    const savedTheme = getAuraTheme();
    if (savedTheme) {
      setAuraColor(savedTheme);
    }

    const baseCur = getBaseCurrency();
    if (!baseCur) {
      setOnboardingModal(true);
    } else {
      setCurrency(baseCur);
    }
  }, []);

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

  const startAuraAmbientGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(auraGlowAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(auraGlowAnim, {
          toValue: 0.45,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const triggerAuraSurge = () => {
    Animated.sequence([
      Animated.timing(auraGlowAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(auraGlowAnim, {
        toValue: 0.55,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const changeAuraTheme = (hex: string) => {
    setAuraColor(hex);
    setAuraTheme(hex);
    triggerAuraSurge();
  };

  const pickRandomTheme = () => {
    const randomHex =
      COLOR_SPECTRUM[Math.floor(Math.random() * COLOR_SPECTRUM.length)];
    changeAuraTheme(randomHex);
  };

  const handleTabChange = (
    tab: "dashboard" | "bills" | "budgets" | "goals" | "debts",
    index: number,
  ) => {
    triggerAuraSurge();
    setActiveTab(tab);

    Animated.spring(tabSlideAnim, {
      toValue: (index * (screenWidth - 56)) / 5,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const handleAccountPressIn = (id: number) => {
    triggerAuraSurge();
    if (accountScaleAnims[id]) {
      Animated.spring(accountScaleAnims[id], {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleAccountPressOut = (id: number) => {
    if (accountScaleAnims[id]) {
      Animated.spring(accountScaleAnims[id], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  };

  const openMenu = () => {
    setMenuModal(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setMenuModal(false));
  };

  const triggerCelebration = () => {
    triggerAuraSurge();
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.06,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerVictoryCelebration = (title: string) => {
    triggerAuraSurge();
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
          message: `Insufficient balance in "${sourceAcc.name}". Current balance is PKR ${sourceAcc.balance.toLocaleString()}, but you tried to send/spend PKR ${finalPKRAmount.toLocaleString()}.`,
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

  // Robust Writable DocumentDirectory PDF Invoice Engine
  const generateAndDownloadPDFInvoice = async () => {
    if (!invoiceClient) {
      setErrorModal({
        visible: true,
        message: "Please select a client for the invoice.",
      });
      return;
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
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${idx + 1}. ${item.desc || "Service Item"}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">PKR ${p.toLocaleString()}</td>
          </tr>
        `;
      });
    } else {
      totalCalculated = parseFloat(invoiceItems[0]?.price) || 0;
      itemsHTML = `
        <tr>
          <td colspan="2" style="padding: 12px; border-bottom: 1px solid #ddd;">${invoiceNotes || invoiceItems[0]?.desc || "Professional Services Rendered"}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; padding: 30px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${auraColor}; padding-bottom: 20px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: ${auraColor}; }
          .meta { font-size: 12px; color: #555; text-align: right; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f4f5fa; padding: 10px; text-align: left; font-size: 12px; color: #444; }
          .total-box { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; color: #111; background: #f4f5fa; padding: 15px; border-radius: 8px; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${invoiceHeading}</div>
            <div style="font-size: 11px; color: #778; margin-top: 4px;">VYBE Finance Aura Engine</div>
          </div>
          <div class="meta">
            <div><strong>Date:</strong> ${dateStr}</div>
            <div><strong>Time:</strong> ${timeStr}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Client Details</div>
          <div><strong>Name:</strong> ${invoiceClient.name}</div>
          <div><strong>Company:</strong> ${invoiceClient.company} (${invoiceClient.country})</div>
          <div><strong>Category:</strong> ${invoiceClient.category}</div>
        </div>

        <div class="section">
          <div class="section-title">Payment Account / Routing</div>
          <div><strong>Bank/Wallet:</strong> ${bankAcc?.name || "Main Wallet"} (${bankAcc?.type || "wallet"})</div>
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
          Generated securely via VYBE Finance • Certified Digital Statement
        </div>
      </body>
      </html>
    `;

    try {
      saveInvoiceHistory(
        invoiceClient.name,
        invoiceHeading,
        totalCalculated,
        htmlContent,
      );
      loadData();

      if (Platform.OS === "web") {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        } else {
          await Print.printAsync({ html: htmlContent });
        }
      } else {
        const file = await Print.printToFileAsync({
          html: htmlContent,
          base64: true,
        });
        const fileName = `Invoice_${invoiceClient.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
        const permanentUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(permanentUri, file.base64 || "", {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(permanentUri, {
            mimeType: "application/pdf",
            dialogTitle: "Download & Share PDF Invoice",
          });
        } else {
          await Share.share({ message: `PDF generated at: ${permanentUri}` });
        }
      }

      setInvoiceModal(false);
    } catch (e) {
      console.log("PDF generation error:", e);
      setErrorModal({
        visible: true,
        message: "Failed to generate PDF invoice.",
      });
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

  // JSON Backup Upload & Restore
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
      console.log("Upload backup error:", e);
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

  const totalNetWorth = accounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0,
  );

  const categoryTotals: { [key: string]: number } = {};
  transactions
    .filter(
      (t: any) =>
        t.type === "out" &&
        t.date.startsWith(new Date().toISOString().slice(0, 7)),
    )
    .forEach((t: any) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const filteredTransactions = transactions.filter((t: any) => {
    if (
      selectedAccountFilter &&
      Number(t.account_id) !== Number(selectedAccountFilter) &&
      Number(t.dest_account_id) !== Number(selectedAccountFilter)
    ) {
      return false;
    }
    const today = new Date().toISOString().split("T")[0];
    const txDate = t.date;

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

  const filteredCurrencies = WORLD_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(currencySearchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#07080A" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[
                styles.hamburgerBtn,
                { borderColor: `${auraColor}60`, shadowColor: auraColor },
              ]}
              onPress={openMenu}
              activeOpacity={0.8}
            >
              <View
                style={[styles.hamburgerLine, { backgroundColor: auraColor }]}
              />
              <View
                style={[styles.hamburgerLine, { backgroundColor: auraColor }]}
              />
              <View
                style={[styles.hamburgerLine, { backgroundColor: auraColor }]}
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.brandTitle}>VYBE FINANCE</Text>
              <Text style={[styles.brandSubtitle, { color: auraColor }]}>
                AURA LIQUID ENGINE
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.catConfigBtn,
                { borderColor: auraColor, backgroundColor: `${auraColor}20` },
              ]}
              onPress={() => {
                triggerAuraSurge();
                setThemeModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.themeGearIcon, { borderColor: auraColor }]}>
                <View
                  style={[styles.gearInnerDot, { backgroundColor: auraColor }]}
                />
              </View>
              <Text
                style={{
                  color: auraColor,
                  fontSize: 11,
                  fontWeight: "700",
                  marginLeft: 6,
                }}
              >
                Theme
              </Text>
            </TouchableOpacity>
          </View>

          {/* Total Net Position Card with Aura Lighting Glow */}
          <Animated.View
            style={[
              styles.netPositionCard,
              {
                borderColor: `${auraColor}50`,
                transform: [{ scale: pulseAnim }],
                shadowOpacity: auraGlowAnim,
                shadowColor: auraColor,
              },
            ]}
          >
            <Text style={styles.cardLabel}>TOTAL NET POSITION</Text>
            <View style={styles.amountRow}>
              <Text style={styles.netAmount}>
                {isPrivacyMode
                  ? "••••••••••"
                  : `PKR ${totalNetWorth.toLocaleString()}`}
              </Text>
              <TouchableOpacity
                style={[styles.eyeButton, { borderColor: `${auraColor}50` }]}
                onPress={() => {
                  triggerAuraSurge();
                  setIsPrivacyMode(!isPrivacyMode);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.eyeIconText}>
                  {isPrivacyMode ? "👁️‍🗨️" : "👁️"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.liveBadge}>
              <View
                style={[
                  styles.greenDot,
                  { backgroundColor: auraColor, shadowColor: auraColor },
                ]}
              />
              <Text style={[styles.liveText, { color: auraColor }]}>
                Live Aura Security Active
              </Text>
            </View>
          </Animated.View>

          {/* Undo Toast */}
          {undoAction && (
            <View
              style={[
                styles.undoContainer,
                { borderColor: auraColor, shadowColor: auraColor },
              ]}
            >
              <View style={styles.undoBanner}>
                <Text style={styles.undoText}>{undoAction.message}</Text>
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

          {/* FLUID LIQUID GLASS NAVIGATION TABS (5 Tabs) */}
          <View
            style={[
              styles.mainNavTabs,
              { borderColor: `${auraColor}40`, shadowColor: auraColor },
            ]}
          >
            <Animated.View
              style={[
                styles.slidingGlassIndicator,
                {
                  backgroundColor: auraColor,
                  shadowColor: auraColor,
                  transform: [{ translateX: tabSlideAnim }],
                },
              ]}
            />
            <TouchableOpacity
              style={styles.mainNavTabBtn}
              onPress={() => handleTabChange("dashboard", 0)}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.mainNavTabText,
                  activeTab === "dashboard" && styles.mainNavTabTextActive,
                ]}
              >
                Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainNavTabBtn}
              onPress={() => handleTabChange("bills", 1)}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.mainNavTabText,
                  activeTab === "bills" && styles.mainNavTabTextActive,
                ]}
              >
                Bills
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainNavTabBtn}
              onPress={() => handleTabChange("budgets", 2)}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.mainNavTabText,
                  activeTab === "budgets" && styles.mainNavTabTextActive,
                ]}
              >
                Budgets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainNavTabBtn}
              onPress={() => handleTabChange("goals", 3)}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.mainNavTabText,
                  activeTab === "goals" && styles.mainNavTabTextActive,
                ]}
              >
                Goals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainNavTabBtn}
              onPress={() => handleTabChange("debts", 4)}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.mainNavTabText,
                  activeTab === "debts" && styles.mainNavTabTextActive,
                ]}
              >
                Debts
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === "dashboard" && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Accounts & Wallets</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerAuraSurge();
                    setAccountModal(true);
                  }}
                >
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    + Add Account
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
                    Filtering by Account. Tap here to clear.
                  </Text>
                </TouchableOpacity>
              )}

              {accounts.map((acc) => {
                const anim = accountScaleAnims[acc.id] || new Animated.Value(1);
                return (
                  <Animated.View
                    key={acc.id}
                    style={{ transform: [{ scale: anim }] }}
                  >
                    <TouchableOpacity
                      activeOpacity={1}
                      onPressIn={() => handleAccountPressIn(acc.id)}
                      onPressOut={() => handleAccountPressOut(acc.id)}
                      onPress={() =>
                        setSelectedAccountFilter(
                          selectedAccountFilter === acc.id ? null : acc.id,
                        )
                      }
                      style={[
                        styles.accountCard,
                        selectedAccountFilter === acc.id && {
                          borderColor: auraColor,
                          backgroundColor: "rgba(30, 34, 53, 0.9)",
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.accName}>
                          {acc.name}{" "}
                          <Text style={styles.accType}>({acc.type})</Text>
                        </Text>
                        <Text style={styles.accSub}>
                          Currency: {acc.currency}
                        </Text>
                      </View>
                      <Text style={[styles.accBalance, { marginRight: 12 }]}>
                        {isPrivacyMode
                          ? "••••••"
                          : `PKR ${acc.balance.toLocaleString()}`}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          triggerAuraSurge();
                          setConfirmModal({
                            visible: true,
                            title: "Delete Account?",
                            message: `Remove "${acc.name}"?`,
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
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: auraColor,
                      flex: 1,
                      marginRight: 6,
                      shadowColor: auraColor,
                    },
                  ]}
                  onPress={() => {
                    triggerAuraSurge();
                    setEditingTx(null);
                    setTxModal(true);
                  }}
                >
                  <Text style={styles.addButtonText}>+ Add Transaction</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    {
                      flex: 1,
                      marginLeft: 6,
                      backgroundColor: "rgba(26,29,41,0.6)",
                      borderWidth: 1,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => {
                    triggerAuraSurge();
                    setEditingClient(null);
                    setClientModal(true);
                  }}
                >
                  <Text style={[styles.addButtonText, { color: auraColor }]}>
                    + Add Client
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Time Period Filters */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Ledger Activity (Tap any record to inspect)
                </Text>
              </View>
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
                      timeFilter === f.key && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => {
                      triggerAuraSurge();
                      setTimeFilter(f.key as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        timeFilter === f.key && styles.pillChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Modern Minimal Range Selector */}
              {timeFilter === "custom" && (
                <View
                  style={[
                    styles.modernRangeBox,
                    { borderColor: `${auraColor}40` },
                  ]}
                >
                  <View style={styles.rangeTabsRow}>
                    <TouchableOpacity
                      style={[
                        styles.rangeTabBtn,
                        rangeTab === "start" && {
                          backgroundColor: auraColor,
                          shadowColor: auraColor,
                        },
                      ]}
                      onPress={() => setRangeTab("start")}
                    >
                      <Text
                        style={[
                          styles.rangeTabText,
                          rangeTab === "start" && styles.rangeTabTextActive,
                        ]}
                      >
                        From: {startDate}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.rangeTabBtn,
                        rangeTab === "end" && {
                          backgroundColor: auraColor,
                          shadowColor: auraColor,
                        },
                      ]}
                      onPress={() => setRangeTab("end")}
                    >
                      <Text
                        style={[
                          styles.rangeTabText,
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

              {filteredTransactions.map((tx: any) => {
                const isExpanded = expandedTxId === tx.id;
                const srcAcc = accounts.find((a) => a.id === tx.account_id);
                const dstAcc = accounts.find(
                  (a) => a.id === tx.dest_account_id,
                );

                return (
                  <TouchableOpacity
                    key={tx.id}
                    activeOpacity={0.9}
                    onPress={() => setExpandedTxId(isExpanded ? null : tx.id)}
                    style={[
                      styles.txCard,
                      isExpanded && {
                        borderColor: auraColor,
                        backgroundColor: "rgba(26,29,41,0.9)",
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
                        <Text style={styles.txTitle}>
                          {tx.description || tx.category}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              marginLeft: 8,
                              backgroundColor:
                                tx.type === "in"
                                  ? "rgba(72,213,174,0.15)"
                                  : tx.type === "transfer"
                                    ? `${auraColor}25`
                                    : "rgba(255,119,143,0.15)",
                              borderColor:
                                tx.type === "in"
                                  ? "#48D5AE"
                                  : tx.type === "transfer"
                                    ? auraColor
                                    : "#FF778F",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  tx.type === "in"
                                    ? "#48D5AE"
                                    : tx.type === "transfer"
                                      ? auraColor
                                      : "#FF778F",
                              },
                            ]}
                          >
                            {tx.type === "in"
                              ? "INFLOW"
                              : tx.type === "transfer"
                                ? "TRANSFER"
                                : "OUTFLOW"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.txSub}>
                        {tx.category} • {tx.date}
                      </Text>

                      {isExpanded && (
                        <View
                          style={{
                            marginTop: 10,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: "rgba(255,255,255,0.08)",
                          }}
                        >
                          <Text
                            style={{
                              color: "#F5F6FF",
                              fontSize: 12,
                              marginBottom: 4,
                            }}
                          >
                            🏦 Bank / Wallet Used:{" "}
                            <Text
                              style={{ color: auraColor, fontWeight: "bold" }}
                            >
                              {srcAcc?.name || "Main Wallet"}
                            </Text>
                            {dstAcc ? ` ➔ ${dstAcc.name}` : ""}
                          </Text>
                          <Text
                            style={{
                              color: "#A7ADC0",
                              fontSize: 11,
                              marginBottom: 6,
                            }}
                          >
                            📝 Description / Memo:{" "}
                            {tx.description || "No memo provided."}
                          </Text>
                          <Text style={{ color: "#48D5AE", fontSize: 11 }}>
                            💱 Conversion Rate: 1{" "}
                            {tx.original_currency || "PKR"} ={" "}
                            {tx.exchange_rate || 1.0} PKR
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={{ alignItems: "flex-end", marginRight: 12 }}>
                      <Text
                        style={[
                          styles.txAmount,
                          tx.type === "in"
                            ? styles.greenText
                            : tx.type === "transfer"
                              ? { color: auraColor }
                              : styles.redText,
                        ]}
                      >
                        {tx.type === "in"
                          ? "+"
                          : tx.type === "transfer"
                            ? "⇄ "
                            : "-"}
                        {isPrivacyMode
                          ? "••••"
                          : tx.original_currency &&
                              tx.original_currency !== "PKR"
                            ? `$${tx.original_amount} ${tx.original_currency}`
                            : `PKR ${tx.amount}`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        triggerAuraSurge();
                        setEditingTx(tx);
                        setDescription(tx.description);
                        setCategory(tx.category);
                        setAmountInput(tx.amount.toString());
                        setTxType(tx.type);
                        setTxModal(true);
                      }}
                      style={{ marginRight: 10 }}
                    >
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        triggerAuraSurge();
                        setConfirmModal({
                          visible: true,
                          title: "Delete Transaction?",
                          message: `Remove this record?`,
                          onConfirm: () => {
                            const removed = deleteTransaction(tx.id);
                            loadData();
                            triggerUndo(`Deleted transaction`, () =>
                              restoreTransaction(removed),
                            );
                          },
                        });
                      }}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}

              {/* Clients & Counterparties */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Clients & Counterparties
                </Text>
              </View>
              {clients.map((c) => (
                <View key={c.id} style={styles.clientCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>
                      {c.name}{" "}
                      <Text
                        style={[styles.clientCompany, { color: auraColor }]}
                      >
                        ({c.category})
                      </Text>
                    </Text>
                    <Text style={styles.clientMeta}>{c.country}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      triggerAuraSurge();
                      setEditingClient(c);
                      setClientName(c.name);
                      setClientCompany(c.company);
                      setClientCountry(c.country);
                      setClientModal(true);
                    }}
                    style={{ marginRight: 12 }}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      triggerAuraSurge();
                      setConfirmModal({
                        visible: true,
                        title: "Delete Client?",
                        message: `Remove client "${c.name}"?`,
                        onConfirm: () => {
                          const removed = deleteClient(c.id);
                          loadData();
                          triggerUndo(`Deleted client`, () =>
                            restoreClient(removed),
                          );
                        },
                      });
                    }}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* ================= TAB 2: RECURRING BILLS ================= */}
          {activeTab === "bills" && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.sectionTitle}>
                Automated Subscriptions & Bills
              </Text>
              <Text
                style={{ color: "#A7ADC0", fontSize: 12, marginBottom: 16 }}
              >
                Manage your monthly overheads and trigger instant one-tap
                payments with live aura feedback.
              </Text>

              <View
                style={[
                  styles.modernRangeBox,
                  { borderColor: `${auraColor}40` },
                ]}
              >
                <Text style={styles.sectionTitle}>+ Register New Bill</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bill Name (e.g. Netflix, Rent, VPN)"
                  placeholderTextColor="#A7ADC0"
                  value={billName}
                  onChangeText={setBillName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Monthly Amount (PKR)"
                  placeholderTextColor="#A7ADC0"
                  keyboardType="numeric"
                  value={billAmount}
                  onChangeText={(t) => setBillAmount(t.replace(/[^0-9.]/g, ""))}
                />

                <Text style={styles.labelSub}>Due Day of Month (1-31):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15"
                  placeholderTextColor="#A7ADC0"
                  keyboardType="numeric"
                  value={billDueDay}
                  onChangeText={(t) => setBillDueDay(t.replace(/[^0-9]/g, ""))}
                />

                <Text style={styles.labelSub}>Pay From Account:</Text>
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
                          billAccountId === acc.id && styles.pillChipTextActive,
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
                  <Text style={styles.addButtonText}>Save Recurring Bill</Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.sectionTitle,
                  { marginTop: 10, marginBottom: 10 },
                ]}
              >
                Active Subscriptions ({recurringBills.length})
              </Text>
              {recurringBills.length === 0 ? (
                <Text
                  style={{
                    color: "#A7ADC0",
                    fontSize: 13,
                    textAlign: "center",
                    marginVertical: 30,
                  }}
                >
                  No recurring bills registered yet.
                </Text>
              ) : (
                recurringBills.map((b: any) => {
                  const currentDayNum = new Date().getDate();
                  const isDueSoon = Math.abs(b.due_day - currentDayNum) <= 3;
                  const acc = accounts.find((a) => a.id === b.account_id);
                  return (
                    <View
                      key={b.id}
                      style={[
                        styles.clientCard,
                        isDueSoon && {
                          borderColor: "#FF778F",
                          backgroundColor: "rgba(255, 119, 143, 0.08)",
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
                          <Text style={styles.clientName}>{b.name}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                marginLeft: 8,
                                backgroundColor: isDueSoon
                                  ? "rgba(255,119,143,0.15)"
                                  : `${auraColor}20`,
                                borderColor: isDueSoon ? "#FF778F" : auraColor,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: isDueSoon ? "#FF778F" : auraColor },
                              ]}
                            >
                              Due Day {b.due_day}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            color: "#FF778F",
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
                            shadowColor: auraColor,
                            marginRight: 10,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                          },
                        ]}
                        onPress={() => payRecurringBillNow(b)}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: "bold",
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
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ================= TAB 3: BUDGETS ================= */}
          {activeTab === "budgets" && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.sectionTitle}>Monthly Budget Guardrails</Text>
              <Text
                style={{ color: "#A7ADC0", fontSize: 12, marginBottom: 16 }}
              >
                Set monthly spending limits per category. Aura glowing bars warn
                you as you approach limits.
              </Text>

              <View
                style={[
                  styles.modernRangeBox,
                  { borderColor: `${auraColor}40` },
                ]}
              >
                <Text style={styles.sectionTitle}>
                  Set Category Monthly Limit
                </Text>

                <Text style={styles.labelSub}>Select Category:</Text>
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
                          budgetCategory === cat && styles.pillChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={styles.input}
                  placeholder="Monthly Limit (PKR)"
                  placeholderTextColor="#A7ADC0"
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
                  <Text style={styles.addButtonText}>Save Budget Limit</Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.sectionTitle,
                  { marginTop: 10, marginBottom: 10 },
                ]}
              >
                Active Budgets & Progress
              </Text>
              {budgets.length === 0 ? (
                <Text
                  style={{
                    color: "#A7ADC0",
                    fontSize: 13,
                    textAlign: "center",
                    marginVertical: 30,
                  }}
                >
                  No budget limits configured yet.
                </Text>
              ) : (
                budgets.map((b: any) => {
                  const spent = categoryTotals[b.category] || 0;
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
                        isExceeded && {
                          borderColor: "#FF778F",
                          backgroundColor: "rgba(255,119,143,0.06)",
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
                            color: "#F5F6FF",
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {b.category}
                        </Text>
                        <Text
                          style={{
                            color: isExceeded
                              ? "#FF778F"
                              : isWarning
                                ? "#F1C40F"
                                : "#48D5AE",
                            fontSize: 13,
                            fontWeight: "bold",
                          }}
                        >
                          PKR {spent.toLocaleString()} /{" "}
                          {b.monthly_limit.toLocaleString()} ({ratio}%)
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 10,
                          backgroundColor: "#12151D",
                          borderRadius: 5,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${ratio}%`,
                            height: "100%",
                            backgroundColor: isExceeded
                              ? "#FF778F"
                              : isWarning
                                ? "#F1C40F"
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
                        <Text style={styles.deleteText}>Remove Budget</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ================= TAB 4: GOALS ================= */}
          {activeTab === "goals" && (
            <View style={{ marginTop: 6 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Automated Savings Goals</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerAuraSurge();
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
                style={{ color: "#A7ADC0", fontSize: 12, marginBottom: 16 }}
              >
                Set target amounts and deadlines. The engine automatically
                calculates your daily required savings run-rate.
              </Text>

              {savingsGoals.length === 0 ? (
                <Text
                  style={{
                    color: "#A7ADC0",
                    fontSize: 13,
                    textAlign: "center",
                    marginVertical: 30,
                  }}
                >
                  No savings goals created yet.
                </Text>
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
                        g.completed === 1 && {
                          borderColor: "#48D5AE",
                          backgroundColor: "rgba(72,213,174,0.06)",
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
                            color: "#F5F6FF",
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
                                ? "rgba(72,213,174,0.15)"
                                : `${auraColor}20`,
                              borderColor: g.completed ? "#48D5AE" : auraColor,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: g.completed ? "#48D5AE" : auraColor },
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
                          color: "#48D5AE",
                          fontSize: 14,
                          fontWeight: "bold",
                          marginBottom: 6,
                        }}
                      >
                        PKR {g.current_amount.toLocaleString()} /{" "}
                        {g.target_amount.toLocaleString()} ({progress}%)
                      </Text>

                      <View
                        style={{
                          height: 10,
                          backgroundColor: "#12151D",
                          borderRadius: 5,
                          overflow: "hidden",
                          marginBottom: 10,
                        }}
                      >
                        <View
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            backgroundColor: g.completed
                              ? "#48D5AE"
                              : auraColor,
                            borderRadius: 5,
                          }}
                        />
                      </View>

                      {!g.completed && (
                        <Text
                          style={{
                            color: "#A7ADC0",
                            fontSize: 11,
                            marginBottom: 12,
                          }}
                        >
                          💡 Save{" "}
                          <Text
                            style={{ color: "#F5F6FF", fontWeight: "bold" }}
                          >
                            PKR {dailyNeeded.toLocaleString()}
                          </Text>{" "}
                          every day to hit your goal on time! (Target Date:{" "}
                          {g.target_date})
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
                              backgroundColor: "#54A9FF",
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
                              color: "#FFFFFF",
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
                                shadowColor: auraColor,
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
                                color: "#FFFFFF",
                                fontSize: 11,
                                fontWeight: "bold",
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
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ================= TAB 5: DEBTS & LOANS ================= */}
          {activeTab === "debts" && (
            <View style={{ marginTop: 6 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Smart Debt & Loan Tracker
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerAuraSurge();
                    setDebtModal(true);
                  }}
                >
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    + Track Loan / Debt
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={{ color: "#A7ADC0", fontSize: 12, marginBottom: 16 }}
              >
                Manage money lent out and debts owed. Automatically updates your
                bank accounts when settled or issued.
              </Text>

              {debts.length === 0 ? (
                <Text
                  style={{
                    color: "#A7ADC0",
                    fontSize: 13,
                    textAlign: "center",
                    marginVertical: 30,
                  }}
                >
                  No active loans or debts tracked.
                </Text>
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
                        isSettled && {
                          borderColor: "#48D5AE",
                          backgroundColor: "rgba(72,213,174,0.06)",
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
                            color: "#F5F6FF",
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
                                ? "rgba(72,213,174,0.15)"
                                : isLent
                                  ? `${auraColor}20`
                                  : "rgba(255,119,143,0.15)",
                              borderColor: isSettled
                                ? "#48D5AE"
                                : isLent
                                  ? auraColor
                                  : "#FF778F",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color: isSettled
                                  ? "#48D5AE"
                                  : isLent
                                    ? auraColor
                                    : "#FF778F",
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
                          color: isLent ? "#48D5AE" : "#FF778F",
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
                          color: "#A7ADC0",
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
                                shadowColor: auraColor,
                                paddingVertical: 8,
                                paddingHorizontal: 14,
                                marginRight: 8,
                              },
                            ]}
                            onPress={() => handleSettleDebt(d)}
                          >
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 11,
                                fontWeight: "bold",
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
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* First-Time Currency Onboarding Modal */}
      <Modal visible={onboardingModal} animationType="fade" transparent={true}>
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(7,8,10,0.92)" },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { alignItems: "center", paddingVertical: 32 },
            ]}
          >
            <Text
              style={[styles.modalTitle, { fontSize: 22, textAlign: "center" }]}
            >
              Welcome to VYBE Finance
            </Text>
            <Text
              style={{
                color: "#A7ADC0",
                fontSize: 13,
                textAlign: "center",
                marginBottom: 24,
                lineHeight: 18,
              }}
            >
              Please select your primary base currency to initialize your
              financial engine.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 24 }}
            >
              {["PKR", "USD", "EUR", "GBP", "AED", "CAD", "AUD", "SAR"].map(
                (cur) => (
                  <TouchableOpacity
                    key={cur}
                    style={[
                      styles.pillChip,
                      baseCurrencyChoice === cur && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                      { paddingVertical: 12, paddingHorizontal: 18 },
                    ]}
                    onPress={() => setBaseCurrencyChoice(cur)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        baseCurrencyChoice === cur && styles.pillChipTextActive,
                        { fontSize: 14 },
                      ]}
                    >
                      {cur}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: auraColor,
                  shadowColor: auraColor,
                  width: "100%",
                  padding: 16,
                  borderRadius: 14,
                  alignItems: "center",
                },
              ]}
              onPress={completeOnboarding}
            >
              <Text style={[styles.saveBtnText, { fontSize: 15 }]}>
                Initialize VYBE Engine 🚀
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Aura Theme Spectrum Modal */}
      <Modal visible={themeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { borderColor: `${auraColor}50` }]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={styles.modalTitle}>
                Aura Lighting & Color Spectrum
              </Text>
              <TouchableOpacity onPress={() => setThemeModal(false)}>
                <Text
                  style={{ color: auraColor, fontWeight: "bold", fontSize: 13 }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.labelSub}>Select from Color Spectrum:</Text>
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
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: hex,
                    margin: 6,
                    borderWidth: auraColor === hex ? 3 : 1,
                    borderColor: "#FFFFFF",
                    shadowColor: hex,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
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
                  shadowColor: auraColor,
                  padding: 16,
                  borderRadius: 14,
                  alignItems: "center",
                },
              ]}
              onPress={pickRandomTheme}
            >
              <Text
                style={{ color: "#07080A", fontWeight: "bold", fontSize: 14 }}
              >
                🎲 Pick Random Aura Theme
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Manager Modal */}
      <Modal visible={categoryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "90%", borderColor: `${auraColor}50` },
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
                <Text style={styles.modalTitle}>Category Manager</Text>
                <TouchableOpacity onPress={() => setCategoryModal(false)}>
                  <Text
                    style={{
                      color: auraColor,
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.labelSub}>Add Custom Category:</Text>
              <TextInput
                style={styles.input}
                placeholder="Category Name (e.g. Marketing, Coffee)"
                placeholderTextColor="#A7ADC0"
                value={newCatName}
                onChangeText={setNewCatName}
              />

              <Text style={styles.labelSub}>Category Type:</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    newCatType === "out" && styles.toggleOutActive,
                  ]}
                  onPress={() => setNewCatType("out")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      newCatType === "out" && styles.toggleTextActive,
                    ]}
                  >
                    Expense (Out)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    newCatType === "in" && styles.toggleInActive,
                  ]}
                  onPress={() => setNewCatType("in")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      newCatType === "in" && styles.toggleTextActive,
                    ]}
                  >
                    Income (In)
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: auraColor,
                    shadowColor: auraColor,
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    marginBottom: 20,
                  },
                ]}
                onPress={handleSaveCategory}
              >
                <Text style={styles.saveBtnText}>+ Save Custom Category</Text>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
                Custom Categories ({customCategories.length})
              </Text>
              {customCategories.length === 0 ? (
                <Text
                  style={{
                    color: "#A7ADC0",
                    fontSize: 13,
                    textAlign: "center",
                    marginVertical: 20,
                  }}
                >
                  No custom categories added yet.
                </Text>
              ) : (
                customCategories.map((c: any) => (
                  <View
                    key={c.id}
                    style={{
                      backgroundColor: "rgba(26,29,41,0.65)",
                      padding: 12,
                      borderRadius: 14,
                      marginBottom: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#F5F6FF",
                          fontSize: 13,
                          fontWeight: "700",
                        }}
                      >
                        {c.name}
                      </Text>
                      <Text
                        style={{
                          color: c.type === "in" ? "#48D5AE" : "#FF778F",
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        {c.type === "in" ? "Income" : "Expense"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        deleteCategory(c.id);
                        loadData();
                      }}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Global Currency Selector Modal */}
      <Modal visible={currencyModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "85%", borderColor: `${auraColor}50` },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={styles.modalTitle}>Add Global Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModal(false)}>
                <Text
                  style={{ color: auraColor, fontWeight: "bold", fontSize: 13 }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Search currency code or country..."
              placeholderTextColor="#A7ADC0"
              value={currencySearchQuery}
              onChangeText={setCurrencySearchQuery}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
            >
              {filteredCurrencies.map((c) => {
                const isAdded = userCurrencies.includes(c.code);
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={{
                      backgroundColor: "rgba(26,29,41,0.65)",
                      padding: 12,
                      borderRadius: 12,
                      marginBottom: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                    }}
                    onPress={() => {
                      addUserCurrency(c.code);
                      loadData();
                      setCurrency(c.code);
                      setCurrencyModal(false);
                    }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 12 }}>
                      {c.flag}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#F5F6FF",
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        {c.code} - {c.country}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: isAdded ? "#48D5AE" : auraColor,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {isAdded ? "Added ✓" : "+ Add"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Advanced PDF Invoice Generator Modal */}
      <Modal visible={invoiceModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "92%", borderColor: `${auraColor}50` },
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
                <Text style={styles.modalTitle}>
                  Professional PDF Invoice Generator
                </Text>
                <TouchableOpacity onPress={() => setInvoiceModal(false)}>
                  <Text
                    style={{
                      color: auraColor,
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.labelSub}>Invoice Heading / Title:</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. PROFESSIONAL SERVICE INVOICE"
                placeholderTextColor="#A7ADC0"
                value={invoiceHeading}
                onChangeText={setInvoiceHeading}
              />

              <Text style={styles.labelSub}>Select Client:</Text>
              {clients.length === 0 ? (
                <Text
                  style={{
                    color: "#A7ADC0",
                    fontSize: 12,
                    textAlign: "center",
                    marginVertical: 10,
                  }}
                >
                  No clients available. Add a client first.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 12 }}
                >
                  {clients.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.pillChip,
                        invoiceClient?.id === c.id && {
                          backgroundColor: auraColor,
                          borderColor: auraColor,
                        },
                      ]}
                      onPress={() => setInvoiceClient(c)}
                    >
                      <Text
                        style={[
                          styles.pillChipText,
                          invoiceClient?.id === c.id &&
                            styles.pillChipTextActive,
                        ]}
                      >
                        {c.name} ({c.company})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.labelSub}>
                Receiving Bank Account / Wallet:
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
                      invoiceAccountId === acc.id && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setInvoiceAccountId(acc.id)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        invoiceAccountId === acc.id &&
                          styles.pillChipTextActive,
                      ]}
                    >
                      {acc.name} (PKR {acc.balance.toLocaleString()})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.labelSub}>Invoice Format Style:</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    invoiceMode === "bullets" && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => setInvoiceMode("bullets")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      invoiceMode === "bullets" && {
                        color: "#07080A",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    Bullet Points (Detailed)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    invoiceMode === "notes" && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => setInvoiceMode("notes")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      invoiceMode === "notes" && {
                        color: "#07080A",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    Notes (Lump Sum)
                  </Text>
                </TouchableOpacity>
              </View>

              {invoiceMode === "bullets" ? (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.labelSub}>Work Items & Prices:</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setInvoiceItems([
                          ...invoiceItems,
                          { desc: "", price: "" },
                        ])
                      }
                    >
                      <Text style={[styles.actionLink, { color: auraColor }]}>
                        + Add Line Item
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {invoiceItems.map((item, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        marginBottom: 8,
                        alignItems: "center",
                      }}
                    >
                      <TextInput
                        style={[
                          styles.input,
                          { flex: 2, marginBottom: 0, marginRight: 6 },
                        ]}
                        placeholder={`Item ${idx + 1} description`}
                        placeholderTextColor="#A7ADC0"
                        value={item.desc}
                        onChangeText={(t) => {
                          const updated = [...invoiceItems];
                          updated[idx].desc = t;
                          setInvoiceItems(updated);
                        }}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          { flex: 1, marginBottom: 0, marginRight: 6 },
                        ]}
                        placeholder="Price (PKR)"
                        placeholderTextColor="#A7ADC0"
                        keyboardType="numeric"
                        value={item.price}
                        onChangeText={(t) => {
                          const updated = [...invoiceItems];
                          updated[idx].price = t.replace(/[^0-9.]/g, "");
                          setInvoiceItems(updated);
                        }}
                      />
                      {invoiceItems.length > 1 && (
                        <TouchableOpacity
                          onPress={() =>
                            setInvoiceItems(
                              invoiceItems.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <Text style={styles.deleteText}>X</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <>
                  <Text style={styles.labelSub}>
                    Detailed Notes & Scope of Work:
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { height: 80, textAlignVertical: "top" },
                    ]}
                    multiline
                    placeholder="Describe professional services rendered..."
                    placeholderTextColor="#A7ADC0"
                    value={invoiceNotes}
                    onChangeText={setInvoiceNotes}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Total Lump-Sum Amount (PKR)"
                    placeholderTextColor="#A7ADC0"
                    keyboardType="numeric"
                    value={invoiceItems[0]?.price || ""}
                    onChangeText={(t) =>
                      setInvoiceItems([
                        {
                          desc: invoiceNotes || "Services rendered",
                          price: t.replace(/[^0-9.]/g, ""),
                        },
                      ])
                    }
                  />
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: auraColor,
                    shadowColor: auraColor,
                    marginTop: 14,
                    padding: 16,
                    borderRadius: 14,
                    alignItems: "center",
                  },
                ]}
                onPress={generateAndDownloadPDFInvoice}
              >
                <Text style={[styles.saveBtnText, { fontSize: 14 }]}>
                  Download PDF Invoice 📄
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Invoice History Modal */}
      <Modal
        visible={invoiceHistoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "90%", borderColor: `${auraColor}50` },
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
                <Text style={styles.modalTitle}>
                  Recent Invoices (30-Day Storage)
                </Text>
                <TouchableOpacity onPress={() => setInvoiceHistoryModal(false)}>
                  <Text
                    style={{
                      color: auraColor,
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              {invoiceHistoryList.length === 0 ? (
                <Text
                  style={{
                    color: "#A7ADC0",
                    fontSize: 13,
                    textAlign: "center",
                    marginVertical: 30,
                  }}
                >
                  No generated invoices in the past 30 days.
                </Text>
              ) : (
                invoiceHistoryList.map((inv: any) => (
                  <View key={inv.id} style={styles.modernRangeBox}>
                    <Text
                      style={{
                        color: "#F5F6FF",
                        fontSize: 13,
                        fontWeight: "bold",
                        marginBottom: 2,
                      }}
                    >
                      {inv.heading}
                    </Text>
                    <Text
                      style={{
                        color: auraColor,
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      Client: {inv.client_name} • PKR{" "}
                      {inv.total_amount.toLocaleString()}
                    </Text>
                    <Text
                      style={{
                        color: "#A7ADC0",
                        fontSize: 10,
                        marginBottom: 10,
                      }}
                    >
                      Generated: {new Date(inv.created_at).toLocaleString()}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.payBillBtn,
                        {
                          backgroundColor: auraColor,
                          shadowColor: auraColor,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          alignSelf: "flex-end",
                        },
                      ]}
                      onPress={async () => {
                        try {
                          const { uri } = await Print.printToFileAsync({
                            html: inv.html_content,
                          });
                          const fileName = `Invoice_${inv.client_name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
                          const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
                          await FileSystem.copyAsync({
                            from: uri,
                            to: permanentUri,
                          });
                          await Sharing.shareAsync(permanentUri, {
                            mimeType: "application/pdf",
                            dialogTitle: "Download Past Invoice",
                          });
                        } catch (e) {
                          console.log("Download history error:", e);
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        Download PDF 📄
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Savings Goal Create/Edit Modal with Selector Picker */}
      <Modal visible={goalModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "90%", borderColor: `${auraColor}50` },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingGoalId ? "Edit Savings Goal" : "Create Savings Goal"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Goal Title (e.g. New GPU, Emergency Fund)"
                placeholderTextColor="#A7ADC0"
                value={goalTitle}
                onChangeText={setGoalTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Target Amount (PKR)"
                placeholderTextColor="#A7ADC0"
                keyboardType="numeric"
                value={goalTargetAmount}
                onChangeText={(t) =>
                  setGoalTargetAmount(t.replace(/[^0-9.]/g, ""))
                }
              />

              <Text style={styles.labelSub}>Select Target Year:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
              >
                {["2026", "2027", "2028", "2029", "2030"].map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[
                      styles.pillChip,
                      goalYear === yr && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setGoalYear(yr)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        goalYear === yr && styles.pillChipTextActive,
                      ]}
                    >
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.labelSub}>Select Target Month:</Text>
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
                ].map((mo) => (
                  <TouchableOpacity
                    key={mo.m}
                    style={[
                      styles.pillChip,
                      goalMonth === mo.m && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setGoalMonth(mo.m)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        goalMonth === mo.m && styles.pillChipTextActive,
                      ]}
                    >
                      {mo.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.labelSub}>Select Target Day:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {Array.from({ length: 31 }, (_, i) =>
                  String(i + 1).padStart(2, "0"),
                ).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.pillChip,
                      goalDay === d && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setGoalDay(d)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        goalDay === d && styles.pillChipTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setGoalModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: auraColor,
                      shadowColor: auraColor,
                      marginLeft: 8,
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      flex: 1,
                    },
                  ]}
                  onPress={handleSaveGoal}
                >
                  <Text
                    style={{
                      color: "#07080A",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Save Goal
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Fund Goal Modal */}
      <Modal
        visible={fundGoalModal.visible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { borderColor: `${auraColor}50` }]}
          >
            <Text style={styles.modalTitle}>
              Fund Goal: {fundGoalModal.goal?.title}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Amount to Allocate (PKR)"
              placeholderTextColor="#A7ADC0"
              keyboardType="numeric"
              value={goalFundInput}
              onChangeText={(t) => setGoalFundInput(t.replace(/[^0-9.]/g, ""))}
            />

            <Text style={styles.labelSub}>Select Funding Source Account:</Text>
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
                    fundingAccountId === acc.id && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
                    },
                  ]}
                  onPress={() => setFundingAccountId(acc.id)}
                >
                  <Text
                    style={[
                      styles.pillChipText,
                      fundingAccountId === acc.id && styles.pillChipTextActive,
                    ]}
                  >
                    {acc.name} (PKR {acc.balance.toLocaleString()})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setFundGoalModal({ visible: false, goal: null })}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: auraColor,
                    shadowColor: auraColor,
                    marginLeft: 8,
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flex: 1,
                  },
                ]}
                onPress={handleFundGoal}
              >
                <Text
                  style={{ color: "#07080A", fontWeight: "bold", fontSize: 13 }}
                >
                  Allocate Funds
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Debt / Loan Modal with Selector Picker */}
      <Modal visible={debtModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "90%", borderColor: `${auraColor}50` },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Track Loan or Debt</Text>

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    debtType === "lent" && {
                      backgroundColor: "#48D5AE",
                      borderColor: "#48D5AE",
                    },
                  ]}
                  onPress={() => setDebtType("lent")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      debtType === "lent" && {
                        color: "#07080A",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    Lent Out (Receivable)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    debtType === "borrowed" && {
                      backgroundColor: "#FF778F",
                      borderColor: "#FF778F",
                    },
                  ]}
                  onPress={() => setDebtType("borrowed")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      debtType === "borrowed" && {
                        color: "#07080A",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    Borrowed (Payable)
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Title / Person Name (e.g. Ali)"
                placeholderTextColor="#A7ADC0"
                value={debtTitle}
                onChangeText={setDebtTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Amount (PKR)"
                placeholderTextColor="#A7ADC0"
                keyboardType="numeric"
                value={debtAmount}
                onChangeText={(t) => setDebtAmount(t.replace(/[^0-9.]/g, ""))}
              />

              <Text style={styles.labelSub}>Select Account Affected:</Text>
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
                      debtAccountId === acc.id && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setDebtAccountId(acc.id)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        debtAccountId === acc.id && styles.pillChipTextActive,
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.labelSub}>Select Due Year:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
              >
                {["2026", "2027", "2028", "2029", "2030"].map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[
                      styles.pillChip,
                      debtYear === yr && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setDebtYear(yr)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        debtYear === yr && styles.pillChipTextActive,
                      ]}
                    >
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.labelSub}>Select Due Month:</Text>
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
                ].map((mo) => (
                  <TouchableOpacity
                    key={mo.m}
                    style={[
                      styles.pillChip,
                      debtMonth === mo.m && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setDebtMonth(mo.m)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        debtMonth === mo.m && styles.pillChipTextActive,
                      ]}
                    >
                      {mo.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.labelSub}>Select Due Day:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {Array.from({ length: 31 }, (_, i) =>
                  String(i + 1).padStart(2, "0"),
                ).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.pillChip,
                      debtDay === d && {
                        backgroundColor: auraColor,
                        borderColor: auraColor,
                      },
                    ]}
                    onPress={() => setDebtDay(d)}
                  >
                    <Text
                      style={[
                        styles.pillChipText,
                        debtDay === d && styles.pillChipTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setDebtModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: auraColor,
                      shadowColor: auraColor,
                      marginLeft: 8,
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      flex: 1,
                    },
                  ]}
                  onPress={handleSaveDebt}
                >
                  <Text
                    style={{
                      color: "#07080A",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Save Loan Tracker
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Frosted Glass Drawer (Includes Theme, Categories, Invoices, Backups, Biometrics) */}
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
                borderColor: `${auraColor}40`,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <View
                style={[styles.drawerUserBadge, { backgroundColor: auraColor }]}
              >
                <Text
                  style={{ color: "#07080A", fontSize: 16, fontWeight: "bold" }}
                >
                  V
                </Text>
              </View>
              <View>
                <Text style={styles.drawerUserName}>Subhan Shahid</Text>
                <Text style={[styles.drawerUserSub, { color: auraColor }]}>
                  VYBE Finance Pro
                </Text>
              </View>
            </View>

            <View style={styles.drawerDivider} />

            <TouchableOpacity
              style={styles.drawerNavItem}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setThemeModal(true);
              }}
            >
              <View style={styles.monoIconBox}>
                <View
                  style={[styles.monoBoxSquare, { borderColor: auraColor }]}
                />
              </View>
              <Text style={styles.drawerNavText}>Change Aura Theme</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerNavItem}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setCategoryModal(true);
              }}
            >
              <View style={styles.monoIconBox}>
                <View
                  style={[styles.monoCardChip, { backgroundColor: auraColor }]}
                />
              </View>
              <Text style={styles.drawerNavText}>Category Manager</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerNavItem}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setInvoiceModal(true);
              }}
            >
              <View style={styles.monoIconBox}>
                <View
                  style={[styles.monoInvoiceDoc, { borderColor: auraColor }]}
                />
                <View
                  style={[
                    styles.monoInvoiceLines,
                    { backgroundColor: auraColor },
                  ]}
                />
              </View>
              <Text style={styles.drawerNavText}>Generate Client Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerNavItem}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setInvoiceHistoryModal(true);
              }}
            >
              <View style={styles.monoIconBox}>
                <View
                  style={[styles.monoBoxSquare, { borderColor: auraColor }]}
                />
              </View>
              <Text style={styles.drawerNavText}>
                Invoice History (30 Days)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerNavItem}
              activeOpacity={0.8}
              onPress={() => {
                closeMenu();
                setExportModal(true);
              }}
            >
              <View style={styles.monoIconBox}>
                <View
                  style={[
                    styles.monoBarHorizontal,
                    { backgroundColor: auraColor },
                  ]}
                />
                <View
                  style={[styles.monoArrowDown, { borderTopColor: auraColor }]}
                />
              </View>
              <Text style={styles.drawerNavText}>
                Export Statement (Excel/CSV)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerNavItem}
              activeOpacity={0.8}
              onPress={downloadBackup}
            >
              <View style={styles.monoIconBox}>
                <View
                  style={[styles.monoBoxSquare, { borderColor: auraColor }]}
                />
                <View
                  style={[styles.monoBoxLid, { backgroundColor: auraColor }]}
                />
              </View>
              <Text style={styles.drawerNavText}>
                Export Full Backup (JSON)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerNavItem}
              activeOpacity={0.8}
              onPress={handleUploadBackup}
            >
              <View style={styles.monoIconBox}>
                <View
                  style={[styles.monoArrowDown, { borderTopColor: auraColor }]}
                />
              </View>
              <Text style={styles.drawerNavText}>
                Upload & Restore Backup (JSON)
              </Text>
            </TouchableOpacity>

            {/* Polished Cyberpunk Biometric Security Tile */}
            <View style={styles.biometricTile}>
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <View
                  style={[
                    styles.biometricIconCircle,
                    { borderColor: auraColor },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>🔒</Text>
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.biometricTitle}>Biometric Lock</Text>
                  <Text style={styles.biometricSub}>Fingerprint / Face ID</Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: "#1A1D29", true: auraColor }}
                thumbColor={biometricEnabled ? "#07080A" : "#A7ADC0"}
                ios_backgroundColor="#1A1D29"
                value={biometricEnabled}
                onValueChange={async (val) => {
                  if (val) {
                    const compatible =
                      await LocalAuthentication.hasHardwareAsync();
                    const enrolled =
                      await LocalAuthentication.isEnrolledAsync();
                    if (!compatible || !enrolled) {
                      setErrorModal({
                        visible: true,
                        message:
                          "No biometric security (Fingerprint/Face ID) or passcode enrolled on this device.",
                      });
                      return;
                    }
                    const res = await LocalAuthentication.authenticateAsync({
                      promptMessage: "Enable Biometric Protection",
                    });
                    if (res.success) {
                      setBiometricEnabled(true);
                      triggerCelebration();
                    }
                  } else {
                    setBiometricEnabled(false);
                  }
                }}
              />
            </View>

            <View style={{ marginTop: "auto" }}>
              <TouchableOpacity
                style={styles.drawerSignOut}
                activeOpacity={0.8}
                onPress={closeMenu}
              >
                <Text
                  style={{ color: "#FF778F", fontSize: 13, fontWeight: "600" }}
                >
                  Close Drawer
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Statement Export Modal */}
      <Modal visible={exportModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "90%", borderColor: `${auraColor}50` },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                Export Statement Range (Excel/CSV)
              </Text>

              <View
                style={[
                  styles.modernRangeBox,
                  { borderColor: `${auraColor}40` },
                ]}
              >
                <View style={styles.rangeTabsRow}>
                  <TouchableOpacity
                    style={[
                      styles.rangeTabBtn,
                      rangeTab === "start" && {
                        backgroundColor: auraColor,
                        shadowColor: auraColor,
                      },
                    ]}
                    onPress={() => setRangeTab("start")}
                  >
                    <Text
                      style={[
                        styles.rangeTabText,
                        rangeTab === "start" && styles.rangeTabTextActive,
                      ]}
                    >
                      From: {exportStartDate}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.rangeTabBtn,
                      rangeTab === "end" && {
                        backgroundColor: auraColor,
                        shadowColor: auraColor,
                      },
                    ]}
                    onPress={() => setRangeTab("end")}
                  >
                    <Text
                      style={[
                        styles.rangeTabText,
                        rangeTab === "end" && styles.rangeTabTextActive,
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
                      exportRangeTab === "start"
                        ? exportStartDate.startsWith(yr)
                        : exportEndDate.startsWith(yr);
                    return (
                      <TouchableOpacity
                        key={yr}
                        style={[
                          styles.pillChip,
                          active && {
                            backgroundColor: auraColor,
                            borderColor: auraColor,
                          },
                        ]}
                        onPress={() => {
                          if (exportRangeTab === "start") {
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
                            active && styles.pillChipTextActive,
                          ]}
                        >
                          {yr}
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
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: auraColor,
                      shadowColor: auraColor,
                      marginLeft: 8,
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      flex: 1,
                    },
                  ]}
                  onPress={downloadDeviceExcelCSV}
                >
                  <Text
                    style={{
                      color: "#07080A",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Download Excel/CSV File 📥
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Insufficient Balance / Error Modal */}
      <Modal
        visible={errorModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { alignItems: "center", borderColor: `${auraColor}50` },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: "#FF778F", textAlign: "center" },
              ]}
            >
              Action Failed
            </Text>
            <Text
              style={{
                color: "#F5F6FF",
                fontSize: 13,
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 18,
              }}
            >
              {errorModal.message}
            </Text>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                {
                  backgroundColor: auraColor,
                  shadowColor: auraColor,
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                },
              ]}
              onPress={() => setErrorModal({ visible: false, message: "" })}
            >
              <Text style={{ color: "#07080A", fontWeight: "bold" }}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Dialog Modal */}
      <Modal
        visible={confirmModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { alignItems: "center", borderColor: `${auraColor}50` },
            ]}
          >
            <Text style={[styles.modalTitle, { textAlign: "center" }]}>
              {confirmModal.title}
            </Text>
            <Text
              style={{
                color: "#A7ADC0",
                fontSize: 13,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {confirmModal.message}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() =>
                  setConfirmModal({
                    visible: false,
                    title: "",
                    message: "",
                    onConfirm: () => {},
                  })
                }
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: "#FF778F", marginLeft: 8 },
                ]}
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

      {/* Add Account Modal */}
      <Modal visible={accountModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { borderColor: `${auraColor}50` }]}
          >
            <Text style={styles.modalTitle}>Add Bank Account or Wallet</Text>
            <TextInput
              style={styles.input}
              placeholder="Account Name (e.g. Easypaisa, JazzCash)"
              placeholderTextColor="#A7ADC0"
              value={accName}
              onChangeText={setAccName}
            />
            <TextInput
              style={styles.input}
              placeholder="Opening Balance"
              placeholderTextColor="#A7ADC0"
              keyboardType="numeric"
              value={accBalance}
              onChangeText={(t) => setAccBalance(t.replace(/[^0-9.]/g, ""))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setAccountModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: auraColor,
                    shadowColor: auraColor,
                    marginLeft: 8,
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flex: 1,
                  },
                ]}
                onPress={handleSaveAccount}
              >
                <Text
                  style={{ color: "#07080A", fontWeight: "bold", fontSize: 13 }}
                >
                  Save Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction & Transfer Modal */}
      <Modal visible={txModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "90%", borderColor: `${auraColor}50` },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingTx ? "Edit Transaction" : "Record Transaction"}
              </Text>

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
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
                      txType === "in" && styles.toggleTextActive,
                    ]}
                  >
                    ↗ In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    txType === "out" && styles.toggleOutActive,
                  ]}
                  onPress={() => {
                    setTxType("out");
                    setCategory(allExpenseCategories[0] || "Groceries");
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      txType === "out" && styles.toggleTextActive,
                    ]}
                  >
                    ↘ Out
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    txType === "transfer" && {
                      backgroundColor: auraColor,
                      borderColor: auraColor,
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
                      txType === "transfer" && {
                        color: "#07080A",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    ⇄ Transfer
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.labelSub}>Select Currency:</Text>
                <TouchableOpacity onPress={() => setCurrencyModal(true)}>
                  <Text style={[styles.actionLink, { color: auraColor }]}>
                    + Add Global Currency
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
                    backgroundColor: "rgba(26,29,41,0.65)",
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text
                    style={{ color: "#48D5AE", fontSize: 11, marginBottom: 4 }}
                  >
                    Live Google Exchange Rate: 1 {currency} ={" "}
                    {getLiveRate(currency)} PKR
                  </Text>

                  <TouchableOpacity
                    style={{ marginVertical: 6 }}
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
                        : "+ How much are you getting really? (Custom Rate)"}
                    </Text>
                  </TouchableOpacity>

                  {overrideRateActive && (
                    <TextInput
                      style={[styles.input, { marginTop: 4, marginBottom: 0 }]}
                      placeholder="Enter exact rate received..."
                      placeholderTextColor="#A7ADC0"
                      keyboardType="numeric"
                      value={exchangeRate}
                      onChangeText={setExchangeRate}
                    />
                  )}
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder={`Amount (${currency})`}
                placeholderTextColor="#A7ADC0"
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
                            destAccountId === acc.id && {
                              backgroundColor: auraColor,
                              borderColor: auraColor,
                            },
                          ]}
                          onPress={() => setDestAccountId(acc.id)}
                        >
                          <Text
                            style={[
                              styles.pillChipText,
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
                      style={styles.input}
                      placeholder="New Client Name"
                      placeholderTextColor="#A7ADC0"
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
                style={styles.input}
                placeholder="Description (optional)"
                placeholderTextColor="#A7ADC0"
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setTxModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: auraColor,
                      shadowColor: auraColor,
                      marginLeft: 8,
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      flex: 1,
                    },
                  ]}
                  onPress={handleSaveTransaction}
                >
                  <Text
                    style={{
                      color: "#07080A",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Save Entry
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Client Modal */}
      <Modal visible={clientModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { borderColor: `${auraColor}50` }]}
          >
            <Text style={styles.modalTitle}>
              {editingClient ? "Edit Client" : "New Client"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#A7ADC0"
              value={clientName}
              onChangeText={setClientName}
            />
            <TextInput
              style={styles.input}
              placeholder="Company"
              placeholderTextColor="#A7ADC0"
              value={clientCompany}
              onChangeText={setClientCompany}
            />
            <TextInput
              style={styles.input}
              placeholder="Country"
              placeholderTextColor="#A7ADC0"
              value={clientCountry}
              onChangeText={setClientCountry}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setClientModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: auraColor,
                    shadowColor: auraColor,
                    marginLeft: 8,
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flex: 1,
                  },
                ]}
                onPress={handleSaveClient}
              >
                <Text
                  style={{ color: "#07080A", fontWeight: "bold", fontSize: 13 }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07080A" },
  scrollContent: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 36,
  },

  hamburgerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(26,29,41,0.65)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  hamburgerLine: { width: 16, height: 2, borderRadius: 1, marginVertical: 2.5 },

  brandTitle: {
    color: "#F5F6FF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
    fontWeight: "700",
  },

  catConfigBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeGearIcon: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  gearInnerDot: { width: 4, height: 4, borderRadius: 2 },

  mainNavTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(26, 29, 41, 0.55)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  slidingGlassIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    width: (screenWidth - 56) / 5,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
  },
  mainNavTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    zIndex: 2,
  },
  mainNavTabText: { color: "#A7ADC0", fontSize: 10, fontWeight: "600" },
  mainNavTabTextActive: { color: "#07080A", fontWeight: "bold" },

  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: "700" },

  payBillBtn: {
    borderRadius: 8,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  drawerBackdrop: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  drawerContent: {
    width: 280,
    height: "100%",
    backgroundColor: "rgba(16, 18, 27, 0.95)",
    borderRightWidth: 1,
    padding: 24,
    shadowColor: "#8279FF",
    shadowOffset: { width: 15, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    position: "absolute",
    left: 0,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  drawerUserBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  drawerUserName: { color: "#F5F6FF", fontSize: 14, fontWeight: "700" },
  drawerUserSub: { fontSize: 10, marginTop: 2, fontWeight: "700" },
  drawerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },

  drawerNavItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 29, 41, 0.5)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  drawerNavText: { color: "#F5F6FF", fontSize: 13, fontWeight: "600" },
  drawerSignOut: {
    backgroundColor: "rgba(255, 119, 143, 0.1)",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 119, 143, 0.2)",
  },

  biometricTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 29, 41, 0.65)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  biometricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  biometricTitle: { color: "#F5F6FF", fontSize: 13, fontWeight: "700" },
  biometricSub: { color: "#A7ADC0", fontSize: 10, marginTop: 1 },

  monoIconBox: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  monoBarHorizontal: { width: 14, height: 2, borderRadius: 1, marginBottom: 3 },
  monoArrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
    borderRightWidth: 4,
    borderRightColor: "transparent",
    borderTopWidth: 5,
  },
  monoBoxSquare: { width: 12, height: 10, borderWidth: 1.5, borderRadius: 2 },
  monoBoxLid: {
    width: 8,
    height: 2,
    position: "absolute",
    top: 2,
    borderRadius: 1,
  },
  monoCardChip: { width: 14, height: 10, borderRadius: 2 },
  monoInvoiceDoc: { width: 12, height: 14, borderWidth: 1.5, borderRadius: 2 },
  monoInvoiceLines: {
    width: 6,
    height: 1,
    position: "absolute",
    top: 6,
    left: 3,
  },

  modernRangeBox: {
    backgroundColor: "rgba(26, 29, 41, 0.65)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  rangeTabsRow: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "rgba(18, 21, 29, 0.8)",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  rangeTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  rangeTabText: { color: "#A7ADC0", fontSize: 12, fontWeight: "600" },
  rangeTabTextActive: { color: "#07080A", fontWeight: "bold" },
  rangeSubLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  netPositionCard: {
    backgroundColor: "rgba(26, 29, 41, 0.65)",
    borderRadius: 22,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
  },
  cardLabel: {
    color: "#A7ADC0",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    justifyContent: "space-between",
  },
  netAmount: {
    color: "#F5F6FF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  eyeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(26,29,41,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  eyeIconText: { fontSize: 14 },

  liveBadge: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  liveText: { fontSize: 10, fontWeight: "700" },

  undoContainer: {
    backgroundColor: "rgba(26,29,41,0.95)",
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  undoBanner: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  undoText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  undoBtnText: { fontSize: 12, fontWeight: "bold" },
  undoProgressBar: { height: 3 },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 10,
  },
  sectionTitle: { color: "#F5F6FF", fontSize: 14, fontWeight: "700" },
  actionLink: { fontSize: 12, fontWeight: "600" },
  filterBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  filterText: { fontSize: 12, fontWeight: "600" },

  accountCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(26, 29, 41, 0.65)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#8279FF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  accName: {
    color: "#F5F6FF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  accType: { color: "#A7ADC0", fontSize: 11 },
  accSub: { color: "#A7ADC0", fontSize: 10 },
  accBalance: { color: "#48D5AE", fontSize: 14, fontWeight: "700" },

  actionRow: { flexDirection: "row", marginVertical: 12 },
  addButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  addButtonText: { fontSize: 13, fontWeight: "800" },

  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 29, 41, 0.65)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  clientName: {
    color: "#F5F6FF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  clientCompany: { fontSize: 11 },
  clientMeta: { color: "#A7ADC0", fontSize: 11 },
  editText: { color: "#54A9FF", fontSize: 11, fontWeight: "600" },
  deleteText: { color: "#FF778F", fontSize: 11, fontWeight: "600" },

  txCard: {
    backgroundColor: "rgba(26, 29, 41, 0.65)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  txTitle: {
    color: "#F5F6FF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  txSub: { color: "#A7ADC0", fontSize: 11 },
  txAmount: { fontSize: 13, fontWeight: "700" },
  greenText: { color: "#48D5AE" },
  redText: { color: "#FF778F" },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: "rgba(18, 20, 29, 0.96)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    color: "#F5F6FF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(36,40,58,0.7)",
    borderRadius: 12,
    padding: 14,
    color: "#F5F6FF",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    fontSize: 13,
  },
  labelSub: { color: "#A7ADC0", fontSize: 12, marginBottom: 6 },

  toggleRow: { flexDirection: "row", marginBottom: 12 },
  toggleBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "rgba(36,40,58,0.6)",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginRight: 6,
  },
  toggleInActive: { backgroundColor: "#48D5AE", borderColor: "#48D5AE" },
  toggleOutActive: { backgroundColor: "#FF778F", borderColor: "#FF778F" },
  toggleText: { color: "#A7ADC0", fontSize: 11, fontWeight: "600" },
  toggleTextActive: { color: "#07080A", fontWeight: "bold" },

  pillChip: {
    backgroundColor: "rgba(36,40,58,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  pillChipActive: {},
  pillChipText: { color: "#A7ADC0", fontSize: 11 },
  pillChipTextActive: { color: "#07080A", fontWeight: "bold" },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  cancelBtn: { backgroundColor: "rgba(36,40,58,0.7)", marginRight: 8 },
  cancelBtnText: { color: "#A7ADC0", fontWeight: "600", fontSize: 13 },
  saveBtn: { marginLeft: 8 },
  saveBtnText: { color: "#07080A", fontWeight: "bold", fontSize: 13 },
});
