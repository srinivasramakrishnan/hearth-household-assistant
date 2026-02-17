const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { getOrCreateUserByPhone } = require("../utils/user");

const db = getFirestore();
const PANTRY_COLLECTION = "pantry";
const LISTS_COLLECTION = "lists";
const ITEMS_COLLECTION = "items";

/**
 * Updates the status of a pantry item.
 * @param {string} item - The name of the item.
 * @param {string} status - 'In Stock', 'Low', or 'Finished'.
 * @param {string} phoneNumber - The phone number of the user (optional, for ownership).
 */
async function updatePantryItem(item, status, phoneNumber = null) {
    try {
        // Find cached user or create dummy if phoneNumber provided
        let userId = null;
        if (phoneNumber) {
            const user = await getOrCreateUserByPhone(phoneNumber);
            userId = user.id;
        }

        // Normalize item name for ID or search
        const snapshot = await db.collection(PANTRY_COLLECTION).where("item", "==", item).limit(1).get();

        let docRef;
        if (snapshot.empty) {
            // Create new if not exists
            const newItem = {
                item,
                status,
                updated_at: new Date().toISOString()
            };
            if (userId) newItem.userId = userId;

            docRef = await db.collection(PANTRY_COLLECTION).add(newItem);
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
 * Adds an item to the shopping list with smart classification.
 * @param {string} item - The name of the item.
 * @param {string|null} listName - Optional specific list name.
 * @param {string} phoneNumber - The phone number of the user adding the item.
 */
async function addToShoppingList(item, listName, phoneNumber) {
    try {
        let userId = "system";
        let userEmail = "";

        if (phoneNumber) {
            const user = await getOrCreateUserByPhone(phoneNumber);
            userId = user.uid || user.id;
            userEmail = user.email || "";
        }

        const normalizedItem = item.trim().toLowerCase();
        let targetListName = listName ? listName.trim() : null;
        let targetListId = null;

        // Smart Classification Logic
        if (!targetListName) {
            // Check classification logs
            const logId = `${userId}_${normalizedItem.replace(/\s+/g, '_')}`;
            const logDoc = await db.collection("classification_logs").doc(logId).get();

            if (logDoc.exists) {
                // Found a previous classification!
                const logData = logDoc.data();
                // We need to verify if this list still exists
                const listDoc = await db.collection(LISTS_COLLECTION).doc(logData.defaultListId).get();
                if (listDoc.exists) {
                    targetListId = logData.defaultListId;
                    targetListName = listDoc.data().name;
                    logger.info(`Smart Classification: '${item}' auto-assigned to '${targetListName}'`);
                }
            }

            // Fallback to "General" if no log found or list deleted
            if (!targetListId) {
                targetListName = "General";
            }
        }

        // Find or Create the Target List
        if (!targetListId) {
            // Try to find list by name for this user
            const listSnapshot = await db.collection(LISTS_COLLECTION)
                .where("userId", "==", userId)
                .where("name", "==", targetListName)
                .limit(1)
                .get();

            if (!listSnapshot.empty) {
                targetListId = listSnapshot.docs[0].id;
            } else {
                // Create new list
                const newList = {
                    name: targetListName,
                    createdAt: Date.now(),
                    userId: userId,
                    ownerEmail: userEmail,
                    collaborators: []
                };
                const listRef = await db.collection(LISTS_COLLECTION).add(newList);
                targetListId = listRef.id;
                logger.info(`Created new list '${targetListName}' for user ${userId}`);
            }
        }

        // Update Classification Log (Learn preference)
        // We do this every time an item is added to a specific list
        if (userId !== "system") {
            const logId = `${userId}_${normalizedItem.replace(/\s+/g, '_')}`;
            await db.collection("classification_logs").doc(logId).set({
                userId,
                itemName: normalizedItem,
                defaultListId: targetListId,
                lastUpdated: Date.now()
            });
        }

        // Add item to 'items' collection
        // Check for duplicates in the SAME list
        const itemSnapshot = await db.collection(ITEMS_COLLECTION)
            .where("listId", "==", targetListId)
            .where("name", "==", item) // Keep original casing for display
            .where("isBought", "==", false)
            .limit(1)
            .get();

        if (!itemSnapshot.empty) {
            return { success: true, message: `'${item}' is already in the '${targetListName}' list.` };
        }

        await db.collection(ITEMS_COLLECTION).add({
            listId: targetListId,
            name: item,
            isBought: false,
            addedAt: Date.now(),
            userId: userId
        });

        logger.info(`Added '${item}' to list '${targetListName}' (${targetListId}).`);
        return { success: true, message: `Added '${item}' to your '${targetListName}' list.` };
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

// Deprecated or needs update if we want to support 'read' via WhatsApp
// For now, leaving as placeholder or limited implementation
async function getShoppingList() {
    return { success: true, items: [], message: "Reading list not fully supported in unified schema yet." };
}

module.exports = {
    updatePantryItem,
    addToShoppingList,
    getPantry,
    getShoppingList
};
