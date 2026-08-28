import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type VisitorData = {
  _id: string; // Example: "2025-04-26" (the date)
  count: number; // Example: 12
};

export default function VisitorsChart() {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    async function fetchVisitors() {
      const res = await fetch("/api/visitor?page=1&limit=100");
      const result = await res.json();
      const visitors: VisitorData[] = result.visitors || [];
      //   console.log(visitors); // Check the format of the returned data

      // Map the API response to the format expected by the chart
      setData(
        visitors.map((v: VisitorData) => ({
          date: v._id,
          count: v.count,
        })),
      );
    }
    fetchVisitors();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Visitors per Day</h2>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f472b6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
          <YAxis
            allowDecimals={false}
            domain={[0, "dataMax + 1"]} // Adjust based on your max value
            tickCount={5} // Matches the image showing 0-4
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#f472b6"
            fillOpacity={1}
            fill="url(#colorVisitors)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
