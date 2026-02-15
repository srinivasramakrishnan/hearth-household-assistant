# Bilbo - Your Smart Inventory Assistant

Bilbo is a smart WhatsApp bot that helps you manage your home inventory and pantry. It uses the power of Gemini (Google's AI) to understand your messages and automatically update your shopping lists, track finished items, and keep your pantry organized.

## Features

-   **Smart Pantry Management**: Just tell Bilbo "I finished the milk" or "We need more eggs," and he'll update your list.
-   **Automated Shopping Lists**: Items marked as "Finished" in your pantry are automatically added to your shopping list.
-   **Natural Language Processing**: powered by Gemini, Bilbo understands natural conversation, so you don't need to memorize strict commands.
-   **WhatsApp Integration**: Interact with your inventory directly from your favorite messaging app.
-   **Multi-User Support**: Can distinguish between different family members (requires configuration).

---

## Prerequisites (What you need before starting)

To run this project, you will need a few accounts and tools installed on your computer.

### 1. Accounts
*   **Google Account**: For Firebase and Gemini API.
*   **Twilio Account**: For WhatsApp messaging. [Sign up here](https://www.twilio.com/).
*   **Gemini API Key**: You can get an API key from [Google AI Studio](https://aistudio.google.com/).

### 2. Software
*   **Node.js (Version 20)**: This is the engine that runs the code. [Download Node.js v20 here](https://nodejs.org/en/download/).
*   **Firebase CLI**: A tool to manage your Google/Firebase project from your computer.

---

## Step-by-Step Setup Guide

### Part 1: Install Software

1.  **Install Node.js**: Download and install Node.js (version 20) from the link above.
2.  **Install Firebase CLI**:
    Open your **Terminal** (on Mac) or **Command Prompt** (on Windows) and run this command:
    ```bash
    npm install -g firebase-tools
    ```
    *(Note: You might need to type your computer password if it asks for permission).*

3.  **Login to Firebase**:
    In the same terminal window, run:
    ```bash
    firebase login
    ```
    This will open a browser window. Log in with your Google account.

### Part 2: Download the Project

1.  Download this project code to your computer (unzip if you downloaded a zip file).
2.  Open your Terminal and navigate to the project folder. You can do this by typing `cd ` and dragging the folder into the terminal window, then pressing Enter.
    ```bash
    cd path/to/Bilbo
    ```
3.  Navigate to the `functions` folder:
    ```bash
    cd functions
    ```
4.  Install the project dependencies:
    ```bash
    npm install
    ```

### Part 3: Configure Your Accounts

#### Twilio (WhatsApp)
1.  Log in to your [Twilio Console](https://console.twilio.com/).
2.  Go to **Messaging > Try it out > Send a WhatsApp message**.
3.  Follow the instructions to activate your Sandbox.
4.  Note down your **Account SID** and **Auth Token** from the main dashboard.

#### Gemini (AI)
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Click "Get API key" and create a new key. Copy this key.

### Part 4: Configure Secrets

To keep your keys safe, we use Firebase Secrets. Run the following commands in your terminal (make sure you are inside the `functions` folder):

1.  **Set Twilio Account SID**:
    ```bash
    firebase functions:secrets:set TWILIO_ACCOUNT_SID
    ```
    *(Paste your Twilio Account SID when prompted)*

2.  **Set Twilio Auth Token**:
    ```bash
    firebase functions:secrets:set TWILIO_AUTH_TOKEN
    ```
    *(Paste your Twilio Auth Token when prompted)*
3.  **Set Gemini API Key**:
    ```bash
    firebase functions:secrets:set GEMINI_API_KEY
    ```
    *(Paste your Gemini API Key when prompted)*

### Part 5: Customize the Code (Add Your Phone Numbers)

1.  Open the file `functions/utils/twilio.js` in a text editor (like VS Code or Notepad).
2.  Look for the section that looks like this:
    ```javascript
    const USERS = {
        "whatsapp:+14150000000": "YourName",
        "whatsapp:+14150000001": "OtherName"
    };
    ```
3.  Replace the phone numbers with your own WhatsApp numbers (include the country code, e.g., `+1` for USA).
4.  Replace the names with your names.
5.  Save the file.

### Part 6: Deploy

Now, send your code to the cloud!

1.  Run this command in your terminal (from the `functions` folder or the root folder):
    ```bash
    firebase deploy --only functions
    ```
2.  Wait for the process to complete. It may take a few minutes.
3.  Once finished, it will give you a "Function URL". You specifically need the URL that ends in `whatsappWebhook`.

### Part 7: Connect Twilio to Your Bot

1.  Copy the `whatsappWebhook` URL from the deployment output. It will look like:
    `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/whatsappWebhook`
2.  Go back to your Twilio Console > **Messaging > Settings > WhatsApp Sandbox Settings**.
3.  Paste this URL into the field **"When a message comes in"**.
4.  Save the settings.

---

## Usage

1.  Open WhatsApp and send a message to your Twilio Sandbox number.
2.  Try saying:
    - "I finished the peanut butter."
    - "Add milk to the shopping list."
    - "We ran out of coffee."
3.  Bilbo should reply confirming the action!

## Troubleshooting

-   **No reply?** Check your Twilio logs to see if the message was sent to the webhook.
-   **Error in logs?** Go to the [Firebase Console](https://console.firebase.google.com/), open your project, go to **Functions**, and check the **Logs** tab.
-   **"Unauthenticated"?** Ensure your API keys are correct and you've redeployed after setting secrets.

## Need Help?

If you get stuck, check the Firebase documentation or ask a developer friend for assistance!
