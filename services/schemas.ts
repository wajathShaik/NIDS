
import { Type } from "@google/genai";

export const alertSchema = {
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