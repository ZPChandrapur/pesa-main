import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { pesaSupabase } from '../../utils/supabase';

interface DashboardChartsProps {
  userId: string;
  roleName: string;
  villages: any[];
  works: any[];
}

export function DashboardCharts({ userId, roleName, villages, works }: DashboardChartsProps) {
  const [statusData, setStatusData] = useState<any[]>([]);
  const [talukaData, setTalukaData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [gpData, setGpData] = useState<any[]>([]);

  const COLORS = {
    completed: '#10b981',
    in_progress: '#3b82f6',
    pending: '#f59e0b',
    A: '#8b5cf6',
    B: '#ec4899',
    C: '#14b8a6',
    D: '#f97316',
  };

  useEffect(() => {
    if (works && works.length > 0) {
      prepareChartData();
    }
  }, [works]);

  const prepareChartData = () => {
    const statusCounts = works.reduce((acc: any, work: any) => {
      const status = work.current_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusChartData = Object.entries(statusCounts).map(([key, value]) => ({
      name: key === 'completed' ? 'Completed' : key === 'in_progress' ? 'In Progress' : 'Pending',
      value: value,
      color: COLORS[key as keyof typeof COLORS] || '#6b7280',
    }));
    setStatusData(statusChartData);

    const talukaCounts = works.reduce((acc: any, work: any) => {
      const taluka = work.taluka || 'Unknown';
      acc[taluka] = (acc[taluka] || 0) + 1;
      return acc;
    }, {});

    const talukaChartData = Object.entries(talukaCounts)
      .map(([key, value]) => ({
        name: key,
        works: value,
      }))
      .sort((a, b) => (b.works as number) - (a.works as number));
    setTalukaData(talukaChartData);

    const categoryCounts = works.reduce((acc: any, work: any) => {
      const category = work.work_category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const categoryNames: { [key: string]: string } = {
      A: 'Infrastructure',
      B: 'Social Dev',
      C: 'Economic Dev',
      D: 'Environmental',
    };

    const categoryChartData = Object.entries(categoryCounts).map(([key, value]) => ({
      name: categoryNames[key] || key,
      value: value,
      color: COLORS[key as keyof typeof COLORS] || '#6b7280',
    }));
    setCategoryData(categoryChartData);

    const monthCounts = works.reduce((acc: any, work: any) => {
      if (work.added_month) {
        const month = work.added_month.trim();
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    const monthOrder = [
      'January-2026',
      'December-2025',
      'November-2025',
      'October-2025',
      'September-2025',
      'August-2025',
      'July-2025',
      'June-2025',
    ];

    const monthlyChartData = monthOrder
      .filter((month) => monthCounts[month])
      .map((month) => ({
        name: month.split('-')[0],
        works: monthCounts[month],
      }));

    setMonthlyData(monthlyChartData);

    const gpCounts = works.reduce((acc: any, work: any) => {
      const gp = work.pesa_grampanchayat || 'Unknown';
      acc[gp] = (acc[gp] || 0) + 1;
      return acc;
    }, {});

    const gpChartData = Object.entries(gpCounts)
      .map(([key, value]) => ({
        name: key,
        works: value,
      }))
      .sort((a, b) => (b.works as number) - (a.works as number))
      .slice(0, 10);

    setGpData(gpChartData);
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Work Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Work Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Taluka-wise Work Distribution</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={talukaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="works" fill="#10b981" name="Total Works" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Work Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="works"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Works Added"
              dot={{ fill: '#3b82f6', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Top 10 Gram Panchayats by Work Count
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={gpData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="works" fill="#8b5cf6" name="Total Works" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
