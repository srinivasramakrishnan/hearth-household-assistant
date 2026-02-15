const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();
const PANTRY_COLLECTION = "pantry";
const SHOPPING_LIST_COLLECTION = "shopping_list";

/**
 * Updates the status of a pantry item.
 * @param {string} item - The name of the item.
 * @param {string} status - 'In Stock', 'Low', or 'Finished'.
 */
async function updatePantryItem(item, status) {
    try {
        // Normalize item name for ID or search
        // For simplicity, we'll search by 'item' field or use a consistent ID generation if desired.
        // Here we'll query because IDs might not be known.
        const snapshot = await db.collection(PANTRY_COLLECTION).where("item", "==", item).limit(1).get();

        let docRef;
        if (snapshot.empty) {
            // Create new if not exists
            docRef = await db.collection(PANTRY_COLLECTION).add({
                item,
                status,
                updated_at: new Date().toISOString()
            });
        } else {
            docRef = snapshot.docs[0].ref;
            await docRef.update({
                status,
                updated_at: new Date().toISOString()
            });
        }

        logger.info(`Pantry item '${item}' updated to '${status}'.`);
        return { success: true, message: `Updated '${item}' to ${status}.` };
    } catch (error) {
        logger.error("Error updating pantry item:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Adds an item to the shopping list.
 * @param {string} item - The name of the item.
 */
async function addToShoppingList(item) {
    try {
        // Check if already in shopping list
        const snapshot = await db.collection(SHOPPING_LIST_COLLECTION).where("item", "==", item).where("purchased", "==", false).limit(1).get();

        if (!snapshot.empty) {
            return { success: true, message: `'${item}' is already in the shopping list.` };
        }

        await db.collection(SHOPPING_LIST_COLLECTION).add({
            item,
            added_at: new Date().toISOString(),
            purchased: false
        });

        logger.info(`Added '${item}' to shopping list.`);
        return { success: true, message: `Added '${item}' to shopping list.` };
    } catch (error) {
        logger.error("Error adding to shopping list:", error);
        return { success: false, error: error.message };
    }
}

async function getPantry() {
    try {
        const snapshot = await db.collection(PANTRY_COLLECTION).get();
        const items = [];
        snapshot.forEach((doc) => items.push(doc.data()));
        return { success: true, items };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getShoppingList() {
    try {
        const snapshot = await db.collection(SHOPPING_LIST_COLLECTION).where("purchased", "==", false).get();
        const items = [];
        snapshot.forEach((doc) => items.push(doc.data()));
        return { success: true, items };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    updatePantryItem,
    addToShoppingList,
    getPantry,
    getShoppingList
};
