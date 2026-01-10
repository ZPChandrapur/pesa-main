import React from 'react';
import { Building2, Users, TrendingUp, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface DashboardKPIsProps {
  totalVillages: number;
  totalPopulation: number;
  stPopulation: number;
  activeProjects: number;
  distributedFunds: number;
  completedWorksCount: number;
  totalWorksCount: number;
  overallProgress: number;
  talukaCount: number;
  grampanchayatCount: number;
}

export function DashboardKPIs({
  totalVillages,
  totalPopulation,
  stPopulation,
  activeProjects,
  distributedFunds,
  completedWorksCount,
  totalWorksCount,
  overallProgress,
  talukaCount,
  grampanchayatCount,
}: DashboardKPIsProps) {
  const pendingWorks = totalWorksCount - completedWorksCount;
  const completionRate = totalWorksCount > 0 ? ((completedWorksCount / totalWorksCount) * 100).toFixed(1) : 0;

  const kpis = [
    {
      title: 'Total Talukas',
      value: talukaCount,
      icon: Building2,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Gram Panchayats',
      value: grampanchayatCount,
      icon: MapPin,
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200',
    },
    {
      title: 'PESA Villages',
      value: totalVillages,
      icon: MapPin,
      color: 'bg-teal-50 text-teal-600',
      borderColor: 'border-teal-200',
    },
    {
      title: 'Total Population',
      value: totalPopulation > 1000000
        ? `${(totalPopulation / 1000000).toFixed(2)}M`
        : totalPopulation.toLocaleString(),
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      title: 'ST Population',
      value: stPopulation > 1000000
        ? `${(stPopulation / 1000000).toFixed(2)}M`
        : stPopulation.toLocaleString(),
      icon: Users,
      color: 'bg-pink-50 text-pink-600',
      borderColor: 'border-pink-200',
    },
    {
      title: 'Distributed Funds',
      value: `₹${(distributedFunds / 10000000).toFixed(2)}Cr`,
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Total Works',
      value: totalWorksCount,
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-600',
      borderColor: 'border-indigo-200',
    },
    {
      title: 'Completed Works',
      value: completedWorksCount,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200',
    },
    {
      title: 'Active Projects',
      value: activeProjects,
      icon: Clock,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Pending Works',
      value: pendingWorks,
      icon: AlertCircle,
      color: 'bg-amber-50 text-amber-600',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200',
    },
    {
      title: 'Overall Progress',
      value: `${overallProgress}%`,
      icon: TrendingUp,
      color: 'bg-cyan-50 text-cyan-600',
      borderColor: 'border-cyan-200',
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Key Performance Indicators</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-md border-2 ${kpi.borderColor} p-6 hover:shadow-lg transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
