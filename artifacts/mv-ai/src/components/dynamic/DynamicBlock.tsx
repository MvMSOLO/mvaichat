import { StatCardGrid } from "./StatCard";
import { LinkPreviewList } from "./LinkPreview";
import { MiniChart } from "./MiniChart";
import { CodeRunner } from "./CodeRunner";

/**
 * AI can embed visual blocks using:
 *   ```mvai
 *   { "type": "stats", "items": [...] }
 *   ```
 */
export function DynamicBlock({ raw }: { raw: string }) {
  let data: any;
  try { data = JSON.parse(raw); } catch {
    return <pre className="text-xs text-rose-400 p-2">Invalid mvai block</pre>;
  }
  switch (data.type) {
    case "stats":
      return <StatCardGrid stats={data.items || []} />;
    case "links":
    case "sources":
      return <LinkPreviewList links={data.items || []} />;
    case "chart":
      return <MiniChart type={data.chart || "line"} data={data.data || []} xKey={data.xKey || "x"} yKey={data.yKey || "y"} title={data.title} />;
    case "run":
      return <CodeRunner code={data.code || ""} language={data.language || "jsx"} />;
    default:
      return <pre className="text-xs text-foreground/60 p-2">Unknown block: {data.type}</pre>;
  }
}
