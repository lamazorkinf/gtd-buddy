import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

export function initializeFirebase(): void {
  if (!getApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is required");
    }

    let serviceAccount: object;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT must be a valid JSON string");
    }

    if (!("project_id" in serviceAccount)) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT must contain project_id");
    }

    app = initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0])
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
}

export function getDb(): Firestore {
  if (!db) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return db;
}
