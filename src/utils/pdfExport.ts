import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

const { StorageAccessFramework } = FileSystem;

export interface DownloadPdfOptions {
  html?: string;
  base64?: string;
  remoteUrl?: string;
  fileName: string;
  dialogTitle?: string;
  promptDirectoryPicker?: boolean;
}

export interface DownloadResult {
  canceled?: boolean;
  uri?: string;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sanitizeFileName(name: string): string {
  const cleaned = String(name || "Invoice")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\.]+|[_\.]+$/g, "");
  return (cleaned || "Invoice").slice(0, 80);
}

export function isUserCancelled(error: unknown): boolean {
  const message = String(
    (error as { message?: string })?.message || error || ""
  ).toLowerCase();
  const code = String((error as { code?: string })?.code || "").toLowerCase();
  return (
    message.includes("cancel") ||
    message.includes("dismiss") ||
    code.includes("cancel")
  );
}

export function formatError(error: unknown): string {
  const message = String(
    (error as { message?: string })?.message || error || ""
  ).trim();
  if (!message) return "Unknown error.";
  return message.length > 180 ? `${message.slice(0, 177)}...` : message;
}

export function invoicePdfErrorMessage(error: unknown): string {
  return `Could not process invoice PDF: ${formatError(error)}`;
}

const EXPORT_DIR_FILE = `${FileSystem.documentDirectory || ""}vybe_invoice_export_dir.txt`;

async function readSavedExportDir(): Promise<string | null> {
  if (!FileSystem.documentDirectory) return null;
  try {
    const info = await FileSystem.getInfoAsync(EXPORT_DIR_FILE);
    if (!info.exists) return null;
    const uri = (await FileSystem.readAsStringAsync(EXPORT_DIR_FILE)).trim();
    return uri || null;
  } catch {
    return null;
  }
}

async function rememberExportDir(uri: string): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  try {
    await FileSystem.writeAsStringAsync(EXPORT_DIR_FILE, uri);
  } catch {
    // ignore
  }
}

export async function resetSavedExportDir(): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  try {
    await FileSystem.deleteAsync(EXPORT_DIR_FILE, { idempotent: true });
  } catch {
    // ignore
  }
}

/**
 * Returns a verified local file:// URI pointing to the app's cache or document directory.
 */
export function getPdfSandboxUri(fileName: string): string {
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error(
      "App local storage (cache or document directory) is not available on this device."
    );
  }

  const dirWithSlash = baseDir.endsWith("/") ? baseDir : `${baseDir}/`;
  const sanitizedName = sanitizeFileName(fileName);
  const fullName = sanitizedName.toLowerCase().endsWith(".pdf")
    ? sanitizedName
    : `${sanitizedName}.pdf`;

  const resolved = `${dirWithSlash}${fullName}`;
  return resolved.startsWith("file://") ? resolved : `file://${resolved}`;
}

/**
 * Extract or generate Base64 PDF data from HTML, remote URL, or raw base64.
 */
export async function getPdfBase64(options: DownloadPdfOptions): Promise<string> {
  const rawBase64 = options.base64?.trim();
  if (rawBase64) {
    return rawBase64.replace(/^data:application\/pdf;base64,/, "").trim();
  }

  const remoteUrl = options.remoteUrl?.trim();
  if (remoteUrl) {
    const tempUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory || ""}temp_dl_${Date.now()}.pdf`;
    const res = await FileSystem.downloadAsync(remoteUrl, tempUri);
    if (res.status && res.status >= 400) {
      throw new Error(`Failed to download remote PDF (status ${res.status}).`);
    }
    const b64 = await FileSystem.readAsStringAsync(tempUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    try {
      await FileSystem.deleteAsync(tempUri, { idempotent: true });
    } catch {
      // ignore
    }
    return b64;
  }

  const html = options.html?.trim();
  if (html) {
    const printed = await Print.printToFileAsync({
      html,
      base64: true,
    });

    if (printed.base64) {
      return printed.base64;
    }

    if (printed.uri) {
      const srcUri = printed.uri.startsWith("file://")
        ? printed.uri
        : `file://${printed.uri}`;
      return await FileSystem.readAsStringAsync(srcUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  }

  throw new Error("No PDF content provided (html, base64, or remoteUrl is required).");
}

