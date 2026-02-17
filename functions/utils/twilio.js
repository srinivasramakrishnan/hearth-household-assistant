const twilio = require("twilio");
const logger = require("firebase-functions/logger");
const { getOrCreateUserByPhone } = require("./user");

async function getSenderName(fromNumber) {
    try {
        const user = await getOrCreateUserByPhone(fromNumber);
        return user.displayName || "Family Member";
    } catch (error) {
        logger.error(`Error getting sender name for ${fromNumber}:`, error);
        return "Family Member";
    }
}

async function sendWhatsApp(accountSid, authToken, to, body) {
    const client = twilio(accountSid, authToken);
    try {
        await client.messages.create({
            from: "whatsapp:+14155238886", // Sandbox number or purchased number
            to: to,
            body: body
        });

        // Store outgoing message
        const admin = require("firebase-admin");
        const db = admin.firestore();
        await db.collection("messages").add({
            userId: to,
            text: body,
            direction: "out",
            timestamp: Date.now()
        });

        logger.info(`Message sent to ${to}`);
    } catch (error) {
        logger.error(`Error sending WhatsApp to ${to}:`, error);
    }
}

async function broadcastUpdate(accountSid, authToken, senderNumber, action) {
    // Get all users to determine who to notify
    const admin = require("firebase-admin");
    const db = admin.firestore();

    const snapshot = await db.collection("users").get();
    const targets = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.phoneNumber && data.phoneNumber !== senderNumber) {
            targets.push(data.phoneNumber);
        }
    });

    const senderName = await getSenderName(senderNumber);

    let message = "";
    if (action.type === "addEvent") {
        message = `📅 *Schedule Update*: ${senderName} added event "${action.args.title}" on ${action.args.date.split("T")[0]}.`;
    } else if (action.type === "addToShoppingList") {
        message = `grocery_cart *Shopping List*: ${senderName} added "${action.args.item}".`;
    } else if (action.type === "updatePantryItem" && action.args.status === "Finished") {
        message = `⚠️ *Pantry Alert*: ${senderName} marked "${action.args.item}" as finished.`;
    }

    if (message) {
        for (const target of targets) {
            await sendWhatsApp(accountSid, authToken, target, message);
        }
    }
}

module.exports = {
    getSenderName,
    sendWhatsApp,
    broadcastUpdate
};
