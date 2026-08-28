"use client";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  // CartesianGrid,
  Legend,
} from "recharts";
import { useDashboardStore } from "@/store/dashboard";
import dayjs from "dayjs";

const COLORS = ["#ec4899", "#f472b6", "#facc15", "#34d399", "#60a5fa"];

export default function DashboardCharts() {
  const { orders, users, products, newsletters, queries } = useDashboardStore();

  const groupByDate = (items: { createdAt: string }[]) => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const date = dayjs(item.createdAt).format("YYYY-MM-DD");
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  };

  const orderData = useMemo(() => groupByDate(orders), [orders]);
  const userData = useMemo(() => groupByDate(users), [users]);
  const productData = useMemo(() => groupByDate(products), [products]);
  const queryData = useMemo(() => groupByDate(queries), [queries]);

  return (
    <div className="relative z-0 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <ChartCard title="Orders Booked per Day">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={orderData}>
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="New Users per Day">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={userData}>
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#34d399"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Products Added per Day">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={productData}>
            <defs>
              <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#facc15" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#facc15"
              fillOpacity={1}
              fill="url(#colorProd)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Customer Queries per Day">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={queryData}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#60a5fa"
              fill="#dbeafe"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Newsletter Subscriptions">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={[
                { name: "Subscribers", value: newsletters.length },
                {
                  name: "Non-subscribers",
                  value: users.length - newsletters.length,
                },
              ]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#f472b6"
              label
            >
              {COLORS.map((color, index) => (
                <Cell key={index} fill={color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-0 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-md font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}
