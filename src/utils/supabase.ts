import { createClient } from '@supabase/supabase-js';
import { Village, AarakhadaWork } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
});
// Create a separate client for pesa schema
export const pesaSupabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'pesa'
  }
});
// === Village Service ===
export const villageService = {
  async getAll(): Promise<Village[]> {
    const { data, error } = await pesaSupabase
      .from('villages')
      .select('*')
      .order('village_name');
    if (error) throw error;
    return data ?? [];
  },
  async getById(id: string): Promise<Village | null> {
    const { data, error } = await pesaSupabase
      .from('villages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  async create(
    village: Omit<Village, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Village> {
    const { data, error } = await pesaSupabase
      .from('villages')
      .insert([village])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, village: Partial<Village>): Promise<Village> {
    const { data, error } = await pesaSupabase
      .from('villages')
      .update({
        ...village,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await pesaSupabase.from('villages').delete().eq('id', id);
    if (error) throw error;
  },
  async getByDistrict(district: string): Promise<Village[]> {
    const { data, error } = await pesaSupabase
      .from('villages')
      .select('*')
      .eq('district', district)
      .order('village_name');
    if (error) throw error;
    return data ?? [];
  },
  async getByBlock(block: string): Promise<Village[]> {
    const { data, error } = await pesaSupabase
      .from('villages')
      .select('*')
      .eq('block', block)
      .order('village_name');
    if (error) throw error;
    return data ?? [];
  },
  async getByGramPanchayat(gramPanchayat: string): Promise<Village[]> {
    const { data, error } = await pesaSupabase
      .from('villages')
      .select('*')
      .eq('gram_panchayat', gramPanchayat)
      .order('village_name');
    if (error) throw error;
    return data ?? [];
  },
};
// === Work Service ===
export const workService = {
  async getByVillageAndCategory({
    village_id,
    category,
  }: {
    village_id: string;
    category: "" | "A" | "B" | "C" | "D";
  }) {
    if (!category) {
      return [];
    }
    const tableName = 'aarakhada_financial'; // Adjust if needed
    const { data, error } = await pesaSupabase
      .from(tableName)
      .select("*")
      .eq("village_id", village_id)
      .eq("work_category", category);
    if (error) throw error;
    return data || [];
  },
  async getAll() {
    const [financialData, physicalData] = await Promise.all([
      pesaSupabase.from('aarakhada_financial').select('*'),
      pesaSupabase.from('aarakhada_physical').select('*')
    ]);
    if (financialData.error) throw financialData.error;
    if (physicalData.error) throw physicalData.error;
    const allWorks = [
      ...(financialData.data || []).map(work => ({ ...work, work_type: 'financial' as const })),
      ...(physicalData.data || []).map(work => ({ ...work, work_type: 'physical' as const }))
    ];
    return allWorks;
  },
  async insert(workData: any) {
    const tableName = workData.work_type == 'financial' ? 'aarakhada_financial' : 'aarakhada_physical';
    const { data, error } = await pesaSupabase.from(tableName).insert(workData).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, workData: any) {
    const tableName = workData.work_type === 'financial' ? 'aarakhada_financial' : 'aarakhada_physical';
    const { data, error } = await pesaSupabase
      .from(tableName)
      .update({
        ...workData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: string, work_type: "financial" | "physical") {
    const tableName = work_type === 'financial' ? 'aarakhada_financial' : 'aarakhada_physical';
    const { error } = await pesaSupabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
  },
};
// === Taluka Work Service ===
export const talukaWorkService = {
  async getByTalukaAndCategory({
    taluka_name,
    category,
    work_type,
  }: {
    taluka_name?: string;
    category?: "A" | "B" | "C" | "D";
    work_type: "financial" | "physical";
  }) {
    const tableName = work_type === 'financial' ? 'taluka_aarakhada_financial' : 'taluka_aarakhada_physical';
    let query = pesaSupabase.from(tableName).select("*");

    if (taluka_name) {
      query = query.eq("taluka_name", taluka_name);
    }
    if (category) {
      query = query.eq("work_category", category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async insert(workData: any) {
    const tableName = workData.work_type === 'financial' ? 'taluka_aarakhada_financial' : 'taluka_aarakhada_physical';
    const { data, error } = await pesaSupabase.from(tableName).insert(workData);
    if (error) throw error;
    return data;
  },

  async getAllByTaluka(taluka_name: string, work_type: "financial" | "physical") {
    const tableName = work_type === 'financial' ? 'taluka_aarakhada_financial' : 'taluka_aarakhada_physical';
    const { data, error } = await pesaSupabase
      .from(tableName)
      .select("*")
      .eq("taluka_name", taluka_name)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

// === District Work Service ===
export const districtWorkService = {
  async getByDistrictAndCategory({
    district_name,
    category,
    work_type,
  }: {
    district_name: string;
    category?: "A" | "B" | "C" | "D";
    work_type: "financial" | "physical";
  }) {
    const tableName = work_type === 'financial' ? 'district_aarakhada_financial' : 'district_aarakhada_physical';
    let query = pesaSupabase
      .from(tableName)
      .select("*")
      .eq("district_name", district_name);
    if (category) {
      query = query.eq("work_category", category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  async insert(workData: any) {
    const tableName = workData.work_type === 'financial' ? 'district_aarakhada_financial' : 'district_aarakhada_physical';
    const { data, error } = await pesaSupabase.from(tableName).insert(workData);
    if (error) throw error;
    return data;
  },
  async getAllByDistrict(district_name: string, work_type: "financial" | "physical") {
    const tableName = work_type === 'financial' ? 'district_aarakhada_financial' : 'district_aarakhada_physical';
    const { data, error } = await pesaSupabase
      .from(tableName)
      .select("*")
      .eq("district_name", district_name)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
// === PESA Work Tracking Operations ===
export const pesaWorkOperations = {
  async getAll() {
    console.log('Fetching all PESA works...');
    const { data, error } = await pesaSupabase
      .from("works")
      .select(`
        *,
        village:villages!village_id(village_name),
        gram_panchayat_work:aarakhada_physical!gram_panchayat_work_id(work_name, work_category)
      `)
      .order("created_at", { ascending: false });
    if (error) {
      console.error('Error fetching PESA works:', error);
      throw error;
    }
    console.log('PESA works data:', data);
    return data ?? [];
  },
  async create(work: any) {
    debugger
    console.log('Creating PESA work:', work);
    const { data, error } = await pesaSupabase
      .from("works")
      .insert([work])
      .select()
      .single();
    if (error) {
      console.error('Error creating PESA work:', error);
      throw error;
    }
    console.log('Created PESA work:', data);
    if (data.village_id && data.work_category && data.year && data.added_month) {
      try {
        const village = await villageService.getById(data.village_id);
        if (village) {
          // Insert into aarakhada_physical
          const physicalData = {
            village_id: data.village_id,
            village_name: village.village_name,
            work_category: data.work_category,
            work_name: data.work_name,
            work_type: 'physical',
            status: 'pending',
            gram_panchayat: village.gram_panchayat,
            taluka: village.block,
            district: village.district,
            start_date: null,
            completion_date: null,
            sanctioned_works: 0,
            completed_works: 0,
            ongoing_works: 0,
            pending_works: 0,
            approved_works: 0,
            progress_works: 0,
            not_started_works: 0,
            physical_progress: 0
          };
          await workService.insert(physicalData);
          console.log('Added to aarakhada_physical table:', physicalData);
          
          // Insert into aarakhada_financial
          const financialData = {
            village_id: data.village_id,
            village_name: village.village_name,
            work_category: data.work_category,
            work_name: data.work_name,
            work_type: 'financial',
            status: 'pending',
            gram_panchayat: village.gram_panchayat,
            taluka: village.block,
            district: village.district,
            start_date: null,
            completion_date: null,
            estimated_amount: 0,
            sanctioned_amount: 0,
            released_amount: 0,
            expenditure: 0,
            physical_progress: 0,
            financial_progress: 0,
            previous_expenditure: 0,
            current_expenditure: 0,
            cumulative_expenditure: 0,
            remaining_funds: 0,
          };
          await workService.insert(financialData);
          console.log('Added to aarakhada_financial table:', financialData);

          // Insert taluka physical data
          const talukaPhysicalData = {
            taluka_name: village.block,
            work_category: data.work_category,
            gram_panchayat: village.gram_panchayat,
            village_id: data.village_id,
            approved_works: 0,
            sanctioned_works: 0,
            completed_works: 0,
            ongoing_works: 0,
            pending_works: 0,
            work_name: data.work_name,
            work_type: 'physical'
          };
          await talukaWorkService.insert(talukaPhysicalData);
          console.log('Added to taluka_aarakhada_physical table:', talukaPhysicalData);

          // Insert taluka financial data
          const talukaFinancialData = {
            taluka_name: village.block,
            work_category: data.work_category,
            gram_panchayat: village.gram_panchayat,
            village_id: data.village_id,
            annual_approved_fund: 0,
            annual_received_fund: 0,
            received_interest: 0,
            total_received_fund: 0,
            previous_expenditure: 0,
            current_expenditure: 0,
            cumulative_expenditure: 0,
            remaining_funds: 0,
            work_name: data.work_name,
            work_type: 'financial',
          };
          await talukaWorkService.insert(talukaFinancialData);
          console.log('Added to taluka_aarakhada_financial table:', talukaFinancialData);

          // --- New District level insertions ---
          // District physical data insertion
          const districtPhysicalData = {
            district_name: village.district,
            taluka_name: village.block,
            pesa_gram_panchayat_count: 0,
            pesa_village_count: 0,
            work_category: data.work_category || null,
            approved_works: 0,
            sanctioned_works: 0,
            completed_works: 0,
            ongoing_works: 0,
            pending_works: 0,
            physical_progress_percentage: 0,
            work_name: data.work_name || null,
            work_type: 'physical',
          };
          await districtWorkService.insert(districtPhysicalData);
          console.log('Added to district_aarakhada_physical table:', districtPhysicalData);

          // District financial data insertion
          const districtFinancialData = {
            taluka_name: village.block,
            pesa_village_count: 0,
            annual_approved_fund: 0,
            annual_received_fund: 0,
            received_interest: 0,
            total_received_fund: 0,
            previous_expenditure: 0,
            current_expenditure: 0,
            cumulative_expenditure: 0,
            remaining_funds: 0,
            work_category: data.work_category || null,
            work_name: data.work_name || null,
            status: 'pending',
            financial_progress: 0,
            start_date: null,
            completion_date: null,
            work_type: 'financial'
          };
          await districtWorkService.insert(districtFinancialData);
          console.log('Added to district_aarakhada_financial table:', districtFinancialData);
        }
      } catch (err) {
        console.error('Error adding to related tables:', err);
      }
    }
    return data;
  },

  async update(id: string, work: any) {
    console.log('Updating PESA work:', id, work);
    const { data, error } = await pesaSupabase
      .from("works")
      .update({
        ...work,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error('Error updating PESA work:', error);
      throw error;
    }
    console.log('Updated PESA work:', data);
    return data;
  },
  async delete(id: string) {
    console.log('Deleting PESA work:', id);
    const { data, error } = await pesaSupabase.from("works").delete().eq("id", id).select();
    if (error) {
      console.error('Error deleting PESA work:', error);
      throw error;
    }
    console.log('Deleted PESA work:', data);
  },
  async duplicate(id: string) {
    console.log('Duplicating PESA work:', id);
    const { data, error } = await pesaSupabase
      .from("works")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error('Error fetching work for duplication:', error);
      throw error;
    }
    const { id: _, created_at, updated_at, ...rest } = data;
    const { data: newWork, error: insertError } = await pesaSupabase.from("works").insert({
      ...rest,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();
    if (insertError) {
      console.error('Error duplicating PESA work:', insertError);
      throw insertError;
    }
    console.log('Duplicated PESA work:', newWork);
    return newWork;
  },
  async getAvailableWorkNames(village_id?: string) {
    console.log('Fetching available work names for village:', village_id);
    let query = pesaSupabase
      .from("aarakhada_physical")
      .select("id, work_name, work_category, village_name, village_id");
    if (village_id) {
      query = query.eq("village_id", village_id);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching available work names:', error);
      throw error;
    }
    console.log('Available work names:', data);
    return data ?? [];
  }
};
// === PESA Workflow Operations ===
export const pesaWorkflowOperations = {
  async getAll() {
    console.log('Fetching all PESA workflows...');
    const { data, error } = await pesaSupabase
      .from("workflows")
      .select(`
        *,
        workflow_steps:workflow_steps(*),
        work:works!work_id(work_name, taluka)
      `)
      .order("created_at", { ascending: false });
    if (error) {
      console.error('Error fetching PESA workflows:', error);
      throw error;
    }
    console.log('PESA workflows data:', data);
    return data ?? [];
  },
  async create(workflow: any) {
    console.log('Creating PESA workflow:', workflow);
    const { data, error } = await pesaSupabase
      .from("workflows")
      .insert([workflow])
      .select()
      .single();
    if (error) {
      console.error('Error creating PESA workflow:', error);
      throw error;
    }
    console.log('Created PESA workflow:', data);
    return data;
  },
  async addStep(step: any) {
    console.log('Adding workflow step:', step);
    const { data, error } = await pesaSupabase
      .from("workflow_steps")
      .insert([step])
      .select()
      .single();
    if (error) {
      console.error('Error adding workflow step:', error);
      throw error;
    }
    console.log('Added workflow step:', data);
    return data;
  },
  async updateWorkflow(id: string, updates: any) {
    console.log('Updating PESA workflow:', id, updates);
    const { data, error } = await pesaSupabase
      .from("workflows")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error('Error updating PESA workflow:', error);
      throw error;
    }
    console.log('Updated PESA workflow:', data);
    return data;
  },
  async updateStep(id: string, updates: any) {
    console.log('Updating workflow step:', id, updates);
    const { data, error } = await pesaSupabase
      .from("workflow_steps")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error('Error updating workflow step:', error);
      throw error;
    }
    console.log('Updated workflow step:', data);
    return data;
  }
};
// === Work Operations ===
export const workOperations = {
  async getAll(): Promise<Work[]> {
    const { data, error } = await supabase
      .from("works")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async create(work: Omit<Work, "id" | "created_at" | "updated_at">): Promise<Work> {
    const { data, error } = await supabase
      .from("works")
      .insert([work])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, work: Partial<Work>): Promise<Work> {
    const { data, error } = await supabase
      .from("works")
      .update({
        ...work,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("works").delete().eq("id", id);
    if (error) throw error;
  },
  async duplicate(id: string): Promise<void> {
    const { data, error } = await supabase
      .from("works")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    const { id: _, created_at, updated_at, ...rest } = data;
    const { error: insertError } = await supabase.from("works").insert({
      ...rest,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertError) throw insertError;
  },
};
// === Workflow Operations ===
export const workflowOperations = {
  async create(workflow: any) {
    const { data, error } = await supabase
      .from("workflows")
      .insert([workflow])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async addStep(step: any) {
    const { data, error } = await supabase
      .from("workflow_steps")
      .insert([step])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
// === Storage Operations ===
export const storageOperations = {
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return data;
  },
  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
  async removeFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
  // PESA specific photo operations
  async uploadWorkflowPhoto(file: File, workflowId: string, stepId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${workflowId}/${stepId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await pesaSupabase.storage
      .from('pesa-workflow-photos')
      .upload(fileName, file, { 
        cacheControl: '3600',
        upsert: false 
      });
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = pesaSupabase.storage
      .from('pesa-workflow-photos')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  },
  async removeWorkflowPhoto(photoUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = photoUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'pesa-workflow-photos');
    if (bucketIndex === -1) return;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    const { error } = await pesaSupabase.storage
      .from('pesa-workflow-photos')
      .remove([filePath]);
    
    if (error) throw error;
  }
};
