
import { GoogleGenAI } from "@google/genai";
import type { Role } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateSopPrompt = (role: Role) => `
    Generate a concise Standard Operating Procedure (SOP) document for a '${role}' in a Network Intrusion Detection System (NIDS) team.
    The response must be in Markdown format.
    The SOP should cover the following key areas appropriate for the role:
    1.  **Primary Responsibilities:** A brief summary of the role's main duties.
    2.  **Daily Tasks:** A checklist of routine activities (e.g., dashboard review, alert triage).
    3.  **Alert Handling Protocol:** Step-by-step instructions on how to handle a new, critical alert.
    4.  **Investigation Workflow:** Key phases of an investigation (e.g., Triage, Analysis, Reporting). For an Admin, this might be more about oversight and resource allocation.
    5.  **Escalation Path:** Clear instructions on when and to whom to escalate an incident.
    6.  **Tool Usage:** Brief mention of key tools (e.g., NIDS Dashboard, Log Ingestion, Investigation Workbench).

    Keep the language clear, professional, and action-oriented. Use headings, bullet points, and bold text for readability.
`;

const generateAssistantPrompt = (sopContent: string, question: string) => `
    You are an AI assistant for a cybersecurity team. Your knowledge base is the following Standard Operating Procedure document.
    Based *only* on the information in the SOP provided below, answer the user's question concisely.
    If the answer is not in the SOP, state that the procedure is not covered in the current documentation.

    --- SOP DOCUMENT ---
    ${sopContent}
    --- END SOP DOCUMENT ---

    User's Question: "${question}"
`;


export const sopService = {
    async generateSopForRole(role: Role): Promise<string> {
        try {
            const prompt = generateSopPrompt(role);
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    systemInstruction: "You are an expert in creating cybersecurity operational documents.",
                },
            });
            return response.text.trim();
        } catch (error) {
            console.error("Error generating SOP:", error);
            return "## Error\n\nCould not generate the Standard Operating Procedure. Please check the API configuration.";
        }
    },
    
    async querySopAssistant(sopContent: string, question: string): Promise<string> {
         try {
            const prompt = generateAssistantPrompt(sopContent, question);
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                 config: {
                    // Disable thinking for faster, more direct answers based on the provided text
                    thinkingConfig: { thinkingBudget: 0 }
                }
            });
            return response.text.trim();
        } catch (error) {
            console.error("Error querying SOP assistant:", error);
            return "An error occurred while communicating with the AI assistant.";
        }
    }
};
