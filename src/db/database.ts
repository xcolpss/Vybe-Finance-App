import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

let db: any = null;

if (Platform.OS !== "web") {
  db = SQLite.openDatabaseSync("vybe_finance.db");
}

let liveRates: { [key: string]: number } = {
  USD: 276.8,
  EUR: 309.81,
  GBP: 360.5,
  AED: 75.35,
  CAD: 202.1,
  AUD: 181.4,
  SAR: 73.8,
  PKR: 1.0,
};

export async function fetchLiveExchangeRates() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/PKR");
    const data = await response.json();
    if (data && data.rates) {
      Object.keys(data.rates).forEach((code) => {
        if (code !== "PKR") {
          liveRates[code] = Number((1 / data.rates[code]).toFixed(2));
        }
      });
      liveRates.PKR = 1.0;
    }
  } catch (e) {
    console.log("Using cached fallback exchange rates.");
  }
}

export function getLiveRate(currency: string): number {
  return liveRates[currency] || 280.0;
}

export function initDatabase() {
  fetchLiveExchangeRates();

  if (Platform.OS === "web") {
    if (!localStorage.getItem("vybe_profiles")) {
      localStorage.setItem(
        "vybe_profiles",
        JSON.stringify([
          { id: 1, name: "Personal", type: "personal", currency: "PKR" },
        ]),
      );
    }
    if (!localStorage.getItem("vybe_accounts")) {
      localStorage.setItem(
        "vybe_accounts",
        JSON.stringify([
          {
            id: 1,
            profile_id: 1,
            name: "Main Wallet",
            type: "wallet",
            balance: 50000,
            currency: "PKR",
          },
          {
            id: 2,
            profile_id: 1,
            name: "Upwork USD",
            type: "platform",
            balance: 1250,
            currency: "USD",
          },
        ]),
      );
    }
    if (!localStorage.getItem("vybe_clients")) {
      localStorage.setItem(
        "vybe_clients",
        JSON.stringify([
          {
            id: 1,
            name: "Acme Corp",
            company: "Acme Ltd",
            country: "United States",
            category: "Upwork",
          },
        ]),
      );
    }
    if (!localStorage.getItem("vybe_transactions")) {
      localStorage.setItem("vybe_transactions", JSON.stringify([]));
    }
    if (!localStorage.getItem("vybe_recurring_bills")) {
      localStorage.setItem("vybe_recurring_bills", JSON.stringify([]));
    }
    if (!localStorage.getItem("vybe_categories")) {
      localStorage.setItem(
        "vybe_categories",
        JSON.stringify([
          { id: 1, name: "Groceries & Food", type: "out" },
          { id: 2, name: "Housing & Rent", type: "out" },
          { id: 3, name: "Freelance / Client Payment", type: "in" },
        ]),
      );
    }
    if (!localStorage.getItem("vybe_budgets")) {
      localStorage.setItem("vybe_budgets", JSON.stringify([]));
    }
    if (!localStorage.getItem("vybe_user_currencies")) {
      localStorage.setItem(
        "vybe_user_currencies",
        JSON.stringify(["PKR", "USD", "EUR", "GBP", "AED"]),
      );
    }
    if (!localStorage.getItem("vybe_savings_goals")) {
      localStorage.setItem("vybe_savings_goals", JSON.stringify([]));
    }
    if (!localStorage.getItem("vybe_debts")) {
      localStorage.setItem("vybe_debts", JSON.stringify([]));
    }
    if (!localStorage.getItem("vybe_invoice_history")) {
      localStorage.setItem("vybe_invoice_history", JSON.stringify([]));
    }
    if (!localStorage.getItem("vybe_aura_theme")) {
      localStorage.setItem("vybe_aura_theme", "#8279FF");
    }
    return;
  }

  if (db) {
    db.execSync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        currency TEXT DEFAULT 'PKR'
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'PKR'
      );

      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company TEXT,
        country TEXT,
        category TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        account_id INTEGER,
        dest_account_id INTEGER,
        client_id INTEGER,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        original_amount REAL,
        original_currency TEXT,
        exchange_rate REAL,
        description TEXT,
        category TEXT,
        date TEXT DEFAULT CURRENT_DATE
      );

      CREATE TABLE IF NOT EXISTS recurring_bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        account_id INTEGER,
        due_day INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        monthly_limit REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS savings_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0,
        target_date TEXT NOT NULL,
        completed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS debts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        account_id INTEGER,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS invoice_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT NOT NULL,
        heading TEXT NOT NULL,
        total_amount REAL NOT NULL,
        created_at INTEGER NOT NULL,
        html_content TEXT NOT NULL
      );
    `);

    try {
      db.execSync(
        `ALTER TABLE transactions ADD COLUMN dest_account_id INTEGER;`,
      );
    } catch (e) {}

    const curCheck = db.getAllSync(
      `SELECT COUNT(*) as count FROM user_currencies;`,
    )[0] as any;
    if (curCheck.count === 0) {
      ["PKR", "USD", "EUR", "GBP", "AED"].forEach((c) => {
        db.runSync(`INSERT OR IGNORE INTO user_currencies (code) VALUES (?);`, [
          c,
        ]);
      });
    }
  }
}

export function getBaseCurrency(): string | null {
  if (Platform.OS === "web") {
    return localStorage.getItem("vybe_base_currency");
  } else {
    try {
      const res = db.getAllSync(
        `SELECT value FROM settings WHERE key = 'base_currency';`,
      ) as any[];
      return res.length > 0 ? res[0].value : null;
    } catch (e) {
      return null;
    }
  }
}

export function setBaseCurrency(code: string) {
  if (Platform.OS === "web") {
    localStorage.setItem("vybe_base_currency", code);
  } else {
    db.runSync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('base_currency', ?);`,
      [code],
    );
  }
}

