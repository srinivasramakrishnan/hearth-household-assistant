import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    increment,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import type { ListItem, PantryItem } from '../types';

export const moveItemToPantry = async (userId: string, item: ListItem, listName: string) => {
    try {
        // 1. Mark as bought in the list
        const itemRef = doc(db, 'items', item.id);
        await updateDoc(itemRef, { isBought: true });

        // 2. Add to pantry (deduplicating)
        const pantryRef = collection(db, 'pantry');
        const q = query(
            pantryRef,
            where('userId', '==', userId),
            where('sourceListId', '==', item.listId),
            where('name', '==', item.name)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Update existing
            const existingItem = snapshot.docs[0];
            await updateDoc(existingItem.ref, {
                quantity: increment(item.quantity || 1),
                lastUpdated: Date.now()
            });
        } else {
            // Create new
            await addDoc(pantryRef, {
                name: item.name,
                quantity: item.quantity || 1,
                unit: item.unit || '',
                sourceListId: item.listId,
                sourceListName: listName,
                lastUpdated: Date.now(),
                userId: userId
            });
        }
    } catch (error) {
        console.error("Error moving item to pantry:", error);
        throw error;
    }
};

export const depleteItemFromPantry = async (userId: string, item: PantryItem, addBackToList: boolean = false) => {
    try {
        // 1. Remove from pantry (or decrement)
        const itemRef = doc(db, 'pantry', item.id);
        if (item.quantity > 1) {
            await updateDoc(itemRef, { quantity: increment(-1), lastUpdated: Date.now() });
        } else {
            await deleteDoc(itemRef);
        }

        // 2. Add back to shopping list if requested
        if (addBackToList) {
            const listId = item.sourceListId || 'default';
            const itemsRef = collection(db, 'items');

            // Check if item already exists in the list (unbought)
            const q = query(
                itemsRef,
                where('listId', '==', listId),
                where('name', '==', item.name),
                where('isBought', '==', false)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                // Increment existing
                await updateDoc(snapshot.docs[0].ref, {
                    quantity: increment(1)
                });
            } else {
                // Create new
                await addDoc(itemsRef, {
                    name: item.name,
                    listId: listId,
                    isBought: false,
                    quantity: 1,
                    addedAt: Date.now(),
                    userId: userId
                });
            }
        }
    } catch (error) {
        console.error("Error depleting item from pantry:", error);
        throw error;
    }
};

export const undoMoveToPantry = async (userId: string, item: ListItem) => {
    try {
        // 1. Mark as NOT bought in the list
        const itemRef = doc(db, 'items', item.id);
        await updateDoc(itemRef, { isBought: false });

        // 2. Remove from pantry (decrement/delete)
        const pantryRef = collection(db, 'pantry');
        const q = query(
            pantryRef,
            where('userId', '==', userId),
            where('sourceListId', '==', item.listId),
            where('name', '==', item.name)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const existingItem = snapshot.docs[0];
            const currentQty = existingItem.data().quantity || 1;

            if (currentQty > 1) {
                await updateDoc(existingItem.ref, {
                    quantity: increment(-(item.quantity || 1)),
                    lastUpdated: Date.now()
                });
            } else {
                await deleteDoc(existingItem.ref);
            }
        }
    } catch (error) {
        console.error("Error undoing move to pantry:", error);
        throw error;
    }
};

export const incrementPantryItem = async (item: PantryItem) => {
    try {
        const itemRef = doc(db, 'pantry', item.id);
        await updateDoc(itemRef, {
            quantity: increment(1),
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error("Error incrementing pantry item:", error);
        throw error;
    }
};

// --- CRUD Operations ---

export const updateShoppingItemQuantity = async (itemId: string, delta: number) => {
    try {
        const itemRef = doc(db, 'items', itemId);
        await updateDoc(itemRef, {
            quantity: increment(delta),
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error("Error updating shopping item quantity:", error);
        throw error;
    }
};

export const deleteShoppingItem = async (itemId: string) => {
    try {
        await deleteDoc(doc(db, 'items', itemId));
    } catch (error) {
        console.error("Error deleting shopping item:", error);
        throw error;
    }
};

export const deletePantryItem = async (itemId: string) => {
    try {
        await deleteDoc(doc(db, 'pantry', itemId));
    } catch (error) {
        console.error("Error deleting pantry item:", error);
        throw error;
    }
};

export const updateShoppingItem = async (itemId: string, data: Partial<ListItem>) => {
    try {
        await updateDoc(doc(db, 'items', itemId), {
            ...data,
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error("Error updating shopping item:", error);
        throw error;
    }
};

export const updatePantryItem = async (itemId: string, data: Partial<PantryItem>) => {
    try {
        await updateDoc(doc(db, 'pantry', itemId), {
            ...data,
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error("Error updating pantry item:", error);
        throw error;
    }
};