function downloadBase64OnWeb(base64: string, fileName: string): void {
  if (typeof window === "undefined") return;

  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fullName = fileName.toLowerCase().endsWith(".pdf")
    ? fileName
    : `${fileName}.pdf`;
  link.download = fullName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Verifies that the file exists at localUri and has a non-zero byte size.
 */
async function verifyFileReady(localUri: string): Promise<void> {
  let fileReady = false;
  let fileSize = 0;

  for (let attempt = 0; attempt < 4; attempt++) {
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) {
      const size = "size" in info ? Number(info.size) || 0 : 0;
      if (size > 0) {
        fileReady = true;
        fileSize = size;
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (!fileReady) {
    throw new Error(`The PDF file could not be verified in local sandbox: ${localUri}`);
  }

  if (fileSize <= 0) {
    throw new Error(`The PDF file is empty (0 bytes) at: ${localUri}`);
  }
}

/**
 * DOWNLOAD FLOW: Saves directly to device storage WITHOUT opening the system share drawer.
 *
 * - Android: Triggers native "Save file as..." / directory picker prompt via StorageAccessFramework,
 *   writing directly to the user's selected storage location (e.g. Downloads).
 * - Web: Triggers direct browser download (<a download>) without opening the print dialog.
 * - iOS: Saves directly into DocumentDirectory (accessible via iOS Files app).
 */
export async function downloadInvoicePdf(
  options: DownloadPdfOptions
): Promise<DownloadResult> {
  try {
    const fileName = options.fileName || `Invoice_${Date.now()}`;
    const sanitizedName = sanitizeFileName(fileName);
    const fullName = sanitizedName.toLowerCase().endsWith(".pdf")
      ? sanitizedName
      : `${sanitizedName}.pdf`;

    // 1. Web: Direct browser file download (no print dialog, no share drawer)
    if (Platform.OS === "web") {
      const base64Data = await getPdfBase64(options);
      downloadBase64OnWeb(base64Data, fullName);
      return { canceled: false, uri: fullName };
    }

    // Generate Base64 PDF data
    const base64Data = await getPdfBase64(options);

    // 2. Android: Save directly to user device storage via StorageAccessFramework
    if (Platform.OS === "android" && StorageAccessFramework) {
      let targetDirUri: string | null = null;

      if (!options.promptDirectoryPicker) {
        const saved = await readSavedExportDir();
        if (saved) {
          try {
            const files = await StorageAccessFramework.readDirectoryAsync(saved);
            if (Array.isArray(files)) {
              targetDirUri = saved;
            }
          } catch {
            targetDirUri = null;
          }
        }
      }

      // Prompt native directory picker ("Save file as..." / folder picker)
      if (!targetDirUri) {
        let initialUri: string | null = null;
        try {
          initialUri = StorageAccessFramework.getUriForDirectoryInRoot("Download");
        } catch {
          initialUri = null;
        }

        const permissions =
          await StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);

        if (!permissions.granted || !permissions.directoryUri) {
          return { canceled: true };
        }

        targetDirUri = permissions.directoryUri;
        await rememberExportDir(targetDirUri);
      }

      const nameWithoutExt = fullName.replace(/\.pdf$/i, "");
      const safFileUri = await StorageAccessFramework.createFileAsync(
        targetDirUri,
        nameWithoutExt,
        "application/pdf"
      );

      await FileSystem.writeAsStringAsync(safFileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return { canceled: false, uri: safFileUri };
    }

    // 3. iOS or fallback: Save directly to document directory (accessible in Files app)
    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    if (!baseDir) {
      throw new Error("Local device storage is not available.");
    }
    const dirWithSlash = baseDir.endsWith("/") ? baseDir : `${baseDir}/`;
    const localUri = `${dirWithSlash}${fullName}`;

    await FileSystem.writeAsStringAsync(localUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { canceled: false, uri: localUri };
  } catch (error) {
    if (isUserCancelled(error)) {
      return { canceled: true };
    }
    console.log("PDF direct download error:", error);
    throw error;
  }
}

/**
 * SHARE FLOW: Explicit distinct action that saves to sandbox and opens the native Share drawer.
 */
export async function shareInvoicePdf(
  options: DownloadPdfOptions
): Promise<void> {
  try {
    const fileName = options.fileName || `Invoice_${Date.now()}`;
    const dialogTitle = options.dialogTitle || "Share PDF Invoice";

    const localUri = getPdfSandboxUri(fileName);
    const base64Data = await getPdfBase64(options);

    // Write to app sandbox for sharing
    await FileSystem.writeAsStringAsync(localUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await verifyFileReady(localUri);

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Sharing is not available on this device.");
    }

    await Sharing.shareAsync(localUri, {
      mimeType: "application/pdf",
      dialogTitle,
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    if (isUserCancelled(error)) {
      console.log("PDF share cancelled by user.");
      return;
    }
    console.log("PDF share error:", error);
    throw error;
  }
}