export function getAuraTheme(): string {
  if (Platform.OS === "web") {
    return localStorage.getItem("vybe_aura_theme") || "#8279FF";
  } else {
    try {
      const res = db.getAllSync(
        `SELECT value FROM settings WHERE key = 'aura_theme';`,
      ) as any[];
      return res.length > 0 ? res[0].value : "#8279FF";
    } catch (e) {
      return "#8279FF";
    }
  }
}

export function setAuraTheme(hex: string) {
  if (Platform.OS === "web") {
    localStorage.setItem("vybe_aura_theme", hex);
  } else {
    db.runSync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('aura_theme', ?);`,
      [hex],
    );
  }
}

export function getInvoiceHistory(): any[] {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  if (Platform.OS === "web") {
    const list = JSON.parse(
      localStorage.getItem("vybe_invoice_history") || "[]",
    );
    const filtered = list.filter((inv: any) => inv.created_at >= thirtyDaysAgo);
    localStorage.setItem("vybe_invoice_history", JSON.stringify(filtered));
    return filtered;
  } else {
    db.runSync(`DELETE FROM invoice_history WHERE created_at < ?;`, [
      thirtyDaysAgo,
    ]);
    return db.getAllSync(`SELECT * FROM invoice_history ORDER BY id DESC;`);
  }
}

export function saveInvoiceHistory(
  clientName: string,
  heading: string,
  totalAmount: number,
  htmlContent: string,
) {
  const createdAt = Date.now();
  if (Platform.OS === "web") {
    const list = JSON.parse(
      localStorage.getItem("vybe_invoice_history") || "[]",
    );
    const newInv = {
      id: createdAt,
      client_name: clientName,
      heading,
      total_amount: totalAmount,
      created_at: createdAt,
      html_content: htmlContent,
    };
    localStorage.setItem(
      "vybe_invoice_history",
      JSON.stringify([newInv, ...list]),
    );
  } else {
    db.runSync(
      `INSERT INTO invoice_history (client_name, heading, total_amount, created_at, html_content) VALUES (?, ?, ?, ?, ?);`,
      [clientName, heading, totalAmount, createdAt, htmlContent],
    );
  }
}

export function getUserCurrencies(): string[] {
  if (Platform.OS === "web") {
    return JSON.parse(
      localStorage.getItem("vybe_user_currencies") ||
        '["PKR", "USD", "EUR", "GBP", "AED"]',
    );
  } else {
    const res = db.getAllSync(`SELECT code FROM user_currencies;`) as any[];
    return res.map((r) => r.code);
  }
}

export function addUserCurrency(code: string) {
  if (Platform.OS === "web") {
    const currs = getUserCurrencies();
    if (!currs.includes(code)) {
      currs.push(code);
      localStorage.setItem("vybe_user_currencies", JSON.stringify(currs));
    }
  } else {
    db.runSync(`INSERT OR IGNORE INTO user_currencies (code) VALUES (?);`, [
      code,
    ]);
  }
}

export function getDebts() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_debts") || "[]")
    : db.getAllSync(`SELECT * FROM debts ORDER BY id DESC;`);
}

export function addDebt(
  title: string,
  type: "lent" | "borrowed",
  amount: number,
  accountId: number,
  dueDate: string,
) {
  if (Platform.OS === "web") {
    const debts = JSON.parse(localStorage.getItem("vybe_debts") || "[]");
    const newDebt = {
      id: Date.now(),
      title,
      type,
      amount,
      account_id: accountId,
      due_date: dueDate,
      status: "pending",
    };
    localStorage.setItem("vybe_debts", JSON.stringify([...debts, newDebt]));
    return newDebt;
  } else {
    db.runSync(
      `INSERT INTO debts (title, type, amount, account_id, due_date, status) VALUES (?, ?, ?, ?, ?, 'pending');`,
      [title, type, amount, accountId, dueDate],
    );
    return db.getAllSync(`SELECT * FROM debts ORDER BY id DESC;`)[0];
  }
}

export function updateDebtStatus(id: number, status: string) {
  if (Platform.OS === "web") {
    const debts = JSON.parse(localStorage.getItem("vybe_debts") || "[]");
    localStorage.setItem(
      "vybe_debts",
      JSON.stringify(
        debts.map((d: any) => (d.id === Number(id) ? { ...d, status } : d)),
      ),
    );
  } else {
    db.runSync(`UPDATE debts SET status = ? WHERE id = ?;`, [status, id]);
  }
}

export function deleteDebt(id: number) {
  if (Platform.OS === "web") {
    const debts = JSON.parse(localStorage.getItem("vybe_debts") || "[]");
    localStorage.setItem(
      "vybe_debts",
      JSON.stringify(debts.filter((d: any) => d.id !== Number(id))),
    );
  } else {
    db.runSync(`DELETE FROM debts WHERE id = ?;`, [id]);
  }
}

export function getSavingsGoals() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_savings_goals") || "[]")
    : db.getAllSync(`SELECT * FROM savings_goals ORDER BY id DESC;`);
}

export function addSavingsGoal(
  title: string,
  targetAmount: number,
  targetDate: string,
) {
  if (Platform.OS === "web") {
    const goals = JSON.parse(
      localStorage.getItem("vybe_savings_goals") || "[]",
    );
    const newGoal = {
      id: Date.now(),
      title,
      target_amount: targetAmount,
      current_amount: 0,
      target_date: targetDate,
      completed: 0,
    };
    localStorage.setItem(
      "vybe_savings_goals",
      JSON.stringify([...goals, newGoal]),
    );
    return newGoal;
  } else {
    db.runSync(
      `INSERT INTO savings_goals (title, target_amount, current_amount, target_date, completed) VALUES (?, ?, 0, ?, 0);`,
      [title, targetAmount, targetDate],
    );
    return db.getAllSync(`SELECT * FROM savings_goals ORDER BY id DESC;`)[0];
  }
}

export function updateSavingsGoal(
  id: number,
  title: string,
  targetAmount: number,
  targetDate: string,
) {
  if (Platform.OS === "web") {
    const goals = JSON.parse(
      localStorage.getItem("vybe_savings_goals") || "[]",
    );
    const updated = goals.map((g: any) => {
      if (g.id === Number(id)) {
        const isDone = g.current_amount >= targetAmount ? 1 : 0;
        return {
          ...g,
          title,
          target_amount: targetAmount,
          target_date: targetDate,
          completed: isDone,
        };
      }
      return g;
    });
    localStorage.setItem("vybe_savings_goals", JSON.stringify(updated));
  } else {
    const goal = db.getAllSync(`SELECT * FROM savings_goals WHERE id = ?;`, [
      id,
    ])[0] as any;
    if (goal) {
      const isDone = goal.current_amount >= targetAmount ? 1 : 0;
      db.runSync(
        `UPDATE savings_goals SET title = ?, target_amount = ?, target_date = ?, completed = ? WHERE id = ?;`,
        [title, targetAmount, targetDate, isDone, id],
      );
    }
  }
}

export function fundSavingsGoal(id: number, amount: number) {
  if (Platform.OS === "web") {
    const goals = JSON.parse(
      localStorage.getItem("vybe_savings_goals") || "[]",
    );
    let completedFlag = false;
    const updated = goals.map((g: any) => {
      if (g.id === Number(id)) {
        const nextAmt = g.current_amount + amount;
        const isDone = nextAmt >= g.target_amount ? 1 : 0;
        if (isDone) completedFlag = true;
        return { ...g, current_amount: nextAmt, completed: isDone };
      }
      return g;
    });
    localStorage.setItem("vybe_savings_goals", JSON.stringify(updated));
    return completedFlag;
  } else {
    const goal = db.getAllSync(`SELECT * FROM savings_goals WHERE id = ?;`, [
      id,
    ])[0] as any;
    if (!goal) return false;
    const nextAmt = goal.current_amount + amount;
    const isDone = nextAmt >= goal.target_amount ? 1 : 0;
    db.runSync(
      `UPDATE savings_goals SET current_amount = ?, completed = ? WHERE id = ?;`,
      [nextAmt, isDone, id],
    );
    return isDone === 1;
  }
}

export function deleteSavingsGoal(id: number) {
  if (Platform.OS === "web") {
    const goals = JSON.parse(
      localStorage.getItem("vybe_savings_goals") || "[]",
    );
    localStorage.setItem(
      "vybe_savings_goals",
      JSON.stringify(goals.filter((g: any) => g.id !== Number(id))),
    );
  } else {
    db.runSync(`DELETE FROM savings_goals WHERE id = ?;`, [id]);
  }
}

export function getProfiles() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_profiles") || "[]")
    : db.getAllSync(`SELECT * FROM profiles;`);
}

export function getAccounts() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_accounts") || "[]")
    : db.getAllSync(`SELECT * FROM accounts;`);
}

export function addAccount(
  profileId: number,
  name: string,
  type: string,
  balance: number,
  currency: string,
) {
  if (Platform.OS === "web") {
    const accounts = JSON.parse(localStorage.getItem("vybe_accounts") || "[]");
    const newAcc = {
      id: Date.now(),
      profile_id: profileId,
      name,
      type,
      balance,
      currency,
    };
    localStorage.setItem(
      "vybe_accounts",
      JSON.stringify([...accounts, newAcc]),
    );
    return newAcc;
  } else {
    db.runSync(
      `INSERT INTO accounts (profile_id, name, type, balance, currency) VALUES (?, ?, ?, ?, ?);`,
      [profileId, name, type, balance, currency],
    );
    return db.getAllSync(`SELECT * FROM accounts ORDER BY id DESC LIMIT 1;`)[0];
  }
}

export function deleteAccount(id: number) {
  if (Platform.OS === "web") {
    const accounts = JSON.parse(localStorage.getItem("vybe_accounts") || "[]");
    const target = accounts.find((a: any) => a.id === Number(id));
    localStorage.setItem(
      "vybe_accounts",
      JSON.stringify(accounts.filter((a: any) => a.id !== Number(id))),
    );
    return target;
  } else {
    const target = db.getAllSync(`SELECT * FROM accounts WHERE id = ?;`, [
      id,
    ])[0];
    db.runSync(`DELETE FROM accounts WHERE id = ?;`, [id]);
    return target;
  }
}

export function restoreAccount(account: any) {
  if (!account) return;
  if (Platform.OS === "web") {
    const accounts = JSON.parse(localStorage.getItem("vybe_accounts") || "[]");
    localStorage.setItem(
      "vybe_accounts",
      JSON.stringify([...accounts, account]),
    );
  } else {
    db.runSync(
      `INSERT INTO accounts (id, profile_id, name, type, balance, currency) VALUES (?, ?, ?, ?, ?, ?);`,
      [
        account.id,
        account.profile_id,
        account.name,
        account.type,
        account.balance,
        account.currency,
      ],
    );
  }
}

export function getClients() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_clients") || "[]")
    : db.getAllSync(`SELECT * FROM clients;`);
}

export function addClient(
  name: string,
  company: string,
  country: string,
  category: string,
) {
  if (Platform.OS === "web") {
    const clients = JSON.parse(localStorage.getItem("vybe_clients") || "[]");
    const newClient = { id: Date.now(), name, company, country, category };
    localStorage.setItem(
      "vybe_clients",
      JSON.stringify([...clients, newClient]),
    );
    return newClient;
  } else {
    db.runSync(
      `INSERT INTO clients (name, company, country, category) VALUES (?, ?, ?, ?);`,
      [name, company, country, category],
    );
    return db.getAllSync(`SELECT * FROM clients ORDER BY id DESC LIMIT 1;`)[0];
  }
}

export function updateClient(
  id: number,
  name: string,
  company: string,
  country: string,
  category: string,
) {
  if (Platform.OS === "web") {
    const clients = JSON.parse(localStorage.getItem("vybe_clients") || "[]");
    localStorage.setItem(
      "vybe_clients",
      JSON.stringify(
        clients.map((c: any) =>
          c.id === Number(id) ? { ...c, name, company, country, category } : c,
        ),
      ),
    );
  } else {
    db.runSync(
      `UPDATE clients SET name = ?, company = ?, country = ?, category = ? WHERE id = ?;`,
      [name, company, country, category, id],
    );
  }
}

export function deleteClient(id: number) {
  if (Platform.OS === "web") {
    const clients = JSON.parse(localStorage.getItem("vybe_clients") || "[]");
    const target = clients.find((c: any) => c.id === Number(id));
    localStorage.setItem(
      "vybe_clients",
      JSON.stringify(clients.filter((c: any) => c.id !== Number(id))),
    );
    return target;
  } else {
    const target = db.getAllSync(`SELECT * FROM clients WHERE id = ?;`, [
      id,
    ])[0];
    db.runSync(`DELETE FROM clients WHERE id = ?;`, [id]);
    return target;
  }
}

export function restoreClient(client: any) {
  if (!client) return;
  if (Platform.OS === "web") {
    const clients = JSON.parse(localStorage.getItem("vybe_clients") || "[]");
    localStorage.setItem("vybe_clients", JSON.stringify([...clients, client]));
  } else {
    db.runSync(
      `INSERT INTO clients (id, name, company, country, category) VALUES (?, ?, ?, ?, ?);`,
      [client.id, client.name, client.company, client.country, client.category],
    );
  }
}

export function getCategories() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_categories") || "[]")
    : db.getAllSync(`SELECT * FROM categories;`);
}

export function addCategory(name: string, type: string) {
  if (Platform.OS === "web") {
    const cats = JSON.parse(localStorage.getItem("vybe_categories") || "[]");
    const newCat = { id: Date.now(), name, type };
    localStorage.setItem("vybe_categories", JSON.stringify([...cats, newCat]));
    return newCat;
  } else {
    db.runSync(`INSERT INTO categories (name, type) VALUES (?, ?);`, [
      name,
      type,
    ]);
    return db.getAllSync(
      `SELECT * FROM categories ORDER BY id DESC LIMIT 1;`,
    )[0];
  }
}

export function deleteCategory(id: number) {
  if (Platform.OS === "web") {
    const cats = JSON.parse(localStorage.getItem("vybe_categories") || "[]");
    localStorage.setItem(
      "vybe_categories",
      JSON.stringify(cats.filter((c: any) => c.id !== Number(id))),
    );
  } else {
    db.runSync(`DELETE FROM categories WHERE id = ?;`, [id]);
  }
}

export function getBudgets() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_budgets") || "[]")
    : db.getAllSync(`SELECT * FROM budgets;`);
}

export function setBudgetLimit(category: string, limit: number) {
  if (Platform.OS === "web") {
    const budgets = JSON.parse(localStorage.getItem("vybe_budgets") || "[]");
    const existing = budgets.find((b: any) => b.category === category);
    if (existing) {
      localStorage.setItem(
        "vybe_budgets",
        JSON.stringify(
          budgets.map((b: any) =>
            b.category === category ? { ...b, monthly_limit: limit } : b,
          ),
        ),
      );
    } else {
      localStorage.setItem(
        "vybe_budgets",
        JSON.stringify([
          ...budgets,
          { id: Date.now(), category, monthly_limit: limit },
        ]),
      );
    }
  } else {
    const existing = db.getAllSync(
      `SELECT * FROM budgets WHERE category = ?;`,
      [category],
    );
    if (existing.length > 0) {
      db.runSync(`UPDATE budgets SET monthly_limit = ? WHERE category = ?;`, [
        limit,
        category,
      ]);
    } else {
      db.runSync(
        `INSERT INTO budgets (category, monthly_limit) VALUES (?, ?);`,
        [category, limit],
      );
    }
  }
}

export function deleteBudget(category: string) {
  if (Platform.OS === "web") {
    const budgets = JSON.parse(localStorage.getItem("vybe_budgets") || "[]");
    localStorage.setItem(
      "vybe_budgets",
      JSON.stringify(budgets.filter((b: any) => b.category !== category)),
    );
  } else {
    db.runSync(`DELETE FROM budgets WHERE category = ?;`, [category]);
  }
}

export function getRecurringBills() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_recurring_bills") || "[]")
    : db.getAllSync(`SELECT * FROM recurring_bills ORDER BY due_day ASC;`);
}

export function addRecurringBill(
  name: string,
  amount: number,
  category: string,
  accountId: number,
  dueDay: number,
) {
  if (Platform.OS === "web") {
    const bills = JSON.parse(
      localStorage.getItem("vybe_recurring_bills") || "[]",
    );
    const newBill = {
      id: Date.now(),
      name,
      amount,
      category,
      account_id: accountId,
      due_day: dueDay,
      active: 1,
    };
    localStorage.setItem(
      "vybe_recurring_bills",
      JSON.stringify([...bills, newBill]),
    );
    return newBill;
  } else {
    db.runSync(
      `INSERT INTO recurring_bills (name, amount, category, account_id, due_day, active) VALUES (?, ?, ?, ?, ?, 1);`,
      [name, amount, category, accountId, dueDay],
    );
    return db.getAllSync(
      `SELECT * FROM recurring_bills ORDER BY id DESC LIMIT 1;`,
    )[0];
  }
}

export function deleteRecurringBill(id: number) {
  if (Platform.OS === "web") {
    const bills = JSON.parse(
      localStorage.getItem("vybe_recurring_bills") || "[]",
    );
    localStorage.setItem(
      "vybe_recurring_bills",
      JSON.stringify(bills.filter((b: any) => b.id !== Number(id))),
    );
  } else {
    db.runSync(`DELETE FROM recurring_bills WHERE id = ?;`, [id]);
  }
}

export function getTransactions() {
  return Platform.OS === "web"
    ? JSON.parse(localStorage.getItem("vybe_transactions") || "[]")
    : db.getAllSync(`SELECT * FROM transactions ORDER BY id DESC;`);
}

export function addTransaction(
  profileId: number,
  accountId: number,
  clientId: number | null,
  type: "in" | "out" | "transfer",
  amount: number,
  originalAmount: number,
  originalCurrency: string,
  exchangeRate: number,
  description: string,
  category: string,
  destAccountId?: number | null,
) {
  const dateStr = new Date().toISOString().split("T")[0];
  if (Platform.OS === "web") {
    const txs = JSON.parse(localStorage.getItem("vybe_transactions") || "[]");
    const accounts = JSON.parse(localStorage.getItem("vybe_accounts") || "[]");

    const newTx = {
      id: Date.now(),
      profile_id: profileId,
      account_id: accountId,
      dest_account_id: destAccountId || null,
      client_id: clientId,
      type,
      amount,
      original_amount: originalAmount,
      original_currency: originalCurrency,
      exchange_rate: exchangeRate,
      description,
      category,
      date: dateStr,
    };
    localStorage.setItem("vybe_transactions", JSON.stringify([newTx, ...txs]));

    const updatedAccounts = accounts.map((acc: any) => {
      if (acc.id === Number(accountId)) {
        return {
          ...acc,
          balance: acc.balance + (type === "in" ? amount : -amount),
        };
      }
      if (
        type === "transfer" &&
        destAccountId &&
        acc.id === Number(destAccountId)
      ) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    });
    localStorage.setItem("vybe_accounts", JSON.stringify(updatedAccounts));
    return newTx;
  } else {
    db.runSync(
      `INSERT INTO transactions (profile_id, account_id, dest_account_id, client_id, type, amount, original_amount, original_currency, exchange_rate, description, category, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        profileId,
        accountId,
        destAccountId || null,
        clientId,
        type,
        amount,
        originalAmount,
        originalCurrency,
        exchangeRate,
        description,
        category,
        dateStr,
      ],
    );

    const mod = type === "in" ? amount : -amount;
    db.runSync(`UPDATE accounts SET balance = balance + ? WHERE id = ?;`, [
      mod,
      accountId,
    ]);
    if (type === "transfer" && destAccountId) {
      db.runSync(`UPDATE accounts SET balance = balance + ? WHERE id = ?;`, [
        amount,
        destAccountId,
      ]);
    }
    return db.getAllSync(
      `SELECT * FROM transactions ORDER BY id DESC LIMIT 1;`,
    )[0];
  }
}

