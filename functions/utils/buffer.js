const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { processWithGemini } = require("./gemini");
const { sendWhatsApp, broadcastUpdate } = require("./twilio");

const db = getFirestore();
const BUFFER_COLLECTION = "message_buffers";
const DEBOUNCE_MS = 5000;

/**
 * Handles incoming message with debouncing.
 * @param {string} userId - The phone number of the sender.
 * @param {string} text - The message text.
 * @param {object} secrets - Object containing secret values (api keys).
 */
async function handleIncomingMessage(userId, text, secrets) {
    const bufferRef = db.collection(BUFFER_COLLECTION).doc(userId);

    // 1. Add message to buffer and update timestamp
    await db.runTransaction(async (t) => {
        const doc = await t.get(bufferRef);
        const now = Date.now();
        const data = doc.exists ? doc.data() : { messages: [] };

        const newMessages = [...(data.messages || []), text];

        t.set(bufferRef, {
            messages: newMessages,
            last_timestamp: now
        }, { merge: true });
    });

    logger.info(`Buffered message from ${userId}. Waiting ${DEBOUNCE_MS}ms...`);

    // 2. Wait for debounce period (Serverless "Sleep and Check" pattern)
    // Note: This holds the function execution. Ensure timeout is sufficient.
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS));

    // 3. Check if we should process
    // We re-read the doc to see if a newer message came in
    const doc = await bufferRef.get();
    if (!doc.exists) return; // Already processed?

    const data = doc.data();
    const lastTimestamp = data.last_timestamp;
    const now = Date.now();
    const timeSinceLast = now - lastTimestamp;

    // Allow some small buffer for execution delay (e.g. 100ms jitter)
    if (timeSinceLast < (DEBOUNCE_MS - 500)) {
        logger.info(`Debounce: Newer message detected for ${userId} (diff=${timeSinceLast}ms). Exiting.`);
        return;
    }

    if (data.messages.length === 0) {
        return; // Empty
    }

    // 4. Process!
    logger.info(`Processing ${data.messages.length} messages for ${userId}...`);

    // Consolidate messages
    const fullText = data.messages.join("\n");

    // Clear buffer IMMEDIATELY to prevent double processing
    // We use a transaction to ensure we only clear if we are the robust winner,
    // but simplified: just clear messages.
    await bufferRef.update({ messages: [] });

    // Execute Gemini Logic
    const apiKey = secrets.geminiApiKey.value();
    const accountSid = secrets.twilioAccountSid.value();
    const authToken = secrets.twilioAuthToken.value();

    const result = await processWithGemini(apiKey, fullText, userId);

    // Send Validated Response
    await sendWhatsApp(accountSid, authToken, userId, result.text);

    // Broadcast if needed
    if (result.actionTaken) {
        await broadcastUpdate(accountSid, authToken, userId, result.actionTaken);
    }
}

module.exports = {
    handleIncomingMessage
};
