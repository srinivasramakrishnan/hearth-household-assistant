# Role
You are an expert Full-Stack Product Engineer specializing in rapid prototyping and "vibe coding." You are tasked with building a mobile-first Grocery and Pantry Management web application based on the specific requirements below.

# Project Context
We are building a tool to bridge the gap between shopping lists and pantry inventory, automating the flow of items between "To Buy" and "In Stock."

# Tech Stack Requirements
- **Frontend:** React (Vite), Tailwind CSS (Mobile-first design).
- **Backend:** Node.js (via Next.js API routes or Express equivalent suitable for the environment).
- **Database & Auth:** Firebase (Firestore & Firebase Auth).
- **Design:** Clean, high-contrast, "Thumb-friendly" UI optimized for mobile web.

# Product Requirements (PRD)

## 1. Core Logic
- **Two Main Views:** "Lists" (Shopping) and "Pantry" (Inventory).
- **Replenishment Logic:** When a user checks an item off a Shopping List (marks as bought), that item must automatically move to the Pantry.
- **Depletion Logic:** When a user removes an item from the Pantry (marks as used):
    - Prompt the user: "Add back to shopping list?"
    - **Smart Routing:** If the item came from a specific list originally, return it there. If unknown, add to a "Default" list.
    - **Preference:** Allow a user setting to auto-add without prompting.

## 2. User Interface & Flow
- **Landing Page:** Simple landing with feature highlights and a "Sign In / Get Started" button (Firebase Auth).
- **Navigation:**
    - Bottom tab bar or top sticky toggle for easy switching between "Lists" and "Pantry".
    - Interactions must be reachable with a thumb (avoid top-left corner buttons for critical actions).
- **Lists View:**
    - Vertical Accordion style.
    - "Add List" button (sticky top or easy reach).
    - Inside accordion: List items with checkboxes.
- **Pantry View:**
    - Group items by their "Source List" (e.g., items bought from "Weekly Groceries" appear under that header).
    - Show availability/count.

# Implementation Plan
Please generate the codebase for this application.

1. **Project Structure:** Set up a React + Vite project structure with Tailwind configured.
2. **Data Model:** Define the TypeScript interfaces for `User`, `List`, `PantryItem`. Note the relationship between a list item and a pantry item (tracking origin).
3. **Components:**
    - Create a reusable `Accordion` component for the lists.
    - Create a `ThumbNav` component for switching views.
    
    - Create the `Auth` wrapper using Firebase SDK.
4. **State/Logic:** Implement the `moveItemToPantry` and `depleteItemFromPantry` functions handling the logic described above.
5. **UI Polish:** Ensure inputs and buttons have large touch targets (min 44px) for mobile usability.

Start by proposing the folder structure and the key data models, then proceed to writing the code for the core views.