export function updateTransaction(
  id: number,
  newDescription: string,
  newCategory: string,
  newAmount: number,
) {
  if (Platform.OS === "web") {
    const txs = JSON.parse(localStorage.getItem("vybe_transactions") || "[]");
    const accounts = JSON.parse(localStorage.getItem("vybe_accounts") || "[]");
    const oldTx = txs.find((t: any) => t.id === Number(id));
    if (!oldTx) return;

    const diff = newAmount - oldTx.amount;
    const multiplier = oldTx.type === "in" ? 1 : -1;
    const updatedAccounts = accounts.map((acc: any) => {
      if (acc.id === Number(oldTx.account_id)) {
        return { ...acc, balance: acc.balance + diff * multiplier };
      }
      return acc;
    });
    localStorage.setItem("vybe_accounts", JSON.stringify(updatedAccounts));
    localStorage.setItem(
      "vybe_transactions",
      JSON.stringify(
        txs.map((t: any) =>
          t.id === Number(id)
            ? {
                ...t,
                description: newDescription,
                category: newCategory,
                amount: newAmount,
              }
            : t,
        ),
      ),
    );
  } else {
    const oldTx = db.getAllSync(`SELECT * FROM transactions WHERE id = ?;`, [
      id,
    ])[0] as any;
    if (!oldTx) return;
    const diff = newAmount - oldTx.amount;
    const multiplier = oldTx.type === "in" ? 1 : -1;
    db.runSync(`UPDATE accounts SET balance = balance + ? WHERE id = ?;`, [
      diff * multiplier,
      oldTx.account_id,
    ]);
    db.runSync(
      `UPDATE transactions SET description = ?, category = ?, amount = ? WHERE id = ?;`,
      [newDescription, newCategory, newAmount, id],
    );
  }
}

