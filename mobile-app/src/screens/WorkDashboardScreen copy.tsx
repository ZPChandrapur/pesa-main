import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { pesaSupabase } from '../config/supabase';
import { Work, Village } from '../types';
import { useAuth } from '../context/AuthContext';

interface WorkDashboardScreenProps {
  navigation: any;
}

export const WorkDashboardScreen: React.FC<WorkDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [gramPanchayatFilter, setGramPanchayatFilter] = useState<string>('all');
  const [villageFilter, setVillageFilter] = useState<string>('all');
  const [talukaFilter, setTalukaFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [gramPanchayats, setGramPanchayats] = useState<string[]>([]);
  const [talukas, setTalukas] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      await Promise.all([loadVillages(), loadWorks()]);
      console.log('Dashboard data loaded successfully');
    } catch (error: any) {
      console.error('Error loading data:', error);
      console.error('Error details:', error.message, error.details);
      Alert.alert(
        'Error Loading Data',
        error.message || 'Failed to load data from database. Please check your connection and try again.',
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

      if (error) {
        console.error('Error loading villages:', error);
        throw error;
      }

      console.log('Loaded villages:', data?.length || 0);
      setVillages(data || []);
    } catch (error) {
      console.error('Failed to load villages:', error);
      throw error;
    }
  };

  const loadWorks = async () => {
    try {
      let query = pesaSupabase
        .from('works')
        .select(`
          *,
          village:villages!village_id(village_name, village_name_mr)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error loading works:', error);
        throw error;
      }

      console.log('Loaded works:', data?.length || 0);
      setWorks(data || []);

      const uniqueGPs = Array.from(new Set((data || []).map(w => w.pesa_grampanchayat).filter(Boolean)));
      const uniqueTalukas = Array.from(new Set((data || []).map(w => w.taluka).filter(Boolean)));

      setGramPanchayats(uniqueGPs as string[]);
      setTalukas(uniqueTalukas as string[]);
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

  const filteredWorks = works.filter(work => {
    const gpMatch = gramPanchayatFilter === 'all' || work.pesa_grampanchayat === gramPanchayatFilter;
    const villageMatch = villageFilter === 'all' || work.village?.village_name === villageFilter;
    const talukaMatch = talukaFilter === 'all' || work.taluka === talukaFilter;
    const categoryMatch = categoryFilter === 'all' || work.work_category === categoryFilter;
    const statusMatch = statusFilter === 'all' || work.current_status === statusFilter;

    return gpMatch && villageMatch && talukaMatch && categoryMatch && statusMatch;
  });

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

  const handleWorkPress = (work: Work) => {
    navigation.navigate('WorkflowProgress', { selectedWorkName: work.work_name });
  };

  const renderWorkItem = ({ item }: { item: Work }) => (
    <TouchableOpacity
      style={styles.workCard}
      onPress={() => handleWorkPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.workHeader}>
        <Text style={styles.workName} numberOfLines={2}>{item.work_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.current_status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.current_status)}</Text>
        </View>
      </View>

      <View style={styles.workDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{item.work_category || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Village:</Text>
          <Text style={styles.detailValue}>{item.village?.village_name || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Taluka:</Text>
          <Text style={styles.detailValue}>{item.taluka || '-'}</Text>
        </View>
        {item.contractor_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contractor:</Text>
            <Text style={styles.detailValue}>{item.contractor_name}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading works...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Gram Panchayat</Text>
            <Picker
              selectedValue={gramPanchayatFilter}
              onValueChange={setGramPanchayatFilter}
              style={styles.picker}
            >
              <Picker.Item label="All" value="all" />
              {gramPanchayats.map(gp => (
                <Picker.Item key={gp} label={gp} value={gp} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Village</Text>
            <Picker
              selectedValue={villageFilter}
              onValueChange={setVillageFilter}
              style={styles.picker}
            >
              <Picker.Item label="All" value="all" />
              {villages.map(v => (
                <Picker.Item key={v.id} label={v.village_name} value={v.village_name} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Taluka</Text>
            <Picker
              selectedValue={talukaFilter}
              onValueChange={setTalukaFilter}
              style={styles.picker}
            >
              <Picker.Item label="All" value="all" />
              {talukas.map(t => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Category</Text>
            <Picker
              selectedValue={categoryFilter}
              onValueChange={setCategoryFilter}
              style={styles.picker}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="Category A" value="A" />
              <Picker.Item label="Category B" value="B" />
              <Picker.Item label="Category C" value="C" />
              <Picker.Item label="Category D" value="D" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status</Text>
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

      <FlatList
        data={filteredWorks}
        renderItem={renderWorkItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No works found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  picker: {
    height: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  listContainer: {
    padding: 12,
  },
  workCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  workDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    width: 90,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
