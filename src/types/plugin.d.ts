interface SystemApi {
}

interface AssistantTypeApi {
    typeRegist(code: number, label: string, plugin: TeaAssistantTypePlugin): void;
    changeFieldLabel(fieldName: string, label: string): void;
    addField(fieldName: string, label: string, type: string, fieldConfig?: FieldConfig): void;
    forceFieldValue(fieldName: string, value: string): void;
    addFieldTips(fieldName: string, tips: string): void;
    runLogic(callback: (assistantRunApi: AssistantRunApi) => void): void;
}

interface FieldConfig {
    // default none
    position?: 'query' | 'body' | 'header' | 'none';
    // default false
    required?: boolean;
    // default false
    hidden?: boolean;
    tips?: string;
}

interface AssistantRunApi {
    askAI(question: string, modelId: string, prompt?: string, conversationId?: string): AskAiResponse;
    askAssistant(question: string, assistantId: string, conversationId?: string, 
        onCustomUserMessage?: (question: string, assistantId: string, conversationId?: string) => any, 
        onCustomUserMessageComing?: (aiResponse: AiResponse) => void,
        onStreamMessageListener?: (payload: string, aiResponse: AiResponse, responseIsResponsingFunction: (isFinish: boolean) => void) => void): Promise<AiResponse>;
    getUserInput(): string;
    getModelId(): string;
    getAssistantId(): string;
    getField(fieldName: string): string;
    appendAiResponse(messageId: number, response: string): void;
    setAiResponse(messageId: number, response: string): void;
}

interface AiResponse {
    conversation_id: number;
    add_message_id: number;
    request_prompt_result_with_context: string;
}

declare class AskAiResponse {
    answer: string;
}

declare class Config {
    name: string;
    type: string[];
}

declare class TeaPlugin {
    onPluginLoad(systemApi: SystemApi): void;
    renderComponent?(): React.ReactNode;
    config(): Config;
}

declare class TeaAssistantTypePlugin {
    onAssistantTypeInit(assistantTypeApi: AssistantTypeApi): void;
    onAssistantTypeSelect(assistantTypeApi: AssistantTypeApi): void;
    onAssistantTypeRun(assistantRunApi: AssistantRunApi): void;
}