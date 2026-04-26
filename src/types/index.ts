// Shared
export type Language = 'mr' | 'en';

// User related types
export type UserRole = 'gramsewak' | 'bdo' | 'ceo';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  district: string;
  block: string;
}

// Village related types
export interface Village {
  id?: string;

  // Names
  village_name: string;
  village_name_mr?: string;
  name?: string;
  name_mr?: string;

  // Hierarchy
  gram_panchayat: string;
  gram_panchayat_mr?: string;
  taluka: string;
  taluka_mr?: string;
  district: string;
  district_mr?: string;
  block: string;
  block_mr?: string;

  // Populations
  gram_panchayat_population?: number;
  gram_panchayat_st_population?: number;
  village_population?: number;
  village_st_population?: number;
  amount_per_head_st_population?: number;

  // Funds
  fund_allocated_village?: number;
  fund_allocated_gp?: number;

  // PESA flag
  is_pesa?: boolean;

  // Village code
  village_code?: string;

  // Year for fund allocation
  year?: string;

  // Legacy optional
  population?: number;
  latitude?: number;
  longitude?: number;

  // Metadata
  created_at?: string;
  updated_at?: string;
}

// Aarakhada related types
export interface AarakhadaWork {
  id?: string;
  village_id: string;
  village_name: string;
  work_category: 'A' | 'B' | 'C' | 'D';
  work_name: string;
  work_type: 'financial' | 'physical';

  // Financial-related fields
  estimated_amount?: number;
  sanctioned_amount?: number;
  released_amount?: number;
  expenditure?: number;
  physical_progress?: number;
  financial_progress?: number;

  // Physical-related fields
  completedWorks?: number;
  ongoingWorks?: number;
  pendingWorks?: number;

  status: 'pending' | 'ongoing' | 'completed';
  start_date?: string;
  completion_date?: string;
  gram_panchayat: string;
  taluka: string;
  district: string;

  // ✅ Add this (for financial table)
  added_month?: string;

  created_at?: string;
  updated_at?: string;
}


export interface WorkCategory {
  id: string;
  name: string;
  name_mr: string;
}

export interface WorkItem {
  id: string;
  name: string;
  name_mr: string;
  category: 'A' | 'B' | 'C' | 'D';
  village_name: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  completion_photos?: string[];
  location_data?: any;
  location_name?: string;
  location_name?: string;
  completed_at?: string;
  created_at?: string;
}