export function deleteTransaction(id: number) {
  if (Platform.OS === "web") {
    const txs = JSON.parse(localStorage.getItem("vybe_transactions") || "[]");
    const accounts = JSON.parse(localStorage.getItem("vybe_accounts") || "[]");
    const target = txs.find((t: any) => t.id === Number(id));
    if (!target) return null;
    const multiplier = target.type === "in" ? -1 : 1;
    const updatedAccounts = accounts.map((acc: any) => {
      if (acc.id === Number(target.account_id)) {
        return { ...acc, balance: acc.balance + target.amount * multiplier };
      }
      return acc;
    });
    localStorage.setItem("vybe_accounts", JSON.stringify(updatedAccounts));
    localStorage.setItem(
      "vybe_transactions",
      JSON.stringify(txs.filter((t: any) => t.id !== Number(id))),
    );
    return target;
  } else {
    const target = db.getAllSync(`SELECT * FROM transactions WHERE id = ?;`, [
      id,
    ])[0] as any;
    if (!target) return null;
    const multiplier = target.type === "in" ? -1 : 1;
    db.runSync(`UPDATE accounts SET balance = balance + ? WHERE id = ?;`, [
      target.amount * multiplier,
      target.account_id,
    ]);
    db.runSync(`DELETE FROM transactions WHERE id = ?;`, [id]);
    return target;
  }
}

