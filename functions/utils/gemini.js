const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("firebase-functions/logger");

// Import our tools
const scheduleTools = require("../tools/schedule");
const inventoryTools = require("../tools/inventory");

const tools = {
    addEvent: scheduleTools.addEvent,
    getSchedule: scheduleTools.getSchedule,
    updatePantryItem: inventoryTools.updatePantryItem,
    addToShoppingList: inventoryTools.addToShoppingList
    // TODO: Add querying pantry/shopping list if needed
};

// Define tool schemas for Gemini
const toolDefinitions = [
    {
        function_declarations: [
            {
                name: "addEvent",
                description: "Add an event to the family schedule.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING", description: "Title of the event" },
                        date: { type: "STRING", description: "ISO date string of the event" },
                        type: { type: "STRING", description: "Type: 'one-time' or 'recurring'" },
                        recurrenceRule: { type: "STRING", description: "Recurrence rule (e.g. 'weekly')" }
                    },
                    required: ["title", "date"]
                }
            },
            {
                name: "updatePantryItem",
                description: "Update the status of a pantry item.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        item: { type: "STRING", description: "Name of the item" },
                        status: { type: "STRING", description: "Status: 'In Stock', 'Low', 'Finished'" }
                    },
                    required: ["item", "status"]
                }
            },
            {
                name: "addToShoppingList",
                description: "Add an item manually to the shopping list.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        item: { type: "STRING", description: "Name of the item" }
                    },
                    required: ["item"]
                }
            }
        ]
    }
];

async function processWithGemini(apiKey, userMessage, userId) {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-preview-09-2025",
        systemInstruction: "You are Hearth, a helpful household assistant. You manage the schedule and inventory. Current time is " + new Date().toISOString(),
        tools: toolDefinitions
    });

    const chat = model.startChat({});

    try {
        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        const functionCalls = response.functionCalls();

        let finalResponseText = "";
        let actionTaken = null; // To track if we should broadcast

        if (functionCalls) {
            for (const call of functionCalls) {
                const functionName = call.name;
                const args = call.args;

                logger.info(`Gemini called function: ${functionName}`, args);

                let toolResult;
                if (tools[functionName]) {
                    // Inject createdBy for schedule
                    if (functionName === "addEvent") args.createdBy = userId;

                    toolResult = await tools[functionName](...Object.values(args));
                    actionTaken = { type: functionName, args: args, result: toolResult };
                } else {
                    toolResult = { error: "Function not found" };
                }

                // Send tool result back to model to get final natural language response
                const resultPart = [
                    {
                        functionResponse: {
                            name: functionName,
                            response: { result: toolResult }
                        }
                    }
                ];

                // For simplicity in this v1, we assume one turn of function calling.
                // Proper loop needed for multi-turn resource.
                const finalResult = await chat.sendMessage(resultPart);
                finalResponseText = finalResult.response.text();
            }
        } else {
            finalResponseText = response.text();
        }

        return { text: finalResponseText, actionTaken };
    } catch (error) {
        logger.error("Error communicating with Gemini:", error);
        return { text: "I'm sorry, I had trouble processing your request.", actionTaken: null };
    }
}

module.exports = {
    processWithGemini
};
