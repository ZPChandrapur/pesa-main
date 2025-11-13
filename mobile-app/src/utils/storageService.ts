import { pesaSupabase } from '../config/supabase';

export const storageService = {
  async uploadWorkflowPhoto(uri: string, workflowId: string, stepId: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${workflowId}/${stepId}/${Date.now()}.${fileExt}`;

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      const { data, error } = await pesaSupabase.storage
        .from('pesa-workflow-photos')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      const { data: urlData } = pesaSupabase.storage
        .from('pesa-workflow-photos')
        .getPublicUrl(fileName);

      console.log('Photo uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },

  async removeWorkflowPhoto(photoUrl: string): Promise<void> {
    try {
      const urlParts = photoUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'pesa-workflow-photos');
      if (bucketIndex === -1) return;

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await pesaSupabase.storage
        .from('pesa-workflow-photos')
        .remove([filePath]);

      if (error) throw error;
      console.log('Photo removed successfully');
    } catch (error) {
      console.error('Error removing photo:', error);
      throw error;
    }
  }
};