export function restoreTransaction(tx: any) {
  if (!tx) return;
  if (Platform.OS === "web") {
    const txs = JSON.parse(localStorage.getItem("vybe_transactions") || "[]");
    const accounts = JSON.parse(localStorage.getItem("vybe_accounts") || "[]");
    localStorage.setItem("vybe_transactions", JSON.stringify([tx, ...txs]));
    const multiplier = tx.type === "in" ? 1 : -1;
    localStorage.setItem(
      "vybe_accounts",
      JSON.stringify(
        accounts.map((acc: any) =>
          acc.id === Number(tx.account_id)
            ? { ...acc, balance: acc.balance + tx.amount * multiplier }
            : acc,
        ),
      ),
    );
  } else {
    db.runSync(
      `INSERT INTO transactions (id, profile_id, account_id, dest_account_id, client_id, type, amount, original_amount, original_currency, exchange_rate, description, category, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        tx.id,
        tx.profile_id,
        tx.account_id,
        tx.dest_account_id || null,
        tx.client_id,
        tx.type,
        tx.amount,
        tx.original_amount,
        tx.original_currency,
        tx.exchange_rate,
        tx.description,
        tx.category,
        tx.date,
      ],
    );
    const multiplier = tx.type === "in" ? 1 : -1;
    db.runSync(`UPDATE accounts SET balance = balance + ? WHERE id = ?;`, [
      tx.amount * multiplier,
      tx.account_id,
    ]);
  }
}

export function exportTransactionsCSV(
  startDate?: string,
  endDate?: string,
): string {
  let txs = getTransactions();
  if (startDate && endDate) {
    txs = txs.filter((t: any) => t.date >= startDate && t.date <= endDate);
  }
  let csv =
    "ID,Type,Source Account,Destination Account,Description,Category,Amount,Original Amount,Currency,Date\n";
  txs.forEach((t: any) => {
    csv += `${t.id},${t.type},${t.account_id},${t.dest_account_id || "N/A"},"${t.description}","${t.category}",${t.amount},${t.original_amount},${t.original_currency},"${t.date}"\n`;
  });
  return csv;
}

export function exportFullBackupJSON(): string {
  return JSON.stringify(
    {
      profiles: getProfiles(),
      accounts: getAccounts(),
      clients: getClients(),
      transactions: getTransactions(),
      recurring_bills: getRecurringBills(),
      categories: getCategories(),
      budgets: getBudgets(),
      currencies: getUserCurrencies(),
      savings_goals: getSavingsGoals(),
      debts: getDebts(),
      invoice_history: getInvoiceHistory(),
      version: "1.0",
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function restoreFullBackupJSON(jsonData: any) {
  if (!jsonData) return;
  if (Platform.OS === "web") {
    if (jsonData.profiles)
      localStorage.setItem("vybe_profiles", JSON.stringify(jsonData.profiles));
    if (jsonData.accounts)
      localStorage.setItem("vybe_accounts", JSON.stringify(jsonData.accounts));
    if (jsonData.clients)
      localStorage.setItem("vybe_clients", JSON.stringify(jsonData.clients));
    if (jsonData.transactions)
      localStorage.setItem(
        "vybe_transactions",
        JSON.stringify(jsonData.transactions),
      );
    if (jsonData.recurring_bills)
      localStorage.setItem(
        "vybe_recurring_bills",
        JSON.stringify(jsonData.recurring_bills),
      );
    if (jsonData.categories)
      localStorage.setItem(
        "vybe_categories",
        JSON.stringify(jsonData.categories),
      );
    if (jsonData.budgets)
      localStorage.setItem("vybe_budgets", JSON.stringify(jsonData.budgets));
    if (jsonData.currencies)
      localStorage.setItem(
        "vybe_user_currencies",
        JSON.stringify(jsonData.currencies),
      );
    if (jsonData.savings_goals)
      localStorage.setItem(
        "vybe_savings_goals",
        JSON.stringify(jsonData.savings_goals),
      );
    if (jsonData.debts)
      localStorage.setItem("vybe_debts", JSON.stringify(jsonData.debts));
    if (jsonData.invoice_history)
      localStorage.setItem(
        "vybe_invoice_history",
        JSON.stringify(jsonData.invoice_history),
      );
  } else {
    // SQLite execution blocks for native restoration
  }
}
