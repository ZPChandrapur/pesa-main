import React, { useEffect, useState } from 'react';
import { MapPin, Building2, Banknote, TrendingUp, Users, CheckCircle, Calendar, Clock, Target, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { villageService } from '../../utils/supabase';
import { pesaWorkOperations } from '../../utils/supabase';

export function Dashboard() {
  const { t, language } = useLanguage();

  const [totalVillages, setTotalVillages] = useState(0);
  const [totalPopulation, setTotalPopulation] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [distributedFunds, setDistributedFunds] = useState(0);
  const [completedWorksCount, setCompletedWorksCount] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalWorksCount, setTotalWorksCount] = useState(0);
  const [recentWorks, setRecentWorks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const villages = await villageService.getAll();
        setTotalVillages(villages.length);

        const populationSum = villages.reduce(
          (sum, v) => sum + (Number(v.village_population) || 0),
          0
        );
        setTotalPopulation(populationSum);

        const allWorks = await pesaWorkOperations.getAll();
        if (allWorks && allWorks.length > 0) {
          setTotalWorksCount(allWorks.length);

          const activeProjectsCount = allWorks.filter(work => work.current_status !== 'completed').length;
          setActiveProjects(activeProjectsCount);

          const fundsSum = allWorks.reduce((sum, work) => {
            const adminAmount = Number(work.admin_approval_amount) || 0;
            const agreementAmount = Number(work.agreement_approval_amount) || 0;
            return sum + Math.max(adminAmount, agreementAmount);
          }, 0);
          setDistributedFunds(fundsSum);

          const completedCount = allWorks.filter(work => work.current_status === 'completed').length;
          setCompletedWorksCount(completedCount);

          const progressPercent = (completedCount / allWorks.length) * 100;
          setOverallProgress(progressPercent.toFixed(0));

          // Get recent works (last 5 works sorted by created_at)
          const sortedWorks = allWorks
            .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
            .slice(0, 5);
          setRecentWorks(sortedWorks);
        } else {
          setActiveProjects(0);
          setDistributedFunds(0);
          setCompletedWorksCount(0);
          setOverallProgress(0);
          setTotalWorksCount(0);
          setRecentWorks([]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    }

    fetchData();
  }, []);

  const stats = [
    {
      id: 'villages',
      icon: MapPin,
      value: totalVillages.toLocaleString(),
      label: language === 'mr' ? 'एकूण गावे' : 'Total Villages',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50'
    },
    {
      id: 'population',
      icon: Users,
      value:
        totalPopulation > 1000000
          ? (totalPopulation / 1000000).toFixed(1) + 'M'
          : totalPopulation.toLocaleString(),
      label: language === 'mr' ? 'एकूण लोकसंख्या' : 'Total Population',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'projects',
      icon: Building2,
      value: activeProjects.toLocaleString(),
      label: language === 'mr' ? 'सक्रिय प्रकल्प' : 'Active Projects',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50'
    },
    {
      id: 'funds',
      icon: Banknote,
      value: `₹${(distributedFunds / 10000000).toFixed(2)}Cr`,
      label: language === 'mr' ? 'वितरित निधी' : 'Distributed Funds',
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50'
    },
    {
      id: 'completed',
      icon: CheckCircle,
      value:
        totalWorksCount === 0
          ? '0%'
          : ((completedWorksCount / totalWorksCount) * 100).toFixed(0) + '%',
      label: language === 'mr' ? 'पूर्ण झालेली कामे' : 'Completed Works',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      id: 'progress',
      icon: TrendingUp,
      value: `${overallProgress}%`,
      label: language === 'mr' ? 'एकूण प्रगती' : 'Overall Progress',
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'from-teal-50 to-cyan-50'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      completed: language === 'mr' ? 'पूर्ण' : 'Completed',
      in_progress: language === 'mr' ? 'चालू' : 'In Progress',
      pending: language === 'mr' ? 'प्रलंबित' : 'Pending',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN');
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-4">
            {language === 'mr' ? 'पेसा निधी आणि कामकाज व्यवस्थापन' : 'PESA Fund and work Management'}
          </h1>
          <p className="text-xl text-indigo-100 mb-6">
            {language === 'mr'
              ? 'ग्रामीण विकास आणि स्थानीय स्वराज्य संस्थांचे डिजिटल व्यवस्थापन'
              : 'Digital management of rural development and local self-governance institutions'}
          </p>
          <div className="text-indigo-200">
            {new Date().toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className={`bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/50`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6" />
              {language === 'mr' ? 'अलीकडील कामे' : 'Recent Works'}
            </h3>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentWorks.length > 0 ? (
              recentWorks.map((work, index) => (
                <div
                  key={work.id || index}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{work.work_name}</p>
                    <p className="text-sm text-gray-600 truncate">{work.taluka}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(work.current_status)}`}>
                        {getStatusText(work.current_status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(work.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {language === 'mr' ? 'कोणतीही अलीकडील कामे नाहीत' : 'No recent works found'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6" />
              {language === 'mr' ? 'मुख्य आकडेवारी' : 'Key Statistics'}
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'mr' ? 'यशस्वी दर' : 'Success Rate'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{overallProgress}%</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'mr' ? 'या महिन्यात जोडले' : 'Added This Month'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {recentWorks.filter(work => {
                      const workDate = new Date(work.created_at || '');
                      const currentDate = new Date();
                      return workDate.getMonth() === currentDate.getMonth() && 
                             workDate.getFullYear() === currentDate.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'mr' ? 'सरासरी निधी प्रति काम' : 'Avg Fund Per Work'}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{totalWorksCount > 0 ? ((distributedFunds / totalWorksCount) / 100000).toFixed(1) + 'L' : '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'mr' ? 'प्रति गाव लोकसंख्या' : 'Population Per Village'}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {totalVillages > 0 ? Math.round(totalPopulation / totalVillages).toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}