
import { GoogleGenAI, Type } from "@google/genai";
import type { Alert, AttackType, Severity, Investigation, BehavioralData, Drone, Threat, ThreatHuntResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const alertSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    timestamp: { type: Type.STRING, description: "ISO 8601 format" },
    src_ip: { type: Type.STRING },
    dst_ip: { type: Type.STRING },
    protocol: { type: Type.STRING, enum: ['TCP', 'UDP', 'ICMP'] },
    attack_type: { type: Type.STRING, enum: ['DoS', 'DDoS', 'Port Scan', 'Bot', 'Web Attack', 'Infiltration', 'Benign', 'Brute Force'] },
    severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
    description: { type: Type.STRING, description: "A brief, one-sentence description of the event." },
  },
  required: ['id', 'timestamp', 'src_ip', 'dst_ip', 'protocol', 'attack_type', 'severity', 'description'],
};

const explanationSchema = {
    type: Type.OBJECT,
    properties: {
        shap_values: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    feature: { type: Type.STRING, description: "Name of the network feature" },
                    contribution: { type: Type.NUMBER, description: "A value from -1 to 1 representing its contribution to the prediction. Positive values indicate suspicion." },
                },
                required: ['feature', 'contribution'],
            }
        },
        lime_summary: {
            type: Type.STRING,
            description: "A human-readable, one-paragraph summary explaining why this alert was triggered, based on local feature importance."
        }
    },
    required: ['shap_values', 'lime_summary']
};

export const generateInitialEvents = async (count: number = 100): Promise<Alert[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of ${count} diverse network intrusion detection alerts. This will be used as a simulated data lake for a SIEM tool. Include a wide variety of attack types (DoS, DDoS, Port Scan, Bot, Web Attack, Infiltration, Benign, Brute Force), severities, protocols, source/destination IPs, and descriptions. Timestamps should be varied over the last 7 days. Ensure high data diversity. All string values, especially in the 'description' field, must be properly escaped to ensure the final output is a valid JSON string.`,
            config: {
                systemInstruction: "You are a professional network security data generator. The data should be realistic, diverse, and consistent. You MUST output valid JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: alertSchema,
                },
            },
        });

        const jsonString = response.text.trim();
        const alerts = JSON.parse(jsonString);

        return alerts.map((alert: any) => ({
            ...alert,
            attack_type: alert.attack_type as AttackType,
            severity: alert.severity as Severity,
        }));
    } catch (error) {
        console.error("Error generating initial events:", error);
        throw new Error("Failed to generate initial events from Gemini API.");
    }
};

export const generateAlerts = async (): Promise<Alert[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a list of 25 diverse network intrusion detection alerts. Include various attack types like DoS, DDoS, Port Scans, and Web Attacks, as well as some Benign traffic. Ensure IPs and timestamps are varied. All string values must be properly escaped for valid JSON.",
            config: {
                systemInstruction: "You are a professional network security data generator. The data should be realistic and consistent. You MUST output valid JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: alertSchema,
                },
            },
        });

        const jsonString = response.text.trim();
        const alerts = JSON.parse(jsonString);

        return alerts.map((alert: any) => ({
            ...alert,
            attack_type: alert.attack_type as AttackType,
            severity: alert.severity as Severity,
        }));
    } catch (error) {
        console.error("Error generating alerts:", error);
        throw new Error("Failed to fetch alerts from Gemini API.");
    }
};

export const generateAlertsFromLogContext = async (fileName: string, fileType: string): Promise<Alert[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `A user has just uploaded a log file named "${fileName}" of type "${fileType}". Based on common threats found in such logs, generate a list of 15 new, unique network intrusion detection alerts that could plausibly be extracted from this file. Provide varied attack types and ensure timestamps are very recent. All string values must be properly escaped for valid JSON.`,
            config: {
                systemInstruction: "You are a professional network security data generator, simulating the output of a log analysis engine. You MUST output valid JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: alertSchema,
                },
            },
        });

        const jsonString = response.text.trim();
        const alerts = JSON.parse(jsonString);

        return alerts.map((alert: any) => ({
            ...alert,
            attack_type: alert.attack_type as AttackType,
            severity: alert.severity as Severity,
        }));

    } catch (error) {
        console.error("Error generating alerts from log context:", error);
        return [];
    }
};


export const generateNewAlerts = async (count: number = 2): Promise<Alert[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of ${count} new, unique network intrusion detection alerts to add to an existing dashboard. Provide varied attack types. Ensure timestamps are very recent. All string values must be properly escaped for valid JSON.`,
            config: {
                systemInstruction: "You are a professional network security data generator. The data should be realistic and consistent. You MUST output valid JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: alertSchema,
                },
            },
        });

        const jsonString = response.text.trim();
        const alerts = JSON.parse(jsonString);

        return alerts.map((alert: any) => ({
            ...alert,
            attack_type: alert.attack_type as AttackType,
            severity: alert.severity as Severity,
        }));
    } catch (error) {
        console.error("Error generating new alerts:", error);
        return [];
    }
};

