/**
 * Import function triggers from their respective submodules.
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

// Define Secrets
const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Import Triggers
const inventoryTriggers = require("./triggers/inventoryTriggers");

// Export Triggers
exports.onPantryUpdate = inventoryTriggers.onPantryUpdate;

const { handleIncomingMessage } = require("./utils/buffer");
const { getSenderName } = require("./utils/twilio");

// Placeholder for the main webhook
exports.whatsappWebhook = onRequest(
    { secrets: [twilioAccountSid, twilioAuthToken, geminiApiKey], timeoutSeconds: 60 },
    async (req, res) => {
        logger.info("Received WhatsApp message", { headers: req.headers, body: req.body });

        const from = req.body.From;
        const body = req.body.Body;

        if (!from || !body) {
            res.status(400).send("Missing From or Body");
            return;
        }

        const senderName = getSenderName(from);
        logger.info(`Message from ${senderName} (${from}): ${body}`);

        // Handoff to Buffer Logic (which handles Gemini + Reply + Broadcast)
        // We don't await this if we want to return 200 OK fast to Twilio?
        // Twilio waits for response. We should await to ensure execution or use background function.
        // Since we are sleeping 5s, we must ensure Twilio timeout (15s) isn't hit.
        // 5s sleep + processing < 15s. Should be safe.

        try {
            await handleIncomingMessage(from, body, {
                geminiApiKey,
                twilioAccountSid,
                twilioAuthToken
            });
        } catch (error) {
            logger.error("Error processing message:", error);
        }

        res.status(200).type("text/xml").send("<Response></Response>");
    });


// Export helper functions (optional, mainly for testing/direct calling if needed)
// calls to scheduleTools can go here if we want to expose them as individual functions,
// but they will primarily be called by Gemini via the webhook logic.
