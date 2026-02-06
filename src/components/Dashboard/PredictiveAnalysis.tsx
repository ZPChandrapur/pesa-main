import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
} from 'recharts';
import { TrendingUp, Target, AlertCircle, Zap, Calendar, DollarSign, Activity } from 'lucide-react';

interface PredictiveAnalysisProps {
  works: any[];
  villages: any[];
}

export function PredictiveAnalysis({ works, villages }: PredictiveAnalysisProps) {
  const calculateCompletionRate = () => {
    const completed = works.filter((w) => w.current_status === 'completed').length;
    return works.length > 0 ? completed / works.length : 0;
  };

  const getHistoricalMonthlyCompletion = () => {
    const monthCounts = works.reduce((acc: any, work: any) => {
      if (work.added_month && work.added_month.trim()) {
        const month = work.added_month.trim();
        if (!acc[month]) {
          acc[month] = { added: 0, completed: 0 };
        }
        acc[month].added += 1;
        if (work.current_status === 'completed') acc[month].completed += 1;
      }
      return acc;
    }, {});

    const validMonths = Object.keys(monthCounts)
      .filter((m) => monthCounts[m].completed > 0)
      .sort();

    if (validMonths.length === 0) return 0;

    const avgCompletion =
      validMonths.reduce((sum, month) => sum + monthCounts[month].completed, 0) / validMonths.length;

    return avgCompletion;
  };

  const predictFutureCompletions = () => {
    const pending = works.filter((w) => w.current_status === 'pending').length;
    const inProgress = works.filter((w) => w.current_status === 'in_progress').length;
    const monthlyCompletionRate = getHistoricalMonthlyCompletion();

    const futureMonths = ['Feb-2026', 'Mar-2026', 'Apr-2026', 'May-2026', 'Jun-2026'];
    let remainingWorks = pending + inProgress;

    return futureMonths.map((month, index) => {
      const expectedCompletion = Math.min(
        Math.ceil(monthlyCompletionRate * (1 + index * 0.1)),
        remainingWorks
      );
      remainingWorks -= expectedCompletion;

      return {
        month,
        expected: expectedCompletion,
        remaining: Math.max(0, remainingWorks),
        cumulative: (pending + inProgress) - remainingWorks,
      };
    });
  };

  const calculateTalukaRisk = () => {
    const talukaStats = works.reduce((acc: any, work: any) => {
      const taluka = work.taluka || 'Unknown';
      if (!acc[taluka]) {
        acc[taluka] = {
          name: taluka,
          total: 0,
          completed: 0,
          pending: 0,
          delayed: 0,
        };
      }
      acc[taluka].total += 1;
      if (work.current_status === 'completed') acc[taluka].completed += 1;
      if (work.current_status === 'pending') acc[taluka].pending += 1;
      if (work.delay && work.delay !== '' && work.delay !== '0') acc[taluka].delayed += 1;
      return acc;
    }, {});

    return Object.values(talukaStats).map((t: any) => {
      const completionRate = t.total > 0 ? (t.completed / t.total) * 100 : 0;
      const pendingRate = t.total > 0 ? (t.pending / t.total) * 100 : 0;
      const delayRate = t.total > 0 ? (t.delayed / t.total) * 100 : 0;

      let riskScore = 0;
      if (completionRate < 10) riskScore += 40;
      else if (completionRate < 20) riskScore += 30;
      else if (completionRate < 30) riskScore += 20;

      if (pendingRate > 80) riskScore += 30;
      else if (pendingRate > 60) riskScore += 20;
      else if (pendingRate > 40) riskScore += 10;

      riskScore += delayRate * 0.3;

      const riskLevel =
        riskScore > 70 ? 'Critical' : riskScore > 50 ? 'High' : riskScore > 30 ? 'Medium' : 'Low';

      return {
        name: t.name,
        riskScore: Math.min(100, Math.round(riskScore)),
        riskLevel,
        pending: t.pending,
        completionRate: completionRate.toFixed(1),
      };
    });
  };

  const forecastBudget = () => {
    const totalBudget = works.reduce((sum, work) => {
      const amount = Number(work.agreement_approval_amount) || Number(work.admin_approval_amount) || 0;
      return sum + amount;
    }, 0);

    const completedBudget = works
      .filter((w) => w.current_status === 'completed')
      .reduce((sum, work) => {
        const amount = Number(work.agreement_approval_amount) || Number(work.admin_approval_amount) || 0;
        return sum + amount;
      }, 0);

    const pendingBudget = totalBudget - completedBudget;
    const monthlyBurnRate = completedBudget / 4;

    const futureMonths = ['Feb-2026', 'Mar-2026', 'Apr-2026', 'May-2026', 'Jun-2026'];
    let remaining = pendingBudget;

    return futureMonths.map((month) => {
      const projected = Math.min(monthlyBurnRate * 1.2, remaining);
      remaining -= projected;
      return {
        month,
        projected: Math.round(projected / 100000),
        remaining: Math.round(remaining / 100000),
      };
    });
  };

  const getCompletionForecast = () => {
    const totalWorks = works.length;
    const completed = works.filter((w) => w.current_status === 'completed').length;
    const pending = works.filter((w) => w.current_status === 'pending').length;

    const currentRate = totalWorks > 0 ? (completed / totalWorks) * 100 : 0;
    const monthlyCompletionRate = getHistoricalMonthlyCompletion();

    const monthsToComplete = monthlyCompletionRate > 0 ? Math.ceil(pending / monthlyCompletionRate) : 0;

    const projectedCompletion30Days = Math.min(100, currentRate + (monthlyCompletionRate / pending) * 100);
    const projectedCompletion90Days = Math.min(100, currentRate + ((monthlyCompletionRate * 3) / pending) * 100);

    return {
      currentRate,
      monthsToComplete,
      projectedCompletion30Days,
      projectedCompletion90Days,
      monthlyRate: monthlyCompletionRate,
    };
  };

  const futureCompletions = predictFutureCompletions();
  const talukaRisk = calculateTalukaRisk();
  const budgetForecast = forecastBudget();
  const completionForecast = getCompletionForecast();

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical':
        return '#dc2626';
      case 'High':
        return '#f97316';
      case 'Medium':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Zap className="w-7 h-7" />
          Predictive Analysis - Future Forecasts & Insights
        </h2>
        <p className="text-purple-100">
          AI-powered predictions and forecasts based on historical trends and current patterns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border-2 border-cyan-200 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-cyan-600" />
            <span className="text-3xl font-bold text-cyan-700">{completionForecast.monthsToComplete}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Months to 100% Completion</p>
          <p className="text-xs text-gray-600 mt-1">At current pace</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-green-700">
              {completionForecast.projectedCompletion30Days.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-700">30-Day Projection</p>
          <p className="text-xs text-gray-600 mt-1">Expected completion rate</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-blue-700">
              {completionForecast.projectedCompletion90Days.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-700">90-Day Projection</p>
          <p className="text-xs text-gray-600 mt-1">Expected completion rate</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-purple-700">
              {completionForecast.monthlyRate.toFixed(0)}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Works/Month Rate</p>
          <p className="text-xs text-gray-600 mt-1">Historical average</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Predicted Work Completion Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={futureCompletions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="cumulative"
                fill="#10b981"
                stroke="#10b981"
                fillOpacity={0.3}
                name="Cumulative Completed"
              />
              <Bar dataKey="expected" fill="#3b82f6" name="Expected Monthly" />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Remaining Works"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Taluka Risk Assessment
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={talukaRisk} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="riskScore" name="Risk Score">
                {talukaRisk.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskLevel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Budget Utilization Forecast (in Lakhs)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={budgetForecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="projected"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Projected Spend"
            />
            <Area
              type="monotone"
              dataKey="remaining"
              stackId="2"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.3}
              name="Remaining Budget"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {talukaRisk.map((taluka, index) => (
          <div
            key={index}
            className={`p-5 rounded-xl shadow-md border-2 ${
              taluka.riskLevel === 'Critical'
                ? 'bg-red-50 border-red-300'
                : taluka.riskLevel === 'High'
                ? 'bg-orange-50 border-orange-300'
                : taluka.riskLevel === 'Medium'
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-green-50 border-green-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-gray-800">{taluka.name}</h4>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  taluka.riskLevel === 'Critical'
                    ? 'bg-red-600 text-white'
                    : taluka.riskLevel === 'High'
                    ? 'bg-orange-600 text-white'
                    : taluka.riskLevel === 'Medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                {taluka.riskLevel} Risk
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Score:</span>
                <span className="font-bold text-gray-800">{taluka.riskScore}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-bold text-gray-800">{taluka.completionRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending Works:</span>
                <span className="font-bold text-gray-800">{taluka.pending}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-300">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-600" />
          AI-Powered Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">Accelerate Execution</p>
                <p className="text-sm text-gray-600">
                  Increase monthly completion rate from {completionForecast.monthlyRate.toFixed(0)} to{' '}
                  {(completionForecast.monthlyRate * 1.5).toFixed(0)} works to meet targets by{' '}
                  {Math.ceil(completionForecast.monthsToComplete * 0.67)} months.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">Priority Intervention</p>
                <p className="text-sm text-gray-600">
                  {talukaRisk.find((t) => t.riskLevel === 'Critical')?.name || talukaRisk[0]?.name} requires immediate
                  attention with {talukaRisk.find((t) => t.riskLevel === 'Critical')?.pending || 0} pending works.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">Resource Reallocation</p>
                <p className="text-sm text-gray-600">
                  Deploy additional resources to low-performing areas to improve completion rates from{' '}
                  {completionForecast.currentRate.toFixed(0)}% to 50% within 90 days.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">Budget Monitoring</p>
                <p className="text-sm text-gray-600">
                  Monitor budget utilization closely as projected spend indicates completion of all pending works within{' '}
                  {budgetForecast.length} months.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
