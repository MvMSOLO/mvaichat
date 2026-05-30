import { fetch } from "expo/fetch";

const MCP_URL = "https://mcp.expo.dev/mcp";

interface MCPTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

interface MCPCallResult {
  content: string;
  text?: string;
  error?: string;
}

const EXPOTOOLS: MCPTool[] = [
  { name: "expo.init", description: "Initialize Expo project" },
  { name: "expo.start", description: "Start Expo dev server" },
  { name: "expo.build", description: "Build Expo app" },
  { name: "expo.publish", description: "Publish to Expo" },
  { name: "expo.install", description: "Install Expo package" },
  { name: "expo.scan", description: "Scan QR code for testing" },
];

export async function callMCP(
  tool: string,
  args: Record<string, any> = {}
): Promise<MCPCallResult> {
  try {
    const resp = await fetch(MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: tool, params: args }),
    });
    
    if (!resp.ok) {
      return { content: "", error: `MCP error: ${resp.status}` };
    }
    
    const data = await resp.json();
    return {
      content: data.content || data.result || JSON.stringify(data),
      text: data.text,
    };
  } catch (e: any) {
    return { content: "", error: e.message || "MCP call failed" };
  }
}

export function getExpotools(): MCPTool[] {
  return EXPOTOOLS;
}