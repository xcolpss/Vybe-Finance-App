import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app, auth } from "./firebase";
import * as SQLite from "expo-sqlite";

const db = getFirestore(app);

const getLocalDb = async () => {
  return await SQLite.openDatabaseAsync("vybe_finance.db");
};

export const syncLocalToCloud = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const localDb = await getLocalDb();

    const accounts = await localDb.getAllAsync("SELECT * FROM accounts;");
    const transactions = await localDb.getAllAsync(
      "SELECT * FROM transactions;",
    );
    const clients = await localDb.getAllAsync("SELECT * FROM clients;");
    const budgets = await localDb.getAllAsync("SELECT * FROM budgets;");
    const savingsGoals = await localDb.getAllAsync(
      "SELECT * FROM savings_goals;",
    );
    const debts = await localDb.getAllAsync("SELECT * FROM debts;");

    const userVaultRef = doc(db, "users_vaults", user.uid);

    await setDoc(
      userVaultRef,
      {
        accounts,
        transactions,
        clients,
        budgets,
        savingsGoals,
        debts,
        lastSynced: new Date().toISOString(),
      },
      { merge: true },
    );

    console.log("Cloud Sync: Local vault successfully pushed to Firebase.");
  } catch (error) {
    console.error("Cloud Sync Push Error:", error);
  }
};

export const syncCloudToLocal = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userVaultRef = doc(db, "users_vaults", user.uid);
    const docSnap = await getDoc(userVaultRef);

    if (!docSnap.exists()) {
      await syncLocalToCloud();
      return;
    }

    const cloudData = docSnap.data();
    const localDb = await getLocalDb();

    if (cloudData.accounts && Array.isArray(cloudData.accounts)) {
      for (const acc of cloudData.accounts) {
        await localDb.runAsync(
          `INSERT OR REPLACE INTO accounts (id, profile_id, name, type, balance, currency) VALUES (?, ?, ?, ?, ?, ?);`,
          [
            acc.id,
            acc.profile_id,
            acc.name,
            acc.type,
            acc.balance,
            acc.currency,
          ],
        );
      }
    }

    if (cloudData.transactions && Array.isArray(cloudData.transactions)) {
      for (const tx of cloudData.transactions) {
        await localDb.runAsync(
          `INSERT OR REPLACE INTO transactions (id, profile_id, account_id, client_id, type, amount, original_amount, original_currency, exchange_rate, description, category, dest_account_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            tx.id,
            tx.profile_id,
            tx.account_id,
            tx.client_id,
            tx.type,
            tx.amount,
            tx.original_amount,
            tx.original_currency,
            tx.exchange_rate,
            tx.description,
            tx.category,
            tx.dest_account_id,
            tx.date,
          ],
        );
      }
    }

    console.log(
      "Cloud Sync: Cloud vault successfully pulled and merged locally.",
    );
  } catch (error) {
    console.error("Cloud Sync Pull Error:", error);
  }
};
