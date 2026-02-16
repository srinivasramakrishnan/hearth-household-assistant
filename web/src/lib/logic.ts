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