export const generateExplanation = async (alert: Alert) => {
    try {
        const prompt = `
            For the following network alert, generate a simplified SHAP and LIME explanation.
            - For SHAP, identify the top 5 contributing network features and their contribution scores (positive for suspicious, negative for benign).
            - For LIME, provide a clear, concise summary explaining why this specific event was flagged as ${alert.attack_type}.

            Alert Details:
            - Attack Type: ${alert.attack_type}
            - Severity: ${alert.severity}
            - Source IP: ${alert.src_ip}
            - Destination IP: ${alert.dst_ip}
            - Protocol: ${alert.protocol}
            - Description: ${alert.description}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an Explainable AI (XAI) engine for a Network Intrusion Detection System.",
                responseMimeType: "application/json",
                responseSchema: explanationSchema,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating explanation:", error);
        throw new Error("Failed to fetch explanation from Gemini API.");
    }
};

export const getInvestigationInsights = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert cybersecurity analyst assistant. Provide clear, concise, and actionable advice. Respond in markdown format.",
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting investigation insights:", error);
        return "An error occurred while communicating with the AI assistant.";
    }
};

export const translateNaturalLanguageToQuery = async (nlQuery: string): Promise<string> => {
    const prompt = `
        You are an expert query language translator for a SIEM tool. Convert the user's natural language request into a structured query.
        The query language supports key-value pairs with equality checks. Values with spaces must be quoted. Multiple criteria are combined with 'AND'.
        
        The available fields are:
        - src_ip (e.g., "192.168.1.1")
        - dst_ip (e.g., "8.8.8.8")
        - protocol (e.g., "TCP", "UDP", "ICMP")
        - attack_type (e.g., "DoS", "DDoS", "Port Scan", "Bot", "Web Attack", "Infiltration", "Benign", "Brute Force")
        - severity (e.g., "Critical", "High", "Medium", "Low")

        Here are some examples:
        - User: 'show me all critical DoS attacks' -> severity="Critical" AND attack_type="DoS"
        - User: 'any port scans?' -> attack_type="Port Scan"
        - User: 'traffic from 10.0.0.55' -> src_ip="10.0.0.55"
        - User: 'high severity web attacks' -> severity="High" AND attack_type="Web Attack"
        - User: 'critical and high severity events' -> severity="Critical" OR severity="High"
        
        Now, translate the following user request. Respond ONLY with the translated query string and nothing else.
        
        User Request: "${nlQuery}"
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
             config: {
                // Use a lower temperature for more predictable, structured output
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 0 } // Faster response for this specific task
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating NLQ to query:", error);
        return `error:Failed to translate query`;
    }
};


export const generateSearchSummary = async (query: string, resultsSample: Alert[]): Promise<string> => {
    const prompt = `
        You are a senior cybersecurity analyst tasked with summarizing search results from a SIEM.
        Based on the user's query and a sample of the results, provide a concise, bulleted summary of the key findings.
        Your summary should be in Markdown format.
        
        Focus on:
        - The primary activity observed.
        - The most frequent or notable Source IPs (Top Talkers) and Destination IPs.
        - The distribution of attack types and severities.
        - Any potential patterns or areas that warrant further investigation.

        User's Search Query: \`${query}\`

        Sample of Matching Events:
        \`\`\`json
        ${JSON.stringify(resultsSample, null, 2)}
        \`\`\`

        Generate your summary below.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful cybersecurity analyst assistant."
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating search summary:", error);
        return "### Summary Error\nAn error occurred while generating the AI summary. Please try again.";
    }
};


export const generateInvestigationReport = async (investigation: Investigation): Promise<string> => {
    const getPrimaryThreatDescription = (threat: Threat): string => {
        if ('attack_type' in threat) {
            return `${threat.attack_type} from ${threat.src_ip} (Severity: ${threat.severity})`;
        }
        if ('riskLevel' in threat) {
            return `Behavioral Anomaly for ${threat.userEmail} (Risk: ${threat.riskLevel})`;
        }
        if (threat.type === 'ThreatHuntResult') {
            return `Threat Hunt Result: "${threat.name}"`;
        }
        return 'Unknown Threat';
    };

    const prompt = `
        You are an expert cybersecurity incident response manager. Your task is to generate a formal incident report based on the provided investigation data. The report must be in Markdown format and follow a professional structure.

        **Investigation Data:**
        - **Case ID:** ${investigation.id}
        - **Status:** ${investigation.status}
        - **Primary Threat:** ${getPrimaryThreatDescription(investigation.primaryThreat)}
        - **Investigation Team:** ${investigation.team.map(m => m.email).join(', ')}
        - **Timeframe:** Opened ${investigation.startTime}, Closed ${investigation.endTime || 'N/A'}
        - **Analyst Notes:** ${investigation.notes || 'No notes provided.'}
        - **Evidence Log:** ${investigation.evidence.map(e => `- ${e.name} (${e.type})`).join('\n') || 'No evidence logged.'}
        - **Timeline Summary:** ${investigation.timeline.length} events recorded. Key events include the initial threat and subsequent analyst actions.
        - **Checklist Progress:** Summarize the analyst's findings based on the checklist: ${JSON.stringify(investigation.checklist, null, 2)}

        **Instructions:**
        1.  **Executive Summary:** Write a brief, high-level summary of the incident, its impact, and the outcome.
        2.  **Initial Detection:** Describe the primary alert or anomaly that triggered the investigation.
        3.  **Investigation Narrative:** Based on the timeline, notes, and evidence, construct a chronological story of the investigation. What happened? What did the analysts discover?
        4.  **Key Findings:** Use a bulleted list to highlight the most important discoveries (e.g., identified IOCs, attack vectors, compromised assets).
        5.  **Remediation & Mitigation:** Propose concrete steps for remediation based on the investigation data.
        6.  **Conclusion:** Conclude the report with the final status of the investigation.

        Generate the report now.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a professional cybersecurity incident report writer.",
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating investigation report:", error);
        return "### Report Generation Error\nAn error occurred while generating the AI report. Please try again.";
    }
};

