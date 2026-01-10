import React from 'react';
import {
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Clock, Award } from 'lucide-react';

interface RetrospectiveAnalysisProps {
  works: any[];
  villages: any[];
}

export function RetrospectiveAnalysis({ works, villages }: RetrospectiveAnalysisProps) {
  const getTalukaPerformance = () => {
    const talukaStats = works.reduce((acc: any, work: any) => {
      const taluka = work.taluka || 'Unknown';
      if (!acc[taluka]) {
        acc[taluka] = {
          name: taluka,
          total: 0,
          completed: 0,
          in_progress: 0,
          pending: 0,
          completion_rate: 0,
        };
      }
      acc[taluka].total += 1;
      if (work.current_status === 'completed') acc[taluka].completed += 1;
      if (work.current_status === 'in_progress') acc[taluka].in_progress += 1;
      if (work.current_status === 'pending') acc[taluka].pending += 1;
      return acc;
    }, {});

    return Object.values(talukaStats).map((t: any) => ({
      ...t,
      completion_rate: t.total > 0 ? ((t.completed / t.total) * 100).toFixed(1) : 0,
    }));
  };

  const getCategoryPerformance = () => {
    const categoryStats = works.reduce((acc: any, work: any) => {
      const category = work.work_category || 'Unknown';
      if (!acc[category]) {
        acc[category] = { category, total: 0, completed: 0 };
      }
      acc[category].total += 1;
      if (work.current_status === 'completed') acc[category].completed += 1;
      return acc;
    }, {});

    const categoryNames: { [key: string]: string } = {
      A: 'Infrastructure',
      B: 'Social Dev',
      C: 'Economic Dev',
      D: 'Environmental',
    };

    return Object.values(categoryStats).map((c: any) => ({
      name: categoryNames[c.category] || c.category,
      total: c.total,
      completed: c.completed,
      rate: c.total > 0 ? ((c.completed / c.total) * 100).toFixed(1) : 0,
    }));
  };

  const getMonthlyTrend = () => {
    const monthCounts = works.reduce((acc: any, work: any) => {
      if (work.added_month && work.added_month.trim()) {
        const month = work.added_month.trim();
        if (!acc[month]) {
          acc[month] = { month, added: 0, completed: 0 };
        }
        acc[month].added += 1;
        if (work.current_status === 'completed') acc[month].completed += 1;
      }
      return acc;
    }, {});

    const monthOrder = [
      'June-2025',
      'August-2025',
      'October-2025',
      'November-2025',
      'December-2025',
      'January-2026',
    ];

    return monthOrder
      .filter((month) => monthCounts[month])
      .map((month) => ({
        month: month.split('-')[0],
        ...monthCounts[month],
      }));
  };

  const getKeyInsights = () => {
    const totalWorks = works.length;
    const completed = works.filter((w) => w.current_status === 'completed').length;
    const pending = works.filter((w) => w.current_status === 'pending').length;
    const inProgress = works.filter((w) => w.current_status === 'in_progress').length;

    const completionRate = totalWorks > 0 ? ((completed / totalWorks) * 100).toFixed(1) : 0;

    const talukaPerf = getTalukaPerformance();
    const bestTaluka = talukaPerf.sort((a, b) => parseFloat(b.completion_rate) - parseFloat(a.completion_rate))[0];
    const worstTaluka = talukaPerf.sort((a, b) => parseFloat(a.completion_rate) - parseFloat(b.completion_rate))[0];

    const monthlyTrend = getMonthlyTrend();
    const peakMonth = monthlyTrend.sort((a, b) => b.added - a.added)[0];

    return {
      totalWorks,
      completed,
      pending,
      inProgress,
      completionRate,
      bestTaluka,
      worstTaluka,
      peakMonth,
    };
  };

  const talukaPerformance = getTalukaPerformance();
  const categoryPerformance = getCategoryPerformance();
  const monthlyTrend = getMonthlyTrend();
  const insights = getKeyInsights();

  const radarData = talukaPerformance.map((t) => ({
    taluka: t.name,
    completion: parseFloat(t.completion_rate),
    efficiency: t.total > 0 ? (t.completed / t.total) * 100 : 0,
    productivity: t.in_progress > 0 ? ((t.in_progress / t.total) * 100) : 5,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <TrendingDown className="w-7 h-7" />
          Retrospective Analysis - Historical Performance
        </h2>
        <p className="text-blue-100">
          Analyzing past performance, trends, and insights from {insights.totalWorks} works across {talukaPerformance.length} talukas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-green-700">{insights.completionRate}%</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Overall Completion Rate</p>
          <p className="text-xs text-gray-600 mt-1">{insights.completed} of {insights.totalWorks} works completed</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-700">{insights.bestTaluka?.name}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Best Performing Taluka</p>
          <p className="text-xs text-gray-600 mt-1">{insights.bestTaluka?.completion_rate}% completion rate</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-200 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-700">{insights.worstTaluka?.name}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Needs Attention</p>
          <p className="text-xs text-gray-600 mt-1">{insights.worstTaluka?.completion_rate}% completion rate</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-700">{insights.peakMonth?.month}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Peak Activity Month</p>
          <p className="text-xs text-gray-600 mt-1">{insights.peakMonth?.added} works added</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Taluka Performance Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={talukaPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="in_progress" fill="#3b82f6" name="In Progress" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Category-wise Success Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="total" fill="#e5e7eb" name="Total Works" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Historical Work Addition Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="added" stroke="#8b5cf6" strokeWidth={3} name="Works Added" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} name="Completed" dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          Multi-Dimensional Performance Radar
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="taluka" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Completion Rate" dataKey="completion" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            <Radar name="Efficiency" dataKey="efficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-300">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Key Historical Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-semibold text-gray-800">Strong Performance</p>
              <p className="text-sm text-gray-600">
                {insights.bestTaluka?.name} leads with {insights.bestTaluka?.completion_rate}% completion rate, setting a benchmark for others.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <p className="font-semibold text-gray-800">Attention Required</p>
              <p className="text-sm text-gray-600">
                {insights.worstTaluka?.name} shows {insights.worstTaluka?.completion_rate}% completion, requiring immediate intervention and support.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <p className="font-semibold text-gray-800">Activity Surge</p>
              <p className="text-sm text-gray-600">
                {insights.peakMonth?.month} saw peak activity with {insights.peakMonth?.added} works initiated, indicating strong planning phase.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="font-semibold text-gray-800">Execution Gap</p>
              <p className="text-sm text-gray-600">
                {insights.pending} works ({((insights.pending / insights.totalWorks) * 100).toFixed(0)}%) remain pending, highlighting execution challenges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
