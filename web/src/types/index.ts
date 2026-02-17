export interface UserPreferences {
    autoAddBackToShoppingList: boolean;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    phoneNumber?: string;
    photoURL?: string | null;
    role: 'admin' | 'user';
    isApproved: boolean;
    preferences?: UserPreferences;
}

export interface ShoppingList {
    id: string;
    name: string;
    createdAt: number;
    userId: string;
    ownerEmail?: string;
    collaborators?: string[]; // Array of UIDs
}

export interface ListItem {
    id: string;
    listId: string;
    name: string;
    isBought: boolean;
    quantity?: number;
    unit?: string;
    addedAt: number;
}

export interface PantryItem {
    id: string;
    name: string;
    quantity: number;
    unit?: string;
    sourceListId?: string; // Original list it came from
    sourceListName?: string; // Name of the source list for display
    lastUpdated: number;
    userId: string;
}
