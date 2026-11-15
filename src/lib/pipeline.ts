// src/lib/pipeline.ts — DreamForge automated media pipeline
//
// NEW file. Do not confuse with src/lib/dreamforge.ts — that file is
// the MODES / CREW / SKIT data for the app, and is untouched.
//
// What this does, honestly:
//  - Resolves PC vs S24 Ultra AT SAVE TIME via getIsExecutingOnPC()
//  - Calls the generator API at /generate/image or /generate/video
//  - Saves the returned asset for real (not a path string):
//      PC    -> File System Access API, falling back to a download
//      Phone -> IndexedDB private bucket, until a native bridge
//               (bridge.py, POST /save) is wired in
//
// What it does NOT do yet:
//  - There is NO generator wired in. bridge.py returns 501 for
//    /generate/* until GENERATOR_URL is set, and this function
//    reports that clearly instead of pretending an asset was made.
//    Tell Git-er-Done what generates the image/video (local model
//    server, Ollama, an API, etc.) and that handler gets wired in.

import { getIsExecutingOnPC, getGeneratorApiUrl } from "../config/environment";
import { ACTIVE_DEPLOYMENT_MODE, ENGINE_MODES } from "./engine-modes";

export type GenerationType = "image" | "video";

export interface GenerationState {
  isGenerating: boolean;
  mode: GenerationType;
  outputUrl: string | null;
}

export interface StorageReceipt {
  success: boolean;
  savedPath: string;
  targetEnvironment: "s24_ultra_local" | "pc_sandbox" | "public_gallery";
}

function base64ToBlob(base64Data: string, type: GenerationType): Blob {
  const mime = type === "video" ? "video/mp4" : "image/jpeg";
  const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

async function saveBlobToIndexedDB(fileName: string, blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("dreamforge-private-outputs", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("assets");
    };
    req.onsuccess = () => {
      const tx = req.result.transaction("assets", "readwrite");
      tx.objectStore("assets").put(blob, fileName);
      tx.oncomplete = () => resolve(`indexeddb://dreamforge-private-outputs/${fileName}`);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function autoSaveGeneratedAsset(
  fileName: string,
  base64Data: string,
  type: GenerationType = "image"
): Promise<StorageReceipt> {
  const isPC = getIsExecutingOnPC();
  const blob = base64ToBlob(base64Data, type);

  if (ACTIVE_DEPLOYMENT_MODE === ENGINE_MODES.UNRESTRICTED_DEVELOPER_SANDBOX) {
    if (isPC) {
      try {
        const handle = await (
          window as unknown as {
            showSaveFilePicker?: (opts: { suggestedName: string }) => Promise<{
              createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }>;
            }>;
          }
        ).showSaveFilePicker?.({ suggestedName: fileName });
        if (handle) {
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return {
            success: true,
            savedPath: `PC://Pictures/Dreamforge_Sandbox_Outputs/${fileName}`,
            targetEnvironment: "pc_sandbox",
          };
        }
      } catch {
        // Picker cancelled or unavailable — fall through to download.
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return {
        success: true,
        savedPath: `download://${fileName}`,
        targetEnvironment: "pc_sandbox",
      };
    }

    const savedPath = await saveBlobToIndexedDB(fileName, blob);
    return { success: true, savedPath, targetEnvironment: "s24_ultra_local" };
  }

  const savedPath = await saveBlobToIndexedDB(fileName, blob);
  return { success: true, savedPath, targetEnvironment: "public_gallery" };
}

export async function triggerAutomatedMediaPipeline(
  prompt: string,
  type: GenerationType,
  onProgress: (state: Partial<GenerationState>) => void
): Promise<void> {
  const baseApiUrl = getGeneratorApiUrl();
  const targetUrl =
    type === "image" ? `${baseApiUrl}/generate/image` : `${baseApiUrl}/generate/video`;

  onProgress({ isGenerating: true, mode: type, outputUrl: null });

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, timestamp: Date.now() }),
    });

    if (!response.ok) {
      throw new Error(`Generation pass failed with status ${response.status}`);
    }
    const data = await response.json();

    if (typeof data?.base64Raw !== "string" || data.base64Raw.length === 0) {
      throw new Error("Generator API did not return base64Raw");
    }

    const fileExtension = type === "video" ? "mp4" : "jpg";
    const computedFileName = `forge_${Date.now()}.${fileExtension}`;

    const storageReceipt = await autoSaveGeneratedAsset(
      computedFileName,
      data.base64Raw,
      type
    );
    console.log(`[DreamForge] Asset saved -> ${storageReceipt.savedPath}`);
    onProgress({ isGenerating: false, outputUrl: storageReceipt.savedPath });
  } catch (error) {
    console.error(`[DreamForge] Pipeline failed: ${error}`);
    onProgress({ isGenerating: false, outputUrl: null });
    throw error;
  }
}
