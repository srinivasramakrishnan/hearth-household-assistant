const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();
const COLLECTION_NAME = "family_schedule";

/**
 * Adds an event to the family schedule via Gemini tool call.
 * @param {string} title - The title of the event.
 * @param {string} date - ISO date string of the event.
 * @param {string} type - 'one-time' or 'recurring'.
 * @param {string} recurrenceRule - Optional recurrence rule (e.g., 'weekly').
 * @param {string} createdBy - The sender's ID (phone number).
 */
async function addEvent(title, date, type = "one-time", recurrenceRule = null, createdBy = "system") {
    try {
        const eventData = {
            title,
            date: new Date(date).toISOString(),
            type,
            created_at: new Date().toISOString(),
            created_by: createdBy
        };

        if (type === "recurring" && recurrenceRule) {
            eventData.recurrence_rule = recurrenceRule;
        }

        const docRef = await db.collection(COLLECTION_NAME).add(eventData);
        logger.info(`Event created with ID: ${docRef.id}`);
        return { success: true, id: docRef.id, message: `Event '${title}' added for ${date}.` };
    } catch (error) {
        logger.error("Error adding event:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Retrieves events from the family schedule for a given date range.
 * @param {string} startDate - ISO date string for start.
 * @param {string} endDate - ISO date string for end.
 */
async function getSchedule(startDate, endDate) {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const snapshot = await db.collection(COLLECTION_NAME)
            .where("date", ">=", start.toISOString())
            .where("date", "<=", end.toISOString())
            .get();

        if (snapshot.empty) {
            return { success: true, events: [], message: `No events found between ${startDate} and ${endDate}.` };
        }

        const events = [];
        snapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });

        // TODO: Handle recurring events expansion if needed, for simplicity we just fetch stored dates
        // A robust recurring system would need a separate 'occurrences' expansion logic.

        return { success: true, events: events };
    } catch (error) {
        logger.error("Error fetching schedule:", error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    addEvent,
    getSchedule
};
