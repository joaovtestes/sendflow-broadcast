import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const processScheduledMessages = onSchedule(
  "every 1 minutes",
  async () => {
    const now = admin.firestore.Timestamp.now();

    try {
      const snapshot = await db
        .collection("messages")
        .where("status", "==", "AGENDADA")
        .where("scheduledAt", "<=", now)
        .get();

      if (snapshot.empty) {
        return;
      }

      const batch = db.batch();
      let updatedCount = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.deletedAt) return;

        batch.update(doc.ref, {
          status: "ENVIADA",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updatedCount++;
      });

      if (updatedCount > 0) {
        await batch.commit();
      }
      console.log(
        `[Scheduled] Processadas ${updatedCount} mensagens agendadas.`,
      );
    } catch (error) {
      console.error("Erro ao processar mensagens agendadas:", error);
    }
  },
);

export const onMessageCreated = onDocumentCreated(
  "messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const message = snap.data();
    if (message.deletedAt) return;

    if (message.status === "ENVIADA" && message.sentAt) {
      return;
    }

    if (message.status === "AGENDADA" && message.scheduledAt) {
      const scheduledTime =
        typeof message.scheduledAt.toDate === "function" ?
          message.scheduledAt.toDate().getTime() :
          new Date(message.scheduledAt).getTime();

      const now = Date.now();

      if (scheduledTime > now) {
        return;
      }
    }

    await snap.ref.update({
      status: "ENVIADA",
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
);

