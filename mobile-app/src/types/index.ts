export interface WorkflowStep {
  id: string;
  workflow_id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  completion_photos?: string[];
  location_data?: {
    latitude: number;
    longitude: number;
    address: string;
    location_name: string;
  } | null;
  location_name?: string;
  completed_at?: string;
  created_at?: string;
  photo_metas?: Array<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }>;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: 'draft' | 'active' | 'completed';
  work_id?: string;
  workflow_steps?: WorkflowStep[];
  work?: {
    work_name: string;
    taluka: string;
    village_id?: string;
    pesa_grampanchayat?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Work {
  id: string;
  taluka: string;
  year?: string | number;
  work_name: string;
  work_category?: string;
  current_status?: string;
  village_id?: string;
  pesa_grampanchayat?: string;
  added_month?: string;
  contractor_name?: string;
  agreement_approval_amount?: string;
  village?: {
    village_name: string;
    village_name_mr?: string;
  };
}

export interface Village {
  id: string;
  village_name: string;
  village_name_mr?: string;
  gram_panchayat: string;
  block: string;
  district: string;
  tal_user_access?: string;
  gram_user_access?: string;
}

export interface OfflineStepUpdate {
  id: string;
  stepId: string;
  workflowId: string;
  updates: Partial<WorkflowStep>;
  timestamp: number;
  synced: boolean;
}
