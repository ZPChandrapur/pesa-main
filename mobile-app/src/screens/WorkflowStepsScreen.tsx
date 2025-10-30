import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { WorkflowStep, Workflow } from '../types';

interface WorkflowStepsScreenProps {
  navigation: any;
  route: any;
}

export const WorkflowStepsScreen: React.FC<WorkflowStepsScreenProps> = ({ navigation, route }) => {
  const workflow: Workflow = route.params?.workflow;

  if (!workflow) {
    return (
      <View style={styles.container}>
        <Text>No workflow data available</Text>
      </View>
    );
  }

  const getProgressPercentage = () => {
    if (!workflow.workflow_steps || workflow.workflow_steps.length === 0) return 0;
    const completed = workflow.workflow_steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / workflow.workflow_steps.length) * 100);
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStepStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const handleStepPress = (step: WorkflowStep) => {
    navigation.navigate('StepEdit', { step, workflow });
  };

  const renderStepItem = ({ item, index }: { item: WorkflowStep; index: number }) => (
    <TouchableOpacity
      style={[styles.stepCard, { borderLeftColor: getStepStatusColor(item.status) }]}
      onPress={() => handleStepPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.stepHeaderContent}>
          <Text style={styles.stepTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.stepStatusBadge, { backgroundColor: getStepStatusColor(item.status) }]}>
            <Text style={styles.stepStatusText}>{getStepStatusText(item.status)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.stepDescription} numberOfLines={2}>{item.description}</Text>

      <View style={styles.stepMeta}>
        <View style={styles.stepMetaItem}>
          <Text style={styles.stepMetaLabel}>Duration:</Text>
          <Text style={styles.stepMetaValue}>{item.duration} days</Text>
        </View>
        {item.location_data && (
          <View style={styles.stepMetaItem}>
            <Text style={styles.stepMetaIcon}>📍</Text>
            <Text style={styles.stepMetaValue}>Location captured</Text>
          </View>
        )}
        {item.completion_photos && item.completion_photos.length > 0 && (
          <View style={styles.stepMetaItem}>
            <Text style={styles.stepMetaIcon}>📷</Text>
            <Text style={styles.stepMetaValue}>{item.completion_photos.length} photos</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const progress = getProgressPercentage();
  const completedSteps = workflow.workflow_steps?.filter(s => s.status === 'completed').length || 0;
  const totalSteps = workflow.workflow_steps?.length || 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{workflow.title}</Text>
          <Text style={styles.headerDescription}>{workflow.description}</Text>
          {workflow.work && (
            <View style={styles.workInfo}>
              <Text style={styles.workInfoText}>{workflow.work.work_name}</Text>
              <Text style={styles.workInfoSubtext}>{workflow.work.taluka}</Text>
            </View>
          )}
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{progress}%</Text>
            <Text style={styles.overviewLabel}>Progress</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{totalSteps}</Text>
            <Text style={styles.overviewLabel}>Total Steps</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: '#10b981' }]}>{completedSteps}</Text>
            <Text style={styles.overviewLabel}>Completed</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: '#f59e0b' }]}>{workflow.duration}</Text>
            <Text style={styles.overviewLabel}>Days</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>Workflow Steps</Text>
          <FlatList
            data={workflow.workflow_steps || []}
            renderItem={renderStepItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No steps found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#10b981',
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#d1fae5',
    marginBottom: 12,
  },
  workInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  workInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  workInfoSubtext: {
    fontSize: 12,
    color: '#d1fae5',
  },
  overviewCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginHorizontal: 12,
    marginTop: -30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  stepsSection: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  stepHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  stepStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stepStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    marginLeft: 48,
  },
  stepMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 48,
    gap: 12,
  },
  stepMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 4,
  },
  stepMetaValue: {
    fontSize: 12,
    color: '#374151',
  },
  stepMetaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
