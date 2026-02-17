const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();
const USERS_COLLECTION = "users";

/**
 * Finds or creates a user based on their phone number.
 * @param {string} phoneNumber - E.164 formatted phone number.
 * @param {string} defaultName - Name to use if creating a new user.
 */
async function getOrCreateUserByPhone(phoneNumber, defaultName = "New User") {
    try {
        // 1. Check verified users first
        const snapshot = await db.collection(USERS_COLLECTION)
            .where("phoneNumber", "==", phoneNumber)
            .get();

        if (!snapshot.empty) {
            // Prioritize user with a UID (web user) over ghost users
            const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const linkedUser = users.find(u => u.uid);

            if (linkedUser) {
                return linkedUser;
            }
        }

        // 2. Check Collaborations
        const collabsSnapshot = await db.collection("collaborations")
            .where("phoneNumber", "==", phoneNumber)
            .get();

        if (!collabsSnapshot.empty) {
            const collab = collabsSnapshot.docs[0].data();

            // If found, return the INVITER'S ID as the acting user context, 
            // but with the collaborator's identifier for display if possible.
            // We fetch the Inviter to ensure we have valid user context for database operations.
            const inviterSnapshot = await db.collection(USERS_COLLECTION).doc(collab.inviterId).get();
            if (inviterSnapshot.exists) {
                const inviter = inviterSnapshot.data();
                return {
                    id: collab.inviterId,
                    uid: collab.inviterId, // Crucial for database rules/logic that key off 'uid'
                    email: inviter.email,
                    displayName: collab.inviteeEmail, // Use invitee email as display name for chat
                    isCollaborator: true,
                    collaboratorEmail: collab.inviteeEmail
                };
            }
        }

        if (!snapshot.empty) {
            // If no linked user and no collaborator, return the first found user (likely a ghost user)
            const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            return users[0];
        }

        // Create new user (Ghost User)
        const newUser = {
            phoneNumber,
            displayName: defaultName,
            createdAt: new Date().toISOString(),
            // uid will be null initially for pure WhatsApp users until they link
            uid: null
        };

        const docRef = await db.collection(USERS_COLLECTION).add(newUser);
        logger.info(`Created new user for ${phoneNumber} with ID: ${docRef.id}`);
        return { id: docRef.id, ...newUser };
    } catch (error) {
        logger.error("Error in getOrCreateUserByPhone:", error);
        throw error;
    }
}

/**
 * Gets a user by their Firestore ID.
 * @param {string} userId
 */
async function getUserById(userId) {
    const doc = await db.collection(USERS_COLLECTION).doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
}

module.exports = {
    getOrCreateUserByPhone,
    getUserById
};
