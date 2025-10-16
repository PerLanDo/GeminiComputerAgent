import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { HistoryLog, GeminiAction } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const computerUseTools: FunctionDeclaration[] = [
    {
        name: 'click_at',
        parameters: {
            type: Type.OBJECT,
            description: 'Clicks the mouse at a specific coordinate.',
            properties: {
                x: { type: Type.NUMBER, description: 'The x-coordinate (from left) of the click.' },
                y: { type: Type.NUMBER, description: 'The y-coordinate (from top) of the click.' },
                description: { type: Type.STRING, description: 'A brief explanation of what is being clicked.' },
            },
            required: ['x', 'y', 'description'],
        },
    },
    {
        name: 'type_text_at',
        parameters: {
            type: Type.OBJECT,
            description: 'Types text at a specific coordinate, usually after clicking an input field.',
            properties: {
                x: { type: Type.NUMBER, description: 'The x-coordinate (from left) of the text input field.' },
                y: { type: Type.NUMBER, description: 'The y-coordinate (from top) of the text input field.' },
                text: { type: Type.STRING, description: 'The text to type.' },
                description: { type: Type.STRING, description: 'A brief explanation of what is being typed and why.' },
            },
            required: ['x', 'y', 'text', 'description'],
        },
    },
    {
        name: 'scroll',
        parameters: {
            type: Type.OBJECT,
            description: 'Scrolls the page up or down.',
            properties: {
                direction: { type: Type.STRING, enum: ['up', 'down'], description: 'The direction to scroll.' },
                description: { type: Type.STRING, description: 'A brief explanation of why scrolling is necessary.' },
            },
            required: ['direction', 'description'],
        },
    },
    {
        name: 'search_web',
        parameters: {
            type: Type.OBJECT,
            description: 'Performs a web search to find information needed to complete the task. Use this if the information is not on the current screen.',
            properties: {
                query: { type: Type.STRING, description: 'The search query.' },
                description: { type: Type.STRING, description: 'A brief explanation of why a web search is needed.' },
            },
            required: ['query', 'description'],
        },
    },
    {
        name: 'finish_task',
        parameters: {
            type: Type.OBJECT,
            description: 'Call this function when the task is successfully completed.',
            properties: {
                reason: { type: Type.STRING, description: 'A summary of how the task was completed.' },
            },
            required: ['reason'],
        },
    },
];


export const getComputerAction = async (
    task: string,
    screenshotBase64: string,
    history: HistoryLog[]
): Promise<{ thought: string; action: GeminiAction | null }> => {
    
    const historyString = history.map(h => {
        let entry = `${h.type}: ${h.content}`;
        if (h.sources) {
            entry += ` (Sources: ${h.sources.map(s => s.title).join(', ')})`;
        }
        return entry;
    }).join('\n');

    const systemInstruction = `You are an expert computer automation agent. Your goal is to complete the user's task by analyzing screenshots of a web browser and deciding the next best action to take.
    The user's overall goal is: "${task}".
    You operate in a loop: you receive a screenshot and the history of previous actions, and you must respond with a single function call representing the next action.
    Think step-by-step. First, describe your reasoning in a "thought" process. Then, call one of the available tools to perform the action.
    Base your decisions on the visual evidence in the screenshot. The coordinates are relative to the screenshot (top-left is 0,0).
    If the information needed to proceed is not visible on the screen, use the 'search_web' tool to find it.
    The history of previous actions is:
    ${historyString}
    
    Analyze the new screenshot and determine the next logical step to achieve the goal: "${task}".
    If the task is complete, call 'finish_task'.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: screenshotBase64,
                        },
                    },
                    {
                        text: `Based on the history and this new screenshot, what is the next single action to get closer to finishing the task: "${task}"?`
                    },
                ],
            },
        ],
        config: {
            systemInstruction,
            tools: [{ functionDeclarations: computerUseTools }],
        },
    });
    
    const thought = response.text || "No thought process provided.";
    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const action: GeminiAction = {
            name: call.name,
            args: call.args,
            description: call.args.description || call.args.reason || `Executing ${call.name}`,
        };
        return { thought, action };
    }

    return { thought, action: null };
};

export const performWebSearch = async (
    query: string
): Promise<{ text: string; sources: { uri: string, title: string }[] }> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find information about: "${query}". Provide a concise summary.`,
        config: {
          tools: [{googleSearch: {}}],
        },
     });

     const text = response.text;
     const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
     const sources = groundingChunks
        .map((chunk: any) => (chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null))
        .filter((source: any): source is { uri: string, title: string } => source !== null);

     return { text, sources };
}
