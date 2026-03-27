import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ImageBackground,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { pesaSupabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

interface Work {
  id: string;
  taluka: string;
  year?: string | number;
  work_name: string;
  work_category?: string;
  current_status?: string;
  village_id?: string;
  pesa_grampanchayat?: string;
  added_month?: string;
  agreement_approval_amount?: string;
  contractor_name?: string;
  created_at?: string;
  village?: {
    village_name: string;
  };
}

interface WorkDashboardScreenProps {
  navigation: any;
}

export const WorkDashboardScreen: React.FC<WorkDashboardScreenProps> = ({ navigation }) => {
  const { user, userId, roleName } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [allVillages, setAllVillages] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pesaGrampanchayatFilter, setPesaGrampanchayatFilter] = useState('all');
  const [villageFilter, setVillageFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [workCategoryFilter, setWorkCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [pesaGrampanchayats, setPesaGrampanchayats] = useState<string[]>([]);

  const [totalPopulation, setTotalPopulation] = useState(0);
  const [stPopulation, setStPopulation] = useState(0);
  const [distributedFunds, setDistributedFunds] = useState(0);

  const workCategories = [
    { id: 'A', name: 'Category A - Infrastructure' },
    { id: 'B', name: 'Category B - Social Development' },
    { id: 'C', name: 'Category C - Economic Development' },
    { id: 'D', name: 'Category D - Environmental' }
  ];

  useEffect(() => {
    if (user && userId && roleName) {
      console.log('Loading work dashboard for user:', userId, 'role:', roleName);
      loadData();
    }
  }, [user, userId, roleName]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading work dashboard data...');
      const villagesData = await loadVillages();
      await loadWorks(villagesData);
      console.log('Work dashboard data loaded successfully');
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert(
        'Error Loading Data',
        error.message || 'Failed to load data. Please check your connection.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadVillages = async () => {
    try {
      const { data, error } = await pesaSupabase
        .from('villages')
        .select('*')
        .order('village_name');

      if (error) throw error;

      console.log('Loaded all villages:', data?.length || 0);
      console.log('Current userId:', userId);
      console.log('Current roleName:', roleName);
      setAllVillages(data || []);

      let filteredVillages = data || [];

      if (!['district', 'developer', 'super_admin', 'admin'].includes(roleName?.trim().toLowerCase() || '') && userId) {
        console.log('Filtering villages for non-admin user');
        filteredVillages = (data || []).filter((v: any) => {
          if (v.tal_user_access === null && v.gram_user_access === null) {
            return false;
          }
          const hasAccess = v.tal_user_access === userId || v.gram_user_access === userId;
          if (hasAccess) {
            console.log('User has access to village:', v.village_name);
          }
          return hasAccess;
        });
      } else {
        console.log('User is admin, showing all villages');
      }

      console.log('Filtered villages for user:', filteredVillages.length);
      setVillages(filteredVillages);

      const populationSum = filteredVillages.reduce(
        (sum, v) => sum + (Number(v.village_population) || 0),
        0
      );
      setTotalPopulation(populationSum);

      const stPopulationSum = filteredVillages.reduce((sum, v) => {
        const stVal = Number(v.gram_panchayat_st_population) || 0;
        return sum + stVal;
      }, 0);
      setStPopulation(stPopulationSum);

      return data || [];
    } catch (error) {
      console.error('Failed to load villages:', error);
      throw error;
    }
  };

  const loadWorks = async (villagesData: any[]) => {
    try {
      const { data, error } = await pesaSupabase
        .from('works')
        .select(`
          *,
          village:villages!village_id(village_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Loaded all works:', data?.length || 0);

      let filteredWorks = data || [];

      if (!['district', 'developer', 'super_admin'].includes(roleName?.trim().toLowerCase() || '') && userId) {
        console.log('Filtering works for non-admin user');
        const allowedVillageIds = villagesData
          .filter((v: any) => {
            if (v.tal_user_access === null && v.gram_user_access === null) {
              return false;
            }
            return v.tal_user_access === userId || v.gram_user_access === userId;
          })
          .map((v: any) => v.id);

        console.log('Allowed village IDs:', allowedVillageIds.length);

        if (allowedVillageIds.length > 0) {
          filteredWorks = (data || []).filter((w: any) => allowedVillageIds.includes(w.village_id));
        } else {
          console.log('No allowed villages, showing no works');
          filteredWorks = [];
        }
      } else {
        console.log('User is admin, showing all works');
      }

      console.log('Filtered works for user:', filteredWorks.length);
      setWorks(filteredWorks);

      const fundsSum = filteredWorks.reduce((sum, work) => {
        const agreementAmount = Number(work.agreement_approval_amount) || 0;
        return sum + agreementAmount;
      }, 0);
      setDistributedFunds(fundsSum);

      const uniqueGPs = Array.from(new Set(filteredWorks.map(w => w.pesa_grampanchayat).filter(Boolean)));
      setPesaGrampanchayats(uniqueGPs as string[]);
    } catch (error) {
      console.error('Failed to load works:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredWorks = works.filter(w => {
    const statusMatch = statusFilter === 'all' || w.current_status === statusFilter;
    const yearMatch = yearFilter === 'all' || String(w.year) === yearFilter;
    const workCategoryMatch = workCategoryFilter === 'all' || w.work_category === workCategoryFilter;
    const pesaGrampanchayatMatch = pesaGrampanchayatFilter === 'all' || w.pesa_grampanchayat === pesaGrampanchayatFilter;
    const villageMatch = villageFilter === 'all' || (w.village?.village_name === villageFilter);
    return statusMatch && yearMatch && workCategoryMatch && pesaGrampanchayatMatch && villageMatch;
  });

  const completedStages = filteredWorks.filter(w => w.current_status === 'completed').length;
  const inProgress = filteredWorks.filter(w => w.current_status === 'in_progress').length;
  const pending = filteredWorks.filter(w => w.current_status === 'pending').length;
  const overallProgress = filteredWorks.length ? Math.round((completedStages / filteredWorks.length) * 100) : 0;

  const uniqueYears = Array.from(new Set(works.map(w => w.year).filter(Boolean) as (string | number)[])).map(String);

  const handleWorkPress = (work: Work) => {
    navigation.navigate('WorkflowProgress', { selectedWorkName: work.work_name });
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/tribalbg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading work dashboard...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/tribalbg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.headerFilters}>
            <View style={styles.headerFilterItem}>
              <Text style={styles.headerFilterLabel}>Gram Panchayat</Text>
              <View style={styles.headerPickerContainer}>
                <Picker
                  selectedValue={pesaGrampanchayatFilter}
                  onValueChange={setPesaGrampanchayatFilter}
                  style={styles.headerPicker}
                >
                  <Picker.Item label="All" value="all" />
                  {pesaGrampanchayats.map(gp => (
                    <Picker.Item key={gp} label={gp} value={gp} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.headerFilterItem}>
              <Text style={styles.headerFilterLabel}>Village</Text>
              <View style={styles.headerPickerContainer}>
                <Picker
                  selectedValue={villageFilter}
                  onValueChange={setVillageFilter}
                  style={styles.headerPicker}
                >
                  <Picker.Item label="All" value="all" />
                  {villages.map(v => (
                    <Picker.Item key={v.id} label={v.village_name} value={v.village_name} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.countCardsContainer}>
          <View style={[styles.countCard, styles.villagesCard]}>
            <Text style={styles.countValue}>{villages.length}</Text>
            <Text style={styles.countLabel}>Total Villages</Text>
          </View>
          <View style={[styles.countCard, styles.populationCard]}>
            <Text style={styles.countValue}>
              {totalPopulation > 1000000
                ? (totalPopulation / 1000000).toFixed(1) + 'M'
                : totalPopulation.toLocaleString()}
            </Text>
            <Text style={styles.countLabel}>Total Population</Text>
          </View>
          <View style={[styles.countCard, styles.stPopCard]}>
            <Text style={styles.countValue}>
              {stPopulation > 1000000
                ? (stPopulation / 1000000).toFixed(1) + 'M'
                : stPopulation.toLocaleString()}
            </Text>
            <Text style={styles.countLabel}>ST Population</Text>
          </View>
          <View style={[styles.countCard, styles.fundsCard]}>
            <Text style={styles.countValue}>
              ₹{(distributedFunds / 10000000).toFixed(2)}Cr
            </Text>
            <Text style={styles.countLabel}>Distributed Funds</Text>
          </View>
        </View>

        <View style={styles.countCardsContainer}>
          <View style={[styles.countCard, styles.completedCard]}>
            <Text style={styles.countValue}>{completedStages}</Text>
            <Text style={styles.countLabel}>Completed</Text>
          </View>
          <View style={[styles.countCard, styles.inProgressCard]}>
            <Text style={styles.countValue}>{inProgress}</Text>
            <Text style={styles.countLabel}>In Progress</Text>
          </View>
          <View style={[styles.countCard, styles.pendingCard]}>
            <Text style={styles.countValue}>{pending}</Text>
            <Text style={styles.countLabel}>Pending</Text>
          </View>
          <View style={[styles.countCard, styles.progressCard]}>
            <Text style={styles.countValue}>{overallProgress}%</Text>
            <Text style={styles.countLabel}>Overall Progress</Text>
          </View>
        </View>

        <View style={styles.filtersCard}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Year</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={yearFilter}
                onValueChange={setYearFilter}
                style={styles.picker}
              >
                <Picker.Item label="All" value="all" />
                {uniqueYears.map(year => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Work Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={workCategoryFilter}
                onValueChange={setWorkCategoryFilter}
                style={styles.picker}
              >
                <Picker.Item label="All" value="all" />
                {workCategories.map(cat => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Filter by Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={statusFilter}
                onValueChange={setStatusFilter}
                style={styles.picker}
              >
                <Picker.Item label="All" value="all" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="In Progress" value="in_progress" />
                <Picker.Item label="Completed" value="completed" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>{filteredWorks.length} Works</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.srCell]}>Sr</Text>
                <Text style={[styles.headerCell, styles.talukaCell]}>Taluka</Text>
                <Text style={[styles.headerCell, styles.yearCell]}>Year</Text>
                <Text style={[styles.headerCell, styles.gpCell]}>GP</Text>
                <Text style={[styles.headerCell, styles.villageCell]}>Village</Text>
                <Text style={[styles.headerCell, styles.catCell]}>Cat</Text>
                <Text style={[styles.headerCell, styles.workNameCell]}>Work Name</Text>
                <Text style={[styles.headerCell, styles.monthCell]}>Month</Text>
                <Text style={[styles.headerCell, styles.amountCell]}>Amount</Text>
                <Text style={[styles.headerCell, styles.contractorCell]}>Contractor</Text>
                <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
              </View>

              {filteredWorks.length > 0 ? (
                filteredWorks.map((work, index) => (
                  <TouchableOpacity
                    key={work.id}
                    style={styles.tableRow}
                    onPress={() => handleWorkPress(work)}
                  >
                    <Text style={[styles.cell, styles.srCell]}>{index + 1}</Text>
                    <Text style={[styles.cell, styles.talukaCell]} numberOfLines={1}>
                      {work.taluka || '-'}
                    </Text>
                    <Text style={[styles.cell, styles.yearCell]}>{work.year || '-'}</Text>
                    <Text style={[styles.cell, styles.gpCell]} numberOfLines={1}>
                      {work.pesa_grampanchayat || '-'}
                    </Text>
                    <Text style={[styles.cell, styles.villageCell]} numberOfLines={1}>
                      {work.village?.village_name || '-'}
                    </Text>
                    <Text style={[styles.cell, styles.catCell]}>{work.work_category || '-'}</Text>
                    <Text style={[styles.cell, styles.workNameCell]} numberOfLines={2}>
                      {work.work_name || '-'}
                    </Text>
                    <Text style={[styles.cell, styles.monthCell]} numberOfLines={1}>
                      {work.added_month || '-'}
                    </Text>
                    <Text style={[styles.cell, styles.amountCell]} numberOfLines={1}>
                      {work.agreement_approval_amount ? `�${Number(work.agreement_approval_amount).toLocaleString()}` : '-'}
                    </Text>
                    <Text style={[styles.cell, styles.contractorCell]} numberOfLines={1}>
                      {work.contractor_name || '-'}
                    </Text>
                    <View style={styles.statusCellContainer}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(work.current_status) }]}>
                        <Text style={styles.statusText}>{getStatusText(work.current_status)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No works found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
    </ImageBackground>
  );
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'completed': return '#10b981';
    case 'in_progress': return '#3b82f6';
    case 'pending': return '#f59e0b';
    default: return '#6b7280';
  }
};

const getStatusText = (status?: string) => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'pending': return 'Pending';
    default: return 'Unknown';
  }
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerFilters: {
    gap: 12,
  },
  headerFilterItem: {
    marginBottom: 8,
  },
  headerFilterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerPickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  headerPicker: {
    height: 45,
  },
  countCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  countCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  villagesCard: {
    backgroundColor: '#d1fae5',
  },
  populationCard: {
    backgroundColor: '#dbeafe',
  },
  stPopCard: {
    backgroundColor: '#fce7f3',
  },
  fundsCard: {
    backgroundColor: '#fed7aa',
  },
  completedCard: {
    backgroundColor: '#d1fae5',
  },
  inProgressCard: {
    backgroundColor: '#dbeafe',
  },
  pendingCard: {
    backgroundColor: '#fef3c7',
  },
  progressCard: {
    backgroundColor: '#f3e8ff',
  },
  countValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filtersCard: {
    backgroundColor: '#fff',
    margin: 12,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  picker: {
    height: 45,
  },
  tableCard: {
    backgroundColor: '#fff',
    margin: 12,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingBottom: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  table: {
    minWidth: 1200,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cell: {
    fontSize: 11,
    color: '#111827',
    textAlign: 'center',
  },
  srCell: {
    width: 40,
  },
  talukaCell: {
    width: 100,
  },
  yearCell: {
    width: 70,
  },
  gpCell: {
    width: 120,
  },
  villageCell: {
    width: 120,
  },
  catCell: {
    width: 50,
  },
  workNameCell: {
    width: 200,
  },
  monthCell: {
    width: 100,
  },
  amountCell: {
    width: 100,
  },
  contractorCell: {
    width: 120,
  },
  statusCell: {
    width: 100,
  },
  statusCellContainer: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
