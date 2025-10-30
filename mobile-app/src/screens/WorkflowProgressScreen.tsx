import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { pesaSupabase } from '../config/supabase';
import { Workflow } from '../types';

interface WorkflowProgressScreenProps {
  navigation: any;
  route: any;
}

export const WorkflowProgressScreen: React.FC<WorkflowProgressScreenProps> = ({ navigation, route }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkflows();

    if (route.params?.selectedWorkName) {
      findAndNavigateToWorkflow(route.params.selectedWorkName);
    }
  }, [route.params?.selectedWorkName]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const { data, error } = await pesaSupabase
        .from('workflows')
        .select(`
          *,
          workflow_steps:workflow_steps(*),
          work:works!work_id(work_name, taluka, village_id, pesa_grampanchayat)
        `)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const findAndNavigateToWorkflow = (workName: string) => {
    const workflow = workflows.find(w => w.work?.work_name === workName);
    if (workflow) {
      navigation.navigate('WorkflowSteps', { workflow });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkflows();
    setRefreshing(false);
  };

  const getProgressPercentage = (workflow: Workflow) => {
    if (!workflow.workflow_steps || workflow.workflow_steps.length === 0) return 0;
    const completed = workflow.workflow_steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / workflow.workflow_steps.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'active': return '#3b82f6';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderWorkflowItem = ({ item }: { item: Workflow }) => {
    const progress = getProgressPercentage(item);
    const completedSteps = item.workflow_steps?.filter(s => s.status === 'completed').length || 0;
    const totalSteps = item.workflow_steps?.length || 0;

    return (
      <TouchableOpacity
        style={styles.workflowCard}
        onPress={() => navigation.navigate('WorkflowSteps', { workflow: item })}
        activeOpacity={0.7}
      >
        <View style={styles.workflowHeader}>
          <Text style={styles.workflowTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.workflowDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {item.work && (
          <View style={styles.workInfo}>
            <Text style={styles.workInfoText} numberOfLines={1}>
              {item.work.work_name}
            </Text>
            <Text style={styles.workInfoSubtext}>{item.work.taluka}</Text>
          </View>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSteps}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{completedSteps}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{item.duration}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading workflows...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workflows}
        renderItem={renderWorkflowItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workflows found</Text>
            <Text style={styles.emptySubtext}>
              Create workflows in the web dashboard to track progress here
            </Text>
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
  listContainer: {
    padding: 12,
  },
  workflowCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workflowTitle: {
    flex: 1,
    fontSize: 18,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  workflowDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  workInfo: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  workInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  workInfoSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    width: 45,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
