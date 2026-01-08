import React, { useEffect, useState } from 'react';
import { MapPin, Building2, Banknote, TrendingUp, Users, CheckCircle, Calendar, Clock, Target, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { villageService } from '../../utils/supabase';
import { pesaWorkOperations } from '../../utils/supabase';
import Banner1 from '../../assets/Banner1.jpg';
import Banner2 from '../../assets/Banner2.jpg';
import Banner3 from '../../assets/Banner3.jpg';
import Banner4 from '../../assets/Banner4.jpg';
import Banner5 from '../../assets/Banner5.jpg';
import ImgBanner1 from '../../assets/img-banner-1.png';
import Img1 from '../../assets/img-1.jpg';
import GovtLogo from '../../assets/govtMH logo.png';
import HeaderLogo from '../../assets/headerLogo.png';
import MahaPesa from '../../assets/mahaPesa.jpeg';

export function Dashboard({ userId, roleName }: { userId: string; roleName: string }) {
  const { t, language } = useLanguage();

  const [totalVillages, setTotalVillages] = useState(0);
  const [totalPopulation, setTotalPopulation] = useState(0);
  const [stPopulation, setStPopulation] = useState(0);
  const [totalFundAllocatedGp, setTotalFundAllocatedGp] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [distributedFunds, setDistributedFunds] = useState(0);
  const [completedWorksCount, setCompletedWorksCount] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalWorksCount, setTotalWorksCount] = useState(0);
  const [talukaSummary, setTalukaSummary] = useState<any[]>([]);
  const [recentWorks, setRecentWorks] = useState<any[]>([]);

  // Carousel images for Adiwasi theme (Chandrapur region)
  const adiwasiImages = [
    ImgBanner1,
    Banner1,
    Banner2,
    Banner3,
    Banner4,
    Banner5,
    Img1,
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adiwasiImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        let villages = await villageService.getAll();
        let allWorks = await pesaWorkOperations.getAll();

        // If roleName is not 'district', filter data by user access
        if (!['district', 'developer', 'super_admin'].includes(roleName?.trim().toLowerCase()) && userId) {
          villages = villages.filter(
            (v) => v.tal_user_access === userId || v.gram_user_access === userId
          );

          const allowedVillageIds = villages.map((v) => v.id);
          allWorks = allWorks.filter((work) => allowedVillageIds.includes(work.village_id));
        }

        setTotalVillages(villages.length);

        // 🔹 Taluka-wise aggregation for dashboard table (FIXED GP POPULATION LOGIC)
        const talukaMap: Record<string, any> = {};

        villages.forEach((v: any) => {
          const taluka = v.block;
          const gpName = v.gram_panchayat;

          if (!talukaMap[taluka]) {
            talukaMap[taluka] = {
              taluka,
              totalVillage: 0,

              // ✅ Track unique GPs with population
              gpPopulationMap: new Map<string, number>(),

              totalPesaVillagePopulation: 0,
            };
          }

          talukaMap[taluka].totalVillage += 1;

          // ✅ Store GP population ONLY ONCE per Gram Panchayat
          if (gpName && !talukaMap[taluka].gpPopulationMap.has(gpName)) {
            talukaMap[taluka].gpPopulationMap.set(
              gpName,
              Number(v.gram_panchayat_population) || 0
            );
          }

          // PESA village population (this is village-level → safe to sum)
          if (v.is_pesa) {
            talukaMap[taluka].totalPesaVillagePopulation +=
              Number(v.village_population) || 0;
          }
        });

        // ✅ Convert map → array
        const talukaTableData = Object.values(talukaMap).map((t: any) => ({
          taluka: t.taluka,
          totalGp: t.gpPopulationMap.size,
          totalVillage: t.totalVillage,

          // ✅ Correct GP population sum
          totalGpPopulation: Array.from(t.gpPopulationMap.values()).reduce(
            (sum, val) => sum + val,
            0
          ),

          totalPesaVillagePopulation: t.totalPesaVillagePopulation,
        }));

        setTalukaSummary(talukaTableData);

        // ✅ Total Population = Sum of UNIQUE Gram Panchayat Population
        const gpPopulationMap = new Map<string, number>();

        villages.forEach((v: any) => {
          const gpName = v.gram_panchayat;

          if (gpName && !gpPopulationMap.has(gpName)) {
            gpPopulationMap.set(
              gpName,
              Number(v.gram_panchayat_population) || 0
            );
          }
        });

        const populationSum = Array.from(gpPopulationMap.values()).reduce(
          (sum, val) => sum + val,
          0
        );

        setTotalPopulation(populationSum);

        const stPopulationSum = villages.reduce((sum, v) => {
          const stVal =
            Number((v as any).village_st_population) ||
            0;
          return sum + stVal;
        }, 0);
        setStPopulation(stPopulationSum);

        // 1️⃣ Group villages by Gram Panchayat
        const groupedByGp = villages.reduce((acc: Record<string, any[]>, v: any) => {
          const gp = v.gram_panchayat;
          if (!gp) return acc;
          if (!acc[gp]) acc[gp] = [];
          acc[gp].push(v);
          return acc;
        }, {});

        // 2️⃣ Calculate GP-wise fund using same formula as VillagesList
        const gpFundsMap = Object.values(groupedByGp).map((gpVillages) =>
          gpVillages.reduce((sum, v) => {
            const amtPerHead = Number(v.amount_per_head_st_population) || 0;
            const stPop = Number(v.village_st_population) || 0;
            return sum + amtPerHead * stPop;
          }, 0)
        );

        const totalFundAllocatedGpSum = gpFundsMap.reduce(
          (sum, val) => sum + val,
          0
        );

        setTotalFundAllocatedGp(totalFundAllocatedGpSum);

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
  }, [userId, roleName]);

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
      id: 'st_population',
      icon: Users,
      value:
        stPopulation > 1000000
          ? (stPopulation / 1000000).toFixed(1) + 'M'
          : stPopulation.toLocaleString(),
      label: language === 'mr' ? 'एसटी लोकसंख्या' : 'ST Population',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'from-rose-50 to-pink-50'
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
      icon: Users,
      label:
        language === 'mr'
          ? 'एकूण GP निधी वाटप'
          : 'Total Fund Allocated (GP)',
      value: totalFundAllocatedGp.toLocaleString('en-IN', {
        maximumFractionDigits: 0,
      }),
      color: 'from-orange-500 to-amber-500',
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

  const talukaTotals = talukaSummary.reduce(
    (acc, row) => {
      acc.totalGp += row.totalGp;
      acc.totalVillage += row.totalVillage;
      acc.totalGpPopulation += row.totalGpPopulation;
      acc.totalPesaVillagePopulation += row.totalPesaVillagePopulation;
      return acc;
    },
    {
      totalGp: 0,
      totalVillage: 0,
      totalGpPopulation: 0,
      totalPesaVillagePopulation: 0,
    }
  );

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex items-center justify-between">
        <div className="flex items-center gap-0">
          <div className="flex items-center justify-center w-40 h-40 bg-transparent">
            <img
              src={GovtLogo}
              alt="Govt of Maharashtra Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center justify-center w-20 h-20 bg-transparent">
            <img
              src={MahaPesa}
              alt="Maha Pesa Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 md:px-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4 drop-shadow">
            {language === 'mr' ? 'पंचायतीसंबंधीचे उपबंध (अनुसूचित क्षेत्रावर विस्तारित करणे) अधिनियम १९९६' : 'Provisions of the Panchayats (Extension to the Scheduled Areas) Act, 1996'}
          </h1>
          <p className="text-base md:text-xl text-indigo-100 mb-3 md:mb-6 font-medium drop-shadow">
            {language === 'mr'
              ? 'ग्रामीण विकास आणि स्थानीय स्वराज्य संस्थांचे डिजिटल व्यवस्थापन'
              : 'Digital management of rural development and local self-governance institutions'}
          </p>
          <div className="text-indigo-200 text-xs md:text-base tracking-wide">
            {new Date().toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center h-full">
          <img
            src={HeaderLogo}
            alt="Header Logo"
            className="w-16 h-16 md:w-20 md:h-20 bg-white/75 rounded-2xl shadow border-2 border-white/70 object-contain"
          />
        </div>
      </div>

      <div className="relative w-full h-64 md:h-96 bg-gray-100 rounded-3xl overflow-hidden shadow-2xl">
        {adiwasiImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Adiwasi scene ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover rounded-3xl transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'
              }`}
          />
        ))}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {adiwasiImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-white shadow-lg scale-110' : 'bg-gray-300'
                } transition-all duration-300`}
            ></button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.slice(0, 3).map((stat) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
        {stats.slice(3).map((stat) => {
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

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6" />
            {language === 'mr' ? 'तालुकानिहाय आकडेवारी' : 'Taluka-wise Statistics'}
          </h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto p-4">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Taluka
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-600">
                  Total GP
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-indigo-600">
                  Total Village
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-purple-600">
                  Total GP Population
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-rose-600">
                  PESA Villages Population
                </th>
              </tr>
            </thead>

            <tbody>
              {talukaSummary.map((row, idx) => (
                <tr
                  key={idx}
                  className="bg-gray-50 hover:bg-gray-100 transition rounded-2xl shadow-sm"
                >
                  <td className="px-4 py-3 font-semibold text-gray-800 rounded-l-2xl">
                    {row.taluka}
                  </td>

                  <td className="px-4 py-3 text-center font-medium text-emerald-700">
                    {row.totalGp}
                  </td>

                  <td className="px-4 py-3 text-center font-medium text-indigo-700">
                    {row.totalVillage}
                  </td>

                  <td className="px-4 py-3 text-center font-medium text-purple-700">
                    {row.totalGpPopulation.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center font-medium text-rose-700 rounded-r-2xl">
                    {row.totalPesaVillagePopulation.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* 🔹 TOTAL ROW */}
              <tr className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 border-t-2 border-emerald-300">
                <td className="px-4 py-4 font-bold text-gray-900 rounded-l-2xl">
                  {language === 'mr' ? 'एकूण' : 'Total'}
                </td>

                <td className="px-4 py-4 text-center font-bold text-emerald-800">
                  {talukaTotals.totalGp}
                </td>

                <td className="px-4 py-4 text-center font-bold text-indigo-800">
                  {talukaTotals.totalVillage}
                </td>

                <td className="px-4 py-4 text-center font-bold text-purple-800">
                  {talukaTotals.totalGpPopulation.toLocaleString()}
                </td>

                <td className="px-4 py-4 text-center font-bold text-rose-800 rounded-r-2xl">
                  {talukaTotals.totalPesaVillagePopulation.toLocaleString()}
                </td>
              </tr>

              {talukaSummary.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    {language === 'mr' ? 'डेटा उपलब्ध नाही' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid">
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
      </div>
    </div>
  );
}