export const generateBehavioralData = async (count: number = 20): Promise<BehavioralData[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of ${count} user behavioral analytics events for a corporate environment. Each event should represent a user's current security posture. 
            - baselineScore: A number between 60 and 95 representing normal behavior.
            - currentScore: A number that deviates from the baseline. Some should be close, others should be far.
            - anomalies: A list of 1-3 short strings describing suspicious activities (e.g., "Off-hours VPN access", "Large data upload to personal cloud", "Multiple failed logins").
            - riskLevel: 'Low', 'Medium', 'High', or 'Critical', based on the severity and number of anomalies.
            Ensure a good distribution of risk levels.`,
            config: {
                systemInstruction: "You are a User and Entity Behavior Analytics (UEBA) data simulator. You MUST output valid JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            userEmail: { type: Type.STRING },
                            baselineScore: { type: Type.INTEGER },
                            currentScore: { type: Type.INTEGER },
                            anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
                            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                        },
                         required: ['id', 'userEmail', 'baselineScore', 'currentScore', 'anomalies', 'riskLevel'],
                    },
                },
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating behavioral data:", error);
        throw new Error("Failed to generate behavioral data from Gemini API.");
    }
};

export const generateDroneData = async (count: number = 8): Promise<Drone[]> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of ${count} autonomous security drones.
            - id: A unique ID like 'ADU-7B'.
            - status: 'Patrolling', 'Responding', 'Charging', or 'Offline'. Ensure variety.
            - location: A plausible sector like 'Perimeter North', 'R&D Wing', 'Rooftop Sector 3'.
            - battery: A percentage between 5 and 100. Drones with 'Charging' status should have low battery.`,
            config: {
                systemInstruction: "You are a security drone fleet data simulator. You MUST output valid JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            status: { type: Type.STRING, enum: ['Patrolling', 'Responding', 'Charging', 'Offline'] },
                            location: { type: Type.STRING },
                            battery: { type: Type.INTEGER },
                        },
                         required: ['id', 'status', 'location', 'battery'],
                    },
                },
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating drone data:", error);
        throw new Error("Failed to generate drone data from Gemini API.");
    }
};

export const generateSopByTopic = async (topic: string): Promise<string> => {
    const prompt = `
        Generate a concise Standard Operating Procedure (SOP) document for the specific cybersecurity topic: "${topic}".
        The response must be in Markdown format.
        The SOP should cover the following key areas:
        1.  **Identification:** How to recognize the threat.
        2.  **Containment:** Immediate steps to limit the damage.
        3.  **Eradication:** How to remove the threat from the environment.
        4.  **Recovery:** Steps to restore systems to normal operation.
        5.  **Post-Incident Analysis:** Key activities for learning from the incident (lessons learned).

        Keep the language clear, professional, and action-oriented. Use headings, bullet points, and bold text for readability.
    `;
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert in creating cybersecurity incident response documents.",
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error generating SOP for topic "${topic}":`, error);
        return `## Error\n\nCould not generate the SOP for "${topic}". Please try again.`;
    }
}
