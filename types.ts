export interface GeminiAction {
    name: string;
    args: {
        [key: string]: any;
    };
    description: string;
}

export interface HistoryLog {
    type: 'user' | 'thought' | 'action' | 'system' | 'error' | 'search_result';
    content: string;
    details?: GeminiAction;
    sources?: { uri: string, title: string }[];
}

export enum AgentStatus {
    IDLE = "Idle",
    TAKING_SCREENSHOT = "Capturing Screen...",
    THINKING = "Thinking...",
    SEARCHING = "Searching the web...",
    EXECUTING = "Executing Action...",
    FINISHED = "Task Finished",
}
