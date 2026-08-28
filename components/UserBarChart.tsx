// "use client";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
// } from "recharts";

// interface UserData {
//   createdAt: string;
// }

// interface GroupedData {
//   date: string;
//   count: number;
// }

// const groupUsersByDate = (users: UserData[]) => {
//   const grouped: Record<string, number> = {};
//   users.forEach((user) => {
//     const date = new Date(user.createdAt).toLocaleDateString();
//     grouped[date] = (grouped[date] || 0) + 1;
//   });
//   return Object.entries(grouped).map(([date, count]) => ({ date, count }));
// };

// const UserBarChart = ({ users }: { users: UserData[] }) => {
//   const data = groupUsersByDate(users);

//   return (
//     <div className="w-full h-[300px]">
//       <h2 className="text-lg font-semibold mb-2">Users Registered Over Time</h2>
//       <ResponsiveContainer width="100%" height="100%">
//         <BarChart data={data}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="date" />
//           <YAxis allowDecimals={false} />
//           <Tooltip />
//           <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default UserBarChart;

"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UserData {
  createdAt: string;
}

const groupUsersByDate = (users: UserData[]) => {
  const grouped: Record<string, number> = {};
  users.forEach((user) => {
    const date = new Date(user.createdAt).toLocaleDateString("en-IN");
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
};

const UserBarChart = ({ users }: { users: UserData[] }) => {
  const data = groupUsersByDate(users);

  return (
    <div className="w-full h-[200px] bg-white rounded-2xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#ec4899"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserBarChart;
