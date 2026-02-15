const twilio = require("twilio");
const logger = require("firebase-functions/logger");

// TODO: Store these in a config or constants file, or specific users
const USERS = {
    "whatsapp:+14156919214": "Srinivas", // User Provided
    "whatsapp:+14154305669": "Lakshmi" // User Provided
};

// Reverse map for broadcasting
const USER_NUMBERS = Object.keys(USERS);

function getSenderName(fromNumber) {
    return USERS[fromNumber] || "Family Member";
}

async function sendWhatsApp(accountSid, authToken, to, body) {
    const client = twilio(accountSid, authToken);
    try {
        await client.messages.create({
            from: "whatsapp:+14155238886", // Sandbox number or purchased number
            to: to,
            body: body
        });
        logger.info(`Message sent to ${to}`);
    } catch (error) {
        logger.error(`Error sending WhatsApp to ${to}:`, error);
    }
}

async function broadcastUpdate(accountSid, authToken, senderNumber, action) {
    // Determine who to notify (everyone except sender)
    const targets = USER_NUMBERS.filter((num) => num !== senderNumber);
    const senderName = getSenderName(senderNumber);

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
