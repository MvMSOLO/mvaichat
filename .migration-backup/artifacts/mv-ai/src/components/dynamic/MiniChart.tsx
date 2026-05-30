import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props {
  type: "line" | "bar" | "area";
  data: Record<string, any>[];
  xKey: string;
  yKey: string | string[];
  title?: string;
}

const COLORS = ["#a78bfa", "#22d3ee", "#f472b6", "#fbbf24"];

export function MiniChart({ type, data, xKey, yKey, title }: Props) {
  const keys = Array.isArray(yKey) ? yKey : [yKey];
  return (
    <div className="glass rounded-2xl p-4 my-3">
      {title && <div className="text-xs font-semibold mb-2 text-foreground/80">{title}</div>}
      <ResponsiveContainer width="100%" height={220}>
        {type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground)/0.08)" />
            <XAxis dataKey={xKey} stroke="hsl(var(--foreground)/0.5)" fontSize={11} />
            <YAxis stroke="hsl(var(--foreground)/0.5)" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--foreground)/0.15)", borderRadius: 12 }} />
            {keys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
          </LineChart>
        ) : type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground)/0.08)" />
            <XAxis dataKey={xKey} stroke="hsl(var(--foreground)/0.5)" fontSize={11} />
            <YAxis stroke="hsl(var(--foreground)/0.5)" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--foreground)/0.15)", borderRadius: 12 }} />
            {keys.map((k, i) => <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[8, 8, 0, 0]} />)}
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground)/0.08)" />
            <XAxis dataKey={xKey} stroke="hsl(var(--foreground)/0.5)" fontSize={11} />
            <YAxis stroke="hsl(var(--foreground)/0.5)" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--foreground)/0.15)", borderRadius: 12 }} />
            {keys.map((k, i) => <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.25} />)}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
