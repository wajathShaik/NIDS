
import { GoogleGenAI, Type } from "@google/genai";
import { alertSchema } from './schemas';
import type { Alert, AttackType, Severity } from '../types';


if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const toolPrompts: Record<string, (target: string) => { systemInstruction: string; contents: string }> = {
    'Nmap': (target) => ({
        systemInstruction: "You are the Nmap (Network Mapper) command-line tool. Generate a realistic scan report for the given target. The output should be formatted exactly like the real Nmap tool's text output, including the header, discovered ports with state, service, and version, and the final summary. Use common ports and services for the simulation.",
        contents: `nmap -sV -A ${target}`
    }),
    'Nessus': (target) => ({
        systemInstruction: "You are the Nessus vulnerability scanner. Generate a summary report for a scan against the given target. The output must be in well-structured Markdown. For each finding, include a Plugin ID, a CVE if applicable, a severity (Critical, High, Medium, Low, Info), a synopsis, a detailed description of the vulnerability, and a solution.",
        contents: `Generate a Nessus vulnerability scan report for ${target}.`
    }),
    'Wireshark': (target) => ({
        systemInstruction: "You are a network analyst summarizing a Wireshark capture. Generate a summary of a hypothetical packet capture related to the target. Describe the most common protocols seen (e.g., TCP, DNS, HTTP/S), any suspicious conversations between IPs, and notable findings like unencrypted traffic or error packets. The output should be a human-readable summary in Markdown.",
        contents: `Summarize a Wireshark capture file involving traffic to and from ${target}.`
    }),
    'Burp Suite': (target) => ({
        systemInstruction: "You are the Burp Suite web vulnerability scanner. Generate a summary report of findings for the web application at the given target. The output must be in well-structured Markdown. Detail at least 3-5 common web vulnerabilities (e.g., SQL Injection, Cross-Site Scripting, Insecure Direct Object References) with severity, a description of the issue, and a clear remediation plan.",
        contents: `Generate a Burp Suite vulnerability scan report for the web application at ${target}.`
    }),
    'Metasploit': (target) => ({
        systemInstruction: "You are the Metasploit Framework console. Simulate the process of finding and checking a relevant exploit for a service running on the target. Your output should mimic the text-based console output of Metasploit, showing commands like 'search', 'use', 'show options', 'set RHOSTS', and 'check' or 'run'. The exploit should be plausible but clearly marked as a simulation.",
        contents: `Simulate a Metasploit session targeting a known vulnerability on ${target}.`
    }),
    'John the Ripper': (target) => ({
        systemInstruction: "You are the John the Ripper password cracker tool. Simulate the output of running 'john' on a hypothetical password hash file from the target system. Show the loading process, session details, and a list of a few plausibly cracked passwords with their corresponding usernames.",
        contents: `Simulate running John the Ripper on a password file from ${target}.`
    })
};


export const virtualSocService = {
    async runVirtualTool(toolName: string, target: string): Promise<string> {
        const promptGenerator = toolPrompts[toolName];
        if (!promptGenerator) {
            throw new Error(`Tool "${toolName}" is not supported.`);
        }

        const { systemInstruction, contents } = promptGenerator(target);

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents,
                config: {
                    systemInstruction,
                    temperature: 0.5, // Lower temperature for more consistent, tool-like output
                },
            });
            return response.text.trim();
        } catch (error) {
            console.error(`Error running virtual tool ${toolName}:`, error);
            return `// ERROR: Failed to generate a response from the AI for ${toolName}.`;
        }
    },

    async parseReportToAlerts(report: string, toolName: string, target: string): Promise<Alert[]> {
        const prompt = `
            You are an expert security data parsing engine. Read the following simulated report from the tool "${toolName}" for the target "${target}".
            Your task is to extract any findings with a "Critical" or "High" severity and convert them into structured security alert JSON objects.
            For each high-impact finding, create one alert.
            - The 'attack_type' should be a reasonable classification of the finding (e.g., 'Web Attack' for XSS, 'Infiltration' for an exposed RDP port).
            - The 'description' should be a concise summary of the vulnerability.
            - The 'src_ip' should be a plausible attacker IP (e.g., from a known public block), and 'dst_ip' should be the target.
            - The timestamp should be the current time.

            Report to Parse:
            ---
            ${report}
            ---
        `;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    systemInstruction: "You are a data extraction and parsing engine. You MUST output valid JSON based on the provided schema.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: alertSchema,
                    },
                },
            });
            const jsonString = response.text.trim();
            const alerts: any[] = JSON.parse(jsonString);
            return alerts.map(alert => ({
                ...alert,
                attack_type: alert.attack_type as AttackType,
                severity: alert.severity as Severity,
            }));

        } catch (error) {
            console.error("Error parsing report to alerts:", error);
            throw new Error("The AI failed to parse the report into structured alerts.");
        }
    }
};