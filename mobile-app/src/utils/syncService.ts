import NetInfo from '@react-native-community/netinfo';
import { pesaSupabase } from '../config/supabase';
import { offlineStorage } from './offlineStorage';
import { WorkflowStep } from '../types';

class SyncService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('Network restored, starting sync...');
        this.syncOfflineData();
      }
    });
  }

  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    try {
      const queue = await offlineStorage.getQueue();
      const unsynced = queue.filter(item => !item.synced);

      console.log(`Syncing ${unsynced.length} offline updates...`);

      for (const update of unsynced) {
        try {
          await this.syncStepUpdate(update);
          await offlineStorage.markAsSynced(update.id);
        } catch (error) {
          console.error(`Failed to sync update ${update.id}:`, error);
        }
      }

      await offlineStorage.clearSynced();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncStepUpdate(update: any): Promise<void> {
    const { stepId, updates } = update;

    const { error } = await pesaSupabase
      .from('workflow_steps')
      .update(updates)
      .eq('id', stepId);

    if (error) throw error;
  }

  async updateStepWithSync(stepId: string, workflowId: string, updates: Partial<WorkflowStep>): Promise<void> {
    if (this.isOnline) {
      try {
        const { error } = await pesaSupabase
          .from('workflow_steps')
          .update(updates)
          .eq('id', stepId);

        if (error) throw error;
      } catch (error) {
        console.error('Online update failed, adding to offline queue:', error);
        await offlineStorage.addToQueue({ stepId, workflowId, updates });
      }
    } else {
      console.log('Offline mode: Adding update to queue');
      await offlineStorage.addToQueue({ stepId, workflowId, updates });
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }
}

export const syncService = new SyncService();
