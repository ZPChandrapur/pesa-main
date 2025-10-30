import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineStepUpdate } from '../types';

const OFFLINE_QUEUE_KEY = '@pesa_offline_queue';
const OFFLINE_DATA_KEY = '@pesa_offline_data';

export const offlineStorage = {
  async addToQueue(update: Omit<OfflineStepUpdate, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newUpdate: OfflineStepUpdate = {
        ...update,
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        synced: false,
      };
      queue.push(newUpdate);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  },

  async getQueue(): Promise<OfflineStepUpdate[]> {
    try {
      const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  },

  async markAsSynced(updateId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updated = queue.map(item =>
        item.id === updateId ? { ...item, synced: true } : item
      );
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking as synced:', error);
    }
  },

  async removeFromQueue(updateId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(item => item.id !== updateId);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  },

  async clearSynced(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const unsynced = queue.filter(item => !item.synced);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(unsynced));
    } catch (error) {
      console.error('Error clearing synced items:', error);
    }
  },

  async cacheData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`${OFFLINE_DATA_KEY}_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  },

  async getCachedData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(`${OFFLINE_DATA_KEY}_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  },
};
