const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore();
const SHOPPING_LIST_COLLECTION = "shopping_list";

/**
 * Trigger: When a pantry item is updated.
 * Logic: If status changes to 'Finished', add to shopping list.
 */
exports.onPantryUpdate = onDocumentWritten("pantry/{docId}", async (event) => {
    const newDat = event.data.after.data();
    const oldDat = event.data.before.data();

    // If deleted, do nothing
    if (!newDat) return;

    // Check if status changed to 'Finished'
    // Also handle new documents created with status 'Finished'
    const isFinished = newDat.status === "Finished";
    const wasFinished = oldDat && oldDat.status === "Finished";

    if (isFinished && !wasFinished) {
        const item = newDat.item;
        logger.info(`Item '${item}' finished. Adding to shopping list.`);

        try {
            // Check if already in shopping list (to avoid duplicates)
            const snapshot = await db.collection(SHOPPING_LIST_COLLECTION)
                .where("item", "==", item)
                .where("purchased", "==", false)
                .limit(1)
                .get();

            if (snapshot.empty) {
                await db.collection(SHOPPING_LIST_COLLECTION).add({
                    item: item,
                    added_at: new Date().toISOString(),
                    purchased: false,
                    auto_added: true // Metadata to show it came from the trigger
                });
                logger.info(`Successfully added '${item}' to shopping list.`);
            } else {
                logger.info(`'${item}' already in shopping list. Skipping.`);
            }
        } catch (error) {
            logger.error("Error adding to shopping list from trigger:", error);
        }
    }
});
