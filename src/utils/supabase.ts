import { createClient } from '@supabase/supabase-js';
import { Village, AarakhadaWork } from '../types';

const Password = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bXFrb25kaWhzb21sZWJpempqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTQ0NjcsImV4cCI6MjA2OTI3MDQ2N30.W1fSD_RLJjcsIoJhJDnE6Xri9AIxv5DuAlN65iqI6BE'
const URL = 'https://tvmqkondihsomlebizjj.supabase.co'
const supabaseUrl = URL as string;
const supabaseKey = Password as string;

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
    debugger;
    const tableName = workData.work_type === 'financial' ? 'aarakhada_financial' : 'aarakhada_physical';

    // Insert the work first
    const { data, error } = await pesaSupabase.from(tableName).insert(workData).select().single();
    if (error) throw error;

    // 🔹 Additional logic for financial updates
    if (workData.work_type === "financial") {
      // Fetch village details
      const { data: village, error: vError } = await pesaSupabase
        .from("villages")
        .select("*")
        .eq("id", workData.village_id)
        .single();
      if (vError) throw vError;

      // ---------- Taluka Update ----------
      const { data: existingTaluka } = await pesaSupabase
        .from("taluka_aarakhada_financial")
        .select("*")
        .eq("work_category", workData.work_category)
        .eq("gram_panchayat", village.gram_panchayat)
        .single();

      if (existingTaluka) {
        await pesaSupabase
          .from("taluka_aarakhada_financial")
          .update({
            previous_expenditure: workData.previous_expenditure,
            current_expenditure: workData.current_expenditure,
            cumulative_expenditure: workData.cumulative_expenditure,
            remaining_funds: workData.remaining_funds,
            updated_at: new Date().toISOString(),
          })
          .eq("work_category", workData.work_category)
          .eq("gram_panchayat", village.gram_panchayat);
      } else {
        await pesaSupabase
          .from("taluka_aarakhada_financial")
          .insert({
            work_category: workData.work_category,
            gram_panchayat: village.gram_panchayat,
            previous_expenditure: workData.previous_expenditure || 0,
            current_expenditure: workData.current_expenditure || 0,
            cumulative_expenditure: workData.cumulative_expenditure || 0,
            remaining_funds: workData.remaining_funds || 0,
            created_at: new Date().toISOString(),
          });
      }

      // ---------- District Update ----------
      const { data: existingDistrict } = await pesaSupabase
        .from("district_aarakhada_financial")
        .select("*")
        .eq("taluka_name", village.block)
        .eq("work_category", workData.work_category)
        .single();

      if (existingDistrict) {

        await pesaSupabase
          .from("district_aarakhada_financial")
          .update({
            remaining_funds: workData.remaining_funds,
            updated_at: new Date().toISOString(),
          })
          .eq("taluka_name", workData.taluka)
          .eq("work_category", workData.work_category);
      } else {
        await pesaSupabase
          .from("district_aarakhada_financial")
          .insert({
            taluka_name: workData.taluka,
            work_category: workData.work_category,
            previous_expenditure: workData.previous_expenditure || 0,
            current_expenditure: workData.current_expenditure || 0,
            cumulative_expenditure: workData.cumulative_expenditure || 0,
            remaining_funds: workData.remaining_funds || 0,
            created_at: new Date().toISOString(),
          });
      }
    }

    return data;
  },

  async update(id: string, workData: any) {
    debugger;
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

    // 🔹 Additional logic for financial updates
    if (workData.work_type === "financial") {
      // Fetch village details
      const { data: village, error: vError } = await pesaSupabase
        .from("villages")
        .select("*")
        .eq("id", workData.village_id)
        .single();
      if (vError) throw vError;

      // ---------- Taluka Update ----------
      const { data: existingTaluka } = await pesaSupabase
        .from("taluka_aarakhada_financial")
        .select("*")
        .eq("work_category", workData.work_category)
        .eq("gram_panchayat", village.gram_panchayat)
        .single();

      if (existingTaluka) {
        const calculatedCumulativeExpenditure = (workData.previous_expenditure || 0) + (workData.current_expenditure || 0);

        const calculatedRemainingFunds =
          (existingTaluka.annual_received_fund || 0) - calculatedCumulativeExpenditure;

        await pesaSupabase
          .from("taluka_aarakhada_financial")
          .update({
            previous_expenditure: workData.previous_expenditure,
            current_expenditure: workData.current_expenditure,
            cumulative_expenditure: calculatedCumulativeExpenditure,
            remaining_funds: calculatedRemainingFunds,
            updated_at: new Date().toISOString(),
          })
          .eq("work_category", workData.work_category)
          .eq("gram_panchayat", village.gram_panchayat);
      }
      else {
        await pesaSupabase
          .from("taluka_aarakhada_financial")
          .insert({
            work_category: workData.work_category,
            gram_panchayat: village.gram_panchayat,
            previous_expenditure: workData.previous_expenditure || 0,
            current_expenditure: workData.current_expenditure || 0,
            cumulative_expenditure: workData.cumulative_expenditure || 0,
            remaining_funds: workData.remaining_funds || 0,
            created_at: new Date().toISOString(),
          });
      }

      // ---------- District Update ----------
      const { data: existingDistrict } = await pesaSupabase
        .from("district_aarakhada_financial")
        .select("*")
        .eq("taluka_name", village.block)
        .eq("work_category", workData.work_category)
        .single();

      if (existingDistrict) {

        const calculatedCumulativeExpenditure = (workData.previous_expenditure || 0) + (workData.current_expenditure || 0);


        const calculatedRemainingFunds =
          (existingDistrict.annual_received_fund || 0) - calculatedCumulativeExpenditure;

        await pesaSupabase
          .from("district_aarakhada_financial")
          .update({
            previous_expenditure: workData.previous_expenditure,
            current_expenditure: workData.current_expenditure,
            cumulative_expenditure: calculatedCumulativeExpenditure,
            remaining_funds: calculatedRemainingFunds,
            updated_at: new Date().toISOString(),
          })
          .eq("taluka_name", workData.taluka)
          .eq("work_category", workData.work_category);
      }
      else {
        await pesaSupabase
          .from("district_aarakhada_financial")
          .insert({
            taluka_name: workData.taluka,
            work_category: workData.work_category,
            previous_expenditure: workData.previous_expenditure || 0,
            current_expenditure: workData.current_expenditure || 0,
            cumulative_expenditure: workData.cumulative_expenditure || 0,
            remaining_funds: workData.remaining_funds || 0,
            created_at: new Date().toISOString(),
          });
      }
    }

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
    return data ?? [];
  },

 async create(work: any) {
    debugger
    const { data, error } = await pesaSupabase
      .from("works")
      .insert([work])
      .select()
      .single();
    if (error) {
      console.error('Error creating PESA work:', error);
      throw error;
    }
    if (data.village_id && data.work_category && data.year && data.added_month) {
      try {
        const village = await villageService.getById(data.village_id);
        if (village) {
 
          // ✅ Create work for Grampanchayat: aarakhada_physical table
          const allowedStatuses = ['pending', 'in_progress', 'completed'];
          const status =
            allowedStatuses.includes(data.current_status) ? data.current_status : 'pending';
 
          // Prepare dynamic increment values for physical work counts based on status
          const completedWorksInc = status === 'completed' ? 1 : 0;
          const ongoingWorksInc = status === 'in_progress' ? 1 : 0;
          const pendingWorksInc = status === 'pending' ? 1 : 0;
 
          // Check if physical row exists for this village and category
          const { data: existingPhysical, error: physicalFetchError } = await pesaSupabase
            .from('aarakhada_physical')
            .select('*')
            .eq('village_name', village.village_name)
            .eq('work_category', data.work_category)
            .single();
 
          if (physicalFetchError && physicalFetchError.code !== 'PGRST116') { // PGRST116 = no row found
            throw physicalFetchError;
          }
         
            const aggregatedCompletedWorksInc = completedWorksInc + existingPhysical.completed_works;
            const aggregatedOngoingWorksInc = ongoingWorksInc + existingPhysical.ongoing_works;
            const aggregatedPendingWorksInc = pendingWorksInc + existingPhysical.pending_works;
 
          if (existingPhysical) {
            // Update existing physical row by incrementing counts
            const updatedPhysical = {
              ...existingPhysical,
              completed_works: aggregatedCompletedWorksInc,
              ongoing_works: aggregatedOngoingWorksInc,
              pending_works: aggregatedPendingWorksInc,
              sanctioned_works: aggregatedCompletedWorksInc + aggregatedOngoingWorksInc + aggregatedPendingWorksInc,
              updated_at: new Date().toISOString(),
            };
            await pesaSupabase
              .from('aarakhada_physical')
              .update({
                completed_works: updatedPhysical.completed_works,
                ongoing_works: updatedPhysical.ongoing_works,
                pending_works: updatedPhysical.pending_works,
                sanctioned_works: updatedPhysical.sanctioned_works,
                updated_at: updatedPhysical.updated_at,
              })
              .eq('village_name', village.village_name)
              .eq('work_category', data.work_category);
          } else {
            // Insert new physical row
            const physicalData = {
              village_id: data.village_id,
              village_name: village.village_name,
              work_category: data.work_category,
              work_name: data.work_name,
              work_type: 'physical',
              status,
              gram_panchayat: village.gram_panchayat,
              taluka: village.block,
              district: village.district,
              start_date: data.start_date || null,
              completion_date: data.completion_date || null,
              year: data.year || null,
              added_month: data.added_month || null,
 
              completed_works: completedWorksInc,
              ongoing_works: ongoingWorksInc,
              pending_works: pendingWorksInc,
 
              sanctioned_works: completedWorksInc + ongoingWorksInc + pendingWorksInc,
 
              approved_works: data.approved_works ?? 0,
              progress_works: status === 'in_progress' ? 1 : 0,
              not_started_works: status === 'pending' ? 1 : 0,
              physical_progress: data.physical_progress ?? 0,
            };
            await workService.insert(physicalData);
          }
 
          // ✅ Create work for Grampanchayat: aarakhada_financial table
          const { data: existingFinancial, error: financialFetchError } = await pesaSupabase
            .from('aarakhada_financial')
            .select('*')
            .eq('village_name', village.village_name)
            .eq('work_category', data.work_category)
            .single();
 
          if (financialFetchError && financialFetchError.code !== 'PGRST116') {
            throw financialFetchError;
          }
 
          if (existingFinancial) {
            // 🔄 Aggregate financial from works table
            const { data: worksFinancial, error: fetchWorksError } = await pesaSupabase
              .from("works")
              .select("admin_approval_amount, agreement_approval_amount")
              .eq('village_id', data.village_id)
              .eq("work_category", data.work_category);
 
            if (fetchWorksError) throw fetchWorksError;
 
            const aggregatedFinancial = (worksFinancial || []).reduce(
              (acc, w) => {
                acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
                acc.released_amount += Number(w.agreement_approval_amount) || 0;
                return acc;
              },
              { sanctioned_amount: 0, released_amount: 0 }
            );
 
            // calculate using incoming work (data)
            const calculatedCumulative = (existingFinancial.previous_expenditure || 0) + (existingFinancial.current_expenditure || 0);
            const villageReleasedAmount = aggregatedFinancial.released_amount ?? existingFinancial.released_amount ?? 0;
            const calculatedRemaining = villageReleasedAmount - calculatedCumulative;
 
            await pesaSupabase
              .from('aarakhada_financial')
              .update({
                sanctioned_amount: aggregatedFinancial.sanctioned_amount,
                released_amount: aggregatedFinancial.released_amount,
                previous_expenditure: data.previous_expenditure ?? existingFinancial.previous_expenditure ?? 0,
                current_expenditure: data.current_expenditure ?? existingFinancial.current_expenditure ?? 0,
                cumulative_expenditure: calculatedCumulative,
                remaining_funds: calculatedRemaining,
                updated_at: new Date().toISOString(),
              })
              .eq('village_id', data.village_id)
              .eq('work_category', data.work_category);
 
          } else {
            // Insert new financial row
            const { data: worksFinancial, error: fetchWorksError } = await pesaSupabase
              .from("works")
              .select("admin_approval_amount, agreement_approval_amount")
              .eq("village_id", data.village_id)
              .eq("work_category", data.work_category);
 
            if (fetchWorksError) throw fetchWorksError;
 
            const aggregatedFinancial = (worksFinancial || []).reduce(
              (acc, w) => {
                acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
                acc.released_amount += Number(w.agreement_approval_amount) || 0;
                return acc;
              },
              { sanctioned_amount: 0, released_amount: 0 }
            );
 
            // calculate using new data
            const calculatedCumulative = (data.previous_expenditure || 0) + (data.current_expenditure || 0);
            const calculatedRemaining = aggregatedFinancial.released_amount - calculatedCumulative;
 
            const financialData = {
              village_id: data.village_id,
              village_name: village.village_name,
              gram_panchayat: village.gram_panchayat,
              taluka: village.block,
              district: village.district,
              work_category: data.work_category,
              sanctioned_amount: aggregatedFinancial.sanctioned_amount,
              released_amount: aggregatedFinancial.released_amount,
              previous_expenditure: data.previous_expenditure ?? 0,
              current_expenditure: data.current_expenditure ?? 0,
              cumulative_expenditure: calculatedCumulative,
              remaining_funds: calculatedRemaining,
              year: data.year || null,
              added_month: data.added_month || null,
              work_name: data.work_name,
              work_type: "financial",
              created_at: new Date().toISOString(),
            };
 
            await workService.insert(financialData);
            console.log('Added to aarakhada_financial table:', financialData);
          }
 
 
          // ✅ Create work for Taluka: taluka_aarakhada_physical table
          const { data: villagesUnderGP, error: villagesError } = await pesaSupabase
            .from('villages')
            .select('id')
            .eq('gram_panchayat', village.gram_panchayat);
          if (villagesError) {
            throw villagesError;
          }
          const pesaVillageCount = villagesUnderGP ? villagesUnderGP.length : 0;
 
          const { data: existingTalukaPhysical, error: talukaPhysicalFetchError } = await pesaSupabase
            .from('taluka_aarakhada_physical')
            .select('*')
            .eq('work_category', data.work_category)
            .eq('gram_panchayat', village.gram_panchayat)
            .single();
 
          if (talukaPhysicalFetchError && talukaPhysicalFetchError.code !== 'PGRST116') {
            throw talukaPhysicalFetchError;
          }
 
          // Calculate increments based on status
          const talukaCompletedWorksInc = status === 'completed' ? 1 : 0;
          const talukaOngoingWorksInc = status === 'in_progress' ? 1 : 0;
          const talukaPendingWorksInc = status === 'pending' ? 1 : 0;
 
          if (existingTalukaPhysical) {
 
            const aggregatedCompletedWorksInc = talukaCompletedWorksInc + existingTalukaPhysical.completed_works;
            const aggregatedOngoingWorksInc = talukaOngoingWorksInc + existingTalukaPhysical.ongoing_works;
            const aggregatedPendingWorksInc = talukaPendingWorksInc + existingTalukaPhysical.pending_works;
 
            const updatedTalukaPhysical = {
              ...existingTalukaPhysical,
              completed_works: aggregatedCompletedWorksInc,
              ongoing_works: aggregatedOngoingWorksInc,
              pending_works: aggregatedPendingWorksInc,
              sanctioned_works: aggregatedCompletedWorksInc + aggregatedOngoingWorksInc + aggregatedPendingWorksInc,
              updated_at: new Date().toISOString(),
            };
 
            await pesaSupabase
              .from('taluka_aarakhada_physical')
              .update({
                completed_works: updatedTalukaPhysical.completed_works,
                ongoing_works: updatedTalukaPhysical.ongoing_works,
                pending_works: updatedTalukaPhysical.pending_works,
                sanctioned_works: updatedTalukaPhysical.sanctioned_works,
                updated_at: updatedTalukaPhysical.updated_at,
              })
              .eq('work_category', data.work_category)
              .eq('gram_panchayat', village.gram_panchayat);
          } else {
            // Insert new taluka physical row
            const talukaPhysicalData = {
              taluka_name: village.block,
              work_category: data.work_category,
              gram_panchayat: village.gram_panchayat,
              village_id: data.village_id,
              approved_works: data.approved_works ?? 0,
              completed_works: talukaCompletedWorksInc,
              ongoing_works: talukaOngoingWorksInc,
              pending_works: talukaPendingWorksInc,
              sanctioned_works: talukaCompletedWorksInc + talukaOngoingWorksInc + talukaPendingWorksInc,
              work_name: data.work_name,
              work_type: 'physical',
              pesa_village_count: pesaVillageCount,
            };
            await talukaWorkService.insert(talukaPhysicalData);
            console.log('Inserted new taluka_aarakhada_physical row:', talukaPhysicalData);
          }
 
          // ✅ Create work for Taluka: taluka_aarakhada_financial table
          const { data: existingTalukaFinancial, error: talukaFinancialFetchError } = await pesaSupabase
            .from('taluka_aarakhada_financial')
            .select('*')
            .eq('work_category', data.work_category)
            .eq('gram_panchayat', village.gram_panchayat)
            .single();
 
          if (talukaFinancialFetchError && talukaFinancialFetchError.code !== 'PGRST116') {
            throw talukaFinancialFetchError;
          }
 
          if (existingTalukaFinancial) {
            // Aggregate financial from works table
            const { data: talukaWorksFinancial, error: fetchTalukaWorksError } = await pesaSupabase
              .from("works")
              .select("admin_approval_amount, agreement_approval_amount")
              .eq("pesa_grampanchayat", village.gram_panchayat)
              .eq("work_category", data.work_category);
 
            if (fetchTalukaWorksError) throw fetchTalukaWorksError;
 
            const aggregatedTalukaFinancial = (talukaWorksFinancial || []).reduce(
              (acc, w) => {
                acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
                acc.released_amount += Number(w.agreement_approval_amount) || 0;
                return acc;
              },
              { sanctioned_amount: 0, released_amount: 0 }
            );
 
            // Use incoming work (data) values to calculate cumulative and remaining
            const calculatedTalukaCumulative = (existingTalukaFinancial.previous_expenditure || 0) + (existingTalukaFinancial.current_expenditure || 0);
 
            // Prefer aggregated released_amount, fallback to stored annual_received_fund if needed
            const talukaAnnualReceived = aggregatedTalukaFinancial.released_amount ?? existingTalukaFinancial.annual_received_fund ?? 0;
            const calculatedTalukaRemaining = talukaAnnualReceived - calculatedTalukaCumulative;
 
            await pesaSupabase
              .from('taluka_aarakhada_financial')
              .update({
                annual_approved_fund: aggregatedTalukaFinancial.sanctioned_amount,
                annual_received_fund: aggregatedTalukaFinancial.released_amount,
                previous_expenditure: data.previous_expenditure ?? existingTalukaFinancial.previous_expenditure ?? 0,
                current_expenditure: data.current_expenditure ?? existingTalukaFinancial.current_expenditure ?? 0,
                cumulative_expenditure: calculatedTalukaCumulative,
                remaining_funds: calculatedTalukaRemaining,
                updated_at: new Date().toISOString(),
              })
              .eq('work_category', data.work_category)
              .eq('gram_panchayat', village.gram_panchayat);
 
          } else {
            // ✅ Compute sums even for new insert
            const { data: talukaWorksFinancial, error: fetchTalukaWorksError } = await pesaSupabase
              .from("works")
              .select("admin_approval_amount, agreement_approval_amount")
              .eq("pesa_grampanchayat", village.gram_panchayat)
              .eq("work_category", data.work_category);
 
            if (fetchTalukaWorksError) throw fetchTalukaWorksError;
 
            const aggregatedTalukaFinancial = (talukaWorksFinancial || []).reduce(
              (acc, w) => {
                acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
                acc.released_amount += Number(w.agreement_approval_amount) || 0;
                return acc;
              },
              { sanctioned_amount: 0, released_amount: 0 }
            );
 
            // calculate cumulative & remaining using the new work (data)
            const calculatedTalukaCumulative = (data.previous_expenditure || 0) + (data.current_expenditure || 0);
            const talukaAnnualReceived = aggregatedTalukaFinancial.released_amount || 0;
            const calculatedTalukaRemaining = talukaAnnualReceived - calculatedTalukaCumulative;
 
            const talukaFinancialData = {
              taluka_name: village.block,
              work_category: data.work_category,
              gram_panchayat: village.gram_panchayat,
              village_id: data.village_id,
              annual_approved_fund: aggregatedTalukaFinancial.sanctioned_amount,
              annual_received_fund: aggregatedTalukaFinancial.released_amount,
              received_interest: data.received_interest ?? 0,
              total_received_fund: data.total_received_fund ?? 0,
              previous_expenditure: data.previous_expenditure ?? 0,
              current_expenditure: data.current_expenditure ?? 0,
              cumulative_expenditure: calculatedTalukaCumulative,
              remaining_funds: calculatedTalukaRemaining,
              work_name: data.work_name,
              work_type: 'financial',
              pesa_village_count: pesaVillageCount,
              sanctioned_works: (data.completed_works ?? 0) + (data.ongoing_works ?? 0) + (data.pending_works ?? 0),
            };
            await talukaWorkService.insert(talukaFinancialData);
            console.log('Inserted new taluka_aarakhada_financial row:', talukaFinancialData);
          }
 
          // ✅ Create work for District : district_aarakhada_physical table
          const { data: allVillagesInTaluka, error: allVillagesInTalukaError } = await pesaSupabase
            .from('villages')
            .select('id, gram_panchayat')
            .eq('block', village.block);
          if (allVillagesInTalukaError) throw allVillagesInTalukaError;
 
          const uniqueGramPanchayatsInTaluka = new Set(allVillagesInTaluka?.map(v => v.gram_panchayat) || []);
          const pesaGramPanchayatCount = uniqueGramPanchayatsInTaluka.size;
          const pesaVillageCountInTaluka = allVillagesInTaluka?.length || 0;
 
          // Check if district physical row exists for this taluka and work_category
          const { data: existingDistrictPhysical, error: districtPhysicalFetchError } = await pesaSupabase
            .from('district_aarakhada_physical')
            .select('*')
            .eq('taluka_name', village.block)
            .eq('work_category', data.work_category)
            .single();
 
          if (districtPhysicalFetchError && districtPhysicalFetchError.code !== 'PGRST116') {
            throw districtPhysicalFetchError;
          }
 
          if (existingDistrictPhysical) {
 
          const districtCompletedWorksInc = status === 'completed' ? 1 : 0;
          const districtOngoingWorksInc = status === 'in_progress' ? 1 : 0;
          const districtPendingWorksInc = status === 'pending' ? 1 : 0;
 
          const aggregatedCompletedWorksInc = districtCompletedWorksInc + existingDistrictPhysical.completed_works;
            const aggregatedOngoingWorksInc = districtOngoingWorksInc + existingDistrictPhysical.ongoing_works;
            const aggregatedPendingWorksInc = districtPendingWorksInc + existingDistrictPhysical.pending_works;
 
 
            const updatedDistrictPhysical = {
              ...existingDistrictPhysical,
              completed_works: aggregatedCompletedWorksInc,
              ongoing_works: aggregatedOngoingWorksInc,
              pending_works: aggregatedPendingWorksInc,
              sanctioned_works:
                aggregatedCompletedWorksInc+
                aggregatedOngoingWorksInc +
                aggregatedPendingWorksInc,
              pesa_gram_panchayat_count: pesaGramPanchayatCount,
              pesa_village_count: pesaVillageCountInTaluka,
              updated_at: new Date().toISOString(),
            };
 
            await pesaSupabase
              .from('district_aarakhada_physical')
              .update({
                completed_works: updatedDistrictPhysical.completed_works,
                ongoing_works: updatedDistrictPhysical.ongoing_works,
                pending_works: updatedDistrictPhysical.pending_works,
                sanctioned_works: updatedDistrictPhysical.sanctioned_works,
                pesa_gram_panchayat_count: updatedDistrictPhysical.pesa_gram_panchayat_count,
                pesa_village_count: updatedDistrictPhysical.pesa_village_count,
                updated_at: updatedDistrictPhysical.updated_at,
              })
              .eq('taluka_name', village.block)
              .eq('work_category', data.work_category);
          } else {
            // Insert new district physical row
            const districtCompletedWorksInc = status === 'completed' ? 1 : 0;
            const districtOngoingWorksInc = status === 'in_progress' ? 1 : 0;
            const districtPendingWorksInc = status === 'pending' ? 1 : 0;
 
            const districtPhysicalData = {
              district_name: village.district,
              taluka_name: village.block,
              village_id: data.village_id,
              pesa_gram_panchayat_count: pesaGramPanchayatCount,
              pesa_village_count: pesaVillageCountInTaluka,
              work_category: data.work_category || null,
              approved_works: data.approved_works ?? 0,
              sanctioned_works: districtCompletedWorksInc + districtOngoingWorksInc + districtPendingWorksInc,
              completed_works: districtCompletedWorksInc,
              ongoing_works: districtOngoingWorksInc,
              pending_works: districtPendingWorksInc,
              physical_progress_percentage: data.physical_progress_percentage ?? 0,
              work_name: data.work_name || null,
              work_type: 'physical',
            };
            await districtWorkService.insert(districtPhysicalData);
            console.log('Inserted new district_aarakhada_physical row:', districtPhysicalData);
          }
 
 
          // ✅ Create work for District : district_aarakhada_financial table
          const { data: existingDistrictFinancial, error: districtFinancialFetchError } = await pesaSupabase
            .from('district_aarakhada_financial')
            .select('*')
            .eq('taluka_name', village.block)
            .eq('work_category', data.work_category)
            .single();
 
          if (districtFinancialFetchError && districtFinancialFetchError.code !== 'PGRST116') {
            throw districtFinancialFetchError;
          }
 
          if (existingDistrictFinancial) {
            const { data: districtWorksFinancial, error: fetchDistrictWorksError } = await pesaSupabase
              .from("works")
              .select("admin_approval_amount, agreement_approval_amount")
              .eq("taluka", village.block)
              .eq("work_category", data.work_category);
 
            if (fetchDistrictWorksError) throw fetchDistrictWorksError;
 
            const aggregatedDistrictFinancial = (districtWorksFinancial || []).reduce(
              (acc, w) => {
                acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
                acc.released_amount += Number(w.agreement_approval_amount) || 0;
                return acc;
              },
              { sanctioned_amount: 0, released_amount: 0 }
            );
 
            // Calculate expenditure and remaining funds
            const calculatedCumulative = (existingDistrictFinancial.previous_expenditure || 0) + (existingDistrictFinancial.current_expenditure || 0);
            const districtAnnualReceived = aggregatedDistrictFinancial.released_amount ?? existingDistrictFinancial.annual_received_fund ?? 0;
            const calculatedRemaining = districtAnnualReceived - calculatedCumulative;
 
            await pesaSupabase
              .from('district_aarakhada_financial')
              .update({
                annual_approved_fund: aggregatedDistrictFinancial.sanctioned_amount,
                annual_received_fund: aggregatedDistrictFinancial.released_amount,
                previous_expenditure: data.previous_expenditure ?? existingDistrictFinancial.previous_expenditure ?? 0,
                current_expenditure: data.current_expenditure ?? existingDistrictFinancial.current_expenditure ?? 0,
                cumulative_expenditure: calculatedCumulative,
                remaining_funds: calculatedRemaining,
                pesa_village_count: pesaVillageCountInTaluka,
                updated_at: new Date().toISOString(),
              })
              .eq('taluka_name', village.block)
              .eq('work_category', data.work_category);
 
          } else {
            const { data: districtWorksFinancial, error: fetchDistrictWorksError } = await pesaSupabase
              .from("works")
              .select("admin_approval_amount, agreement_approval_amount")
              .eq("taluka", village.block)
              .eq("work_category", data.work_category);
 
            if (fetchDistrictWorksError) throw fetchDistrictWorksError;
 
            const aggregatedDistrictFinancial = (districtWorksFinancial || []).reduce(
              (acc, w) => {
                acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
                acc.released_amount += Number(w.agreement_approval_amount) || 0;
                return acc;
              },
              { sanctioned_amount: 0, released_amount: 0 }
            );
 
            // Calculate expenditure and remaining funds
            const calculatedCumulative = (data.previous_expenditure || 0) + (data.current_expenditure || 0);
            const calculatedRemaining = aggregatedDistrictFinancial.released_amount - calculatedCumulative;
 
            const districtFinancialData = {
              district_name: village.district,
              taluka_name: village.block,
              village_id: data.village_id,
              pesa_village_count: pesaVillageCountInTaluka,
              annual_approved_fund: aggregatedDistrictFinancial.sanctioned_amount,
              annual_received_fund: aggregatedDistrictFinancial.released_amount,
              previous_expenditure: data.previous_expenditure ?? 0,
              current_expenditure: data.current_expenditure ?? 0,
              cumulative_expenditure: calculatedCumulative,
              remaining_funds: calculatedRemaining,
              received_interest: data.received_interest ?? 0,
              total_received_fund: data.total_received_fund ?? 0,
              work_category: data.work_category || null,
              work_name: data.work_name || null,
              status: data.current_status || 'pending',
              financial_progress: data.financial_progress ?? 0,
              start_date: data.start_date || null,
              completion_date: data.completion_date || null,
              work_type: 'financial',
              created_at: new Date().toISOString(),
            };
 
            await districtWorkService.insert(districtFinancialData);
            console.log('Inserted new district_aarakhada_financial row:', districtFinancialData);
          }
        }
      } catch (err) {
        console.error('Error adding to related tables:', err);
      }
    }
    return data;
  },
 

  async update(id: string, work: any) {
    debugger
    // Fetch existing record
    const { data: currentWork, error: fetchError } = await pesaSupabase
      .from("works")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Update works table
    const { data, error } = await pesaSupabase
      .from("works")
      .update({ ...work, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    try {
      // ✅ Always sync aarakhada_physical
      const { data: existingPhysical, error: fetchPhysicalError } = await pesaSupabase
        .from("aarakhada_physical")
        .select("*")
        .eq("village_id", currentWork.village_id)
        .eq("work_category", currentWork.work_category)
        .single();

      if (fetchPhysicalError && fetchPhysicalError.code !== "PGRST116") {
        throw fetchPhysicalError;
      }

      if (existingPhysical) {
        const allowedStatuses = ['pending', 'in_progress', 'completed'];
        const newStatus = allowedStatuses.includes(work.current_status) ? work.current_status : 'pending';

        const completedWorksInc = newStatus === 'completed' ? 1 : 0;
        const ongoingWorksInc = newStatus === 'in_progress' ? 1 : 0;
        const pendingWorksInc = newStatus === 'pending' ? 1 : 0;

        let completed = existingPhysical.completed_works || 0;
        let ongoing = existingPhysical.ongoing_works || 0;
        let pending = existingPhysical.pending_works || 0;

        if (currentWork.current_status !== work.current_status) {
          if (currentWork.current_status === "completed") completed = Math.max(completed - 1, 0);
          if (currentWork.current_status === "in_progress") ongoing = Math.max(ongoing - 1, 0);
          if (currentWork.current_status === "pending") pending = Math.max(pending - 1, 0);

          completed += completedWorksInc;
          ongoing += ongoingWorksInc;
          pending += pendingWorksInc;
        }

        await pesaSupabase
          .from("aarakhada_physical")
          .update({
            status: work.current_status,
            completed_works: completed,
            ongoing_works: ongoing,
            pending_works: pending,
            updated_at: new Date().toISOString(),
          })
          .eq("village_id", currentWork.village_id)
          .eq("work_category", currentWork.work_category);
      }

      // ✅ Always sync taluka_aarakhada_physical
      const { data: existingTalukaPhysical, error: talukaPhysicalFetchError } =
        await pesaSupabase
          .from("taluka_aarakhada_physical")
          .select("*")
          .eq("taluka_name", currentWork.taluka)
          .eq("gram_panchayat", currentWork.pesa_grampanchayat)
          .eq("work_category", currentWork.work_category)
          .single();

      if (talukaPhysicalFetchError && talukaPhysicalFetchError.code !== "PGRST116") {
        throw talukaPhysicalFetchError;
      }

      if (existingTalukaPhysical) {
        const { data: allVillageWorks, error: aggError } = await pesaSupabase
          .from("aarakhada_physical")
          .select("completed_works, ongoing_works, pending_works")
          .eq("gram_panchayat", currentWork.pesa_grampanchayat)
          .eq("work_category", currentWork.work_category);

        if (aggError) throw aggError;
        const aggregated =
          allVillageWorks?.reduce(
            (acc, curr) => ({
              completed_works: acc.completed_works + (curr.completed_works ?? 0),
              ongoing_works: acc.ongoing_works + (curr.ongoing_works ?? 0),
              pending_works: acc.pending_works + (curr.pending_works ?? 0),
            }),
            { completed_works: 0, ongoing_works: 0, pending_works: 0 }
          ) ?? { completed_works: 0, ongoing_works: 0, pending_works: 0 };

        const updatedTalukaPhysical = {
          completed_works: aggregated.completed_works,
          ongoing_works: aggregated.ongoing_works,
          pending_works: aggregated.pending_works,
          sanctioned_works:
            aggregated.completed_works +
            aggregated.ongoing_works +
            aggregated.pending_works,
          updated_at: new Date().toISOString(),
        };

        await pesaSupabase
          .from("taluka_aarakhada_physical")
          .update({
            completed_works: updatedTalukaPhysical.completed_works,
            ongoing_works: updatedTalukaPhysical.ongoing_works,
            pending_works: updatedTalukaPhysical.pending_works,
            sanctioned_works: updatedTalukaPhysical.sanctioned_works,
            updated_at: updatedTalukaPhysical.updated_at,
          })
          .eq("taluka_name", currentWork.taluka)
          .eq("gram_panchayat", currentWork.pesa_grampanchayat)
          .eq("work_category", currentWork.work_category);
      }

      // ✅ Always sync district_aarakhada_physical
      const { data: existingDistrictPhysical, error: districtPhysicalFetchError } =
        await pesaSupabase
          .from("district_aarakhada_physical")
          .select("*")
          .eq("taluka_name", currentWork.taluka)
          .eq("work_category", currentWork.work_category)
          .single();

      if (districtPhysicalFetchError && districtPhysicalFetchError.code !== "PGRST116") {
        throw districtPhysicalFetchError;
      }

      if (existingDistrictPhysical) {
        const { data: allVillageWorks, error: aggError } = await pesaSupabase
          .from("aarakhada_physical")
          .select("completed_works, ongoing_works, pending_works")
          .eq("taluka", currentWork.taluka)
          .eq("work_category", currentWork.work_category);

        if (aggError) throw aggError;
        const aggregated =
          allVillageWorks?.reduce(
            (acc, curr) => ({
              completed_works: acc.completed_works + (curr.completed_works ?? 0),
              ongoing_works: acc.ongoing_works + (curr.ongoing_works ?? 0),
              pending_works: acc.pending_works + (curr.pending_works ?? 0),
            }),
            { completed_works: 0, ongoing_works: 0, pending_works: 0 }
          ) ?? { completed_works: 0, ongoing_works: 0, pending_works: 0 };

        const updatedDistrictPhysical = {
          completed_works: aggregated.completed_works,
          ongoing_works: aggregated.ongoing_works,
          pending_works: aggregated.pending_works,
          sanctioned_works:
            aggregated.completed_works +
            aggregated.ongoing_works +
            aggregated.pending_works,
          updated_at: new Date().toISOString(),
        };

        await pesaSupabase
          .from("district_aarakhada_physical")
          .update({
            completed_works: updatedDistrictPhysical.completed_works,
            ongoing_works: updatedDistrictPhysical.ongoing_works,
            pending_works: updatedDistrictPhysical.pending_works,
            sanctioned_works: updatedDistrictPhysical.sanctioned_works,
            updated_at: updatedDistrictPhysical.updated_at,
          })
          .eq("taluka_name", currentWork.taluka)
          .eq("work_category", currentWork.work_category);
      }

      // ---------- VILLAGE level (aarakhada_financial) ----------
      // compute aggregated sanctioned/released (keep this so sanctioned/released are current)
      const { data: villageWorksFinancial, error: fetchVillageWorksError } = await pesaSupabase
        .from("works")
        .select("admin_approval_amount, agreement_approval_amount")
        .eq("village_id", currentWork.village_id)
        .eq("work_category", currentWork.work_category);

      if (fetchVillageWorksError) throw fetchVillageWorksError;

      const aggregatedVillageFinancial = villageWorksFinancial?.reduce(
        (acc, w) => {
          acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
          acc.released_amount += Number(w.agreement_approval_amount) || 0;
          return acc;
        },
        { sanctioned_amount: 0, released_amount: 0 }
      ) ?? { sanctioned_amount: 0, released_amount: 0 };

      // fetch existing village row (if any)
      const { data: existingVillageFinancial, error: fetchVillageFinError } = await pesaSupabase
        .from("aarakhada_financial")
        .select("*")
        .eq("village_id", currentWork.village_id)
        .eq("work_category", currentWork.work_category)
        .single();

      if (fetchVillageFinError && fetchVillageFinError.code !== "PGRST116") {
        throw fetchVillageFinError;
      }

      // calculate cumulative using incoming work values (do NOT aggregate previous/current across all works)
      const calculatedVillageCumulative = (existingVillageFinancial.previous_expenditure || 0) + (existingVillageFinancial.current_expenditure || 0);
      // use aggregated released_amount (annual received) to compute remaining_funds as requested
      const villageAnnualReceived = aggregatedVillageFinancial.released_amount || 0;
      const calculatedVillageRemaining = villageAnnualReceived - calculatedVillageCumulative;

      if (existingVillageFinancial) {
        await pesaSupabase
          .from("aarakhada_financial")
          .update({
            status: work.current_status ?? existingVillageFinancial.status,
            sanctioned_amount: aggregatedVillageFinancial.sanctioned_amount,
            released_amount: aggregatedVillageFinancial.released_amount,
            expenditure: work.expenditure ?? existingVillageFinancial.expenditure ?? 0,
            previous_expenditure: work.previous_expenditure ?? existingVillageFinancial.previous_expenditure ?? 0,
            current_expenditure: work.current_expenditure ?? existingVillageFinancial.current_expenditure ?? 0,
            cumulative_expenditure: calculatedVillageCumulative,
            remaining_funds: calculatedVillageRemaining,
            updated_at: new Date().toISOString(),
          })
          .eq("village_id", currentWork.village_id)
          .eq("work_category", currentWork.work_category);
      } else {
        // insert new village financial row with the provided values (as you requested)
        await pesaSupabase
          .from("aarakhada_financial")
          .insert({
            village_id: currentWork.village_id,
            work_category: currentWork.work_category,
            previous_expenditure: work.previous_expenditure || 0,
            current_expenditure: work.current_expenditure || 0,
            cumulative_expenditure: work.cumulative_expenditure ?? (work.previous_expenditure || 0) + (work.current_expenditure || 0),
            remaining_funds: work.remaining_funds ?? 0,
            created_at: new Date().toISOString(),
          });
      }

      // ---------- TALUKA level (taluka_aarakhada_financial) ----------
      const { data: talukaWorksFinancial, error: fetchTalukaWorksError } = await pesaSupabase
        .from("works")
        .select("admin_approval_amount, agreement_approval_amount")
        .eq("pesa_grampanchayat", currentWork.pesa_grampanchayat)
        .eq("work_category", currentWork.work_category);

      if (fetchTalukaWorksError) throw fetchTalukaWorksError;

      const aggregatedTalukaFinancial = talukaWorksFinancial?.reduce(
        (acc, w) => {
          acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
          acc.released_amount += Number(w.agreement_approval_amount) || 0;
          return acc;
        },
        { sanctioned_amount: 0, released_amount: 0 }
      ) ?? { sanctioned_amount: 0, released_amount: 0 };

      // fetch existing taluka row
      const { data: existingTalukaFinancial, error: fetchTalukaFinError } = await pesaSupabase
        .from("taluka_aarakhada_financial")
        .select("*")
        .eq("work_category", currentWork.work_category)
        .eq("gram_panchayat", currentWork.pesa_grampanchayat)
        .single();

      if (fetchTalukaFinError && fetchTalukaFinError.code !== "PGRST116") {
        throw fetchTalukaFinError;
      }

      // compute cumulative using incoming work values (not aggregated across all works)
      const calculatedTalukaCumulative = (existingTalukaFinancial.previous_expenditure || 0) + (existingTalukaFinancial.current_expenditure || 0);
      // remaining = annual_received_fund - cumulative (use aggregated annual received for taluka)
      const talukaAnnualReceived = aggregatedTalukaFinancial.released_amount || 0;
      const calculatedTalukaRemaining = talukaAnnualReceived - calculatedTalukaCumulative;

      if (existingTalukaFinancial) {
        await pesaSupabase
          .from("taluka_aarakhada_financial")
          .update({
            annual_approved_fund: aggregatedTalukaFinancial.sanctioned_amount,
            annual_received_fund: aggregatedTalukaFinancial.released_amount,
            previous_expenditure: work.previous_expenditure ?? existingTalukaFinancial.previous_expenditure ?? 0,
            current_expenditure: work.current_expenditure ?? existingTalukaFinancial.current_expenditure ?? 0,
            cumulative_expenditure: calculatedTalukaCumulative,
            remaining_funds: calculatedTalukaRemaining,
            updated_at: new Date().toISOString(),
          })
          .eq("work_category", currentWork.work_category)
          .eq("gram_panchayat", currentWork.pesa_grampanchayat);
      } else {
        // insert taluka row with provided values (as per your instruction)
        await pesaSupabase
          .from("taluka_aarakhada_financial")
          .insert({
            taluka_name: currentWork.taluka,
            work_category: currentWork.work_category,
            gram_panchayat: currentWork.pesa_grampanchayat,
            previous_expenditure: work.previous_expenditure || 0,
            current_expenditure: work.current_expenditure || 0,
            cumulative_expenditure: work.cumulative_expenditure ?? (work.previous_expenditure || 0) + (work.current_expenditure || 0),
            remaining_funds: work.remaining_funds ?? 0,
            created_at: new Date().toISOString(),
          });
      }

      // ---------- DISTRICT level (district_aarakhada_financial) ----------
      const { data: districtWorksFinancial, error: fetchDistrictWorksError } = await pesaSupabase
        .from("works")
        .select("admin_approval_amount, agreement_approval_amount")
        .eq("taluka", currentWork.taluka)
        .eq("work_category", currentWork.work_category);

      if (fetchDistrictWorksError) throw fetchDistrictWorksError;

      const aggregatedDistrictFinancial = districtWorksFinancial?.reduce(
        (acc, w) => {
          acc.sanctioned_amount += Number(w.admin_approval_amount) || 0;
          acc.released_amount += Number(w.agreement_approval_amount) || 0;
          return acc;
        },
        { sanctioned_amount: 0, released_amount: 0 }
      ) ?? { sanctioned_amount: 0, released_amount: 0 };

      // fetch existing district row
      const { data: existingDistrictFinancial, error: fetchDistrictFinError } = await pesaSupabase
        .from("district_aarakhada_financial")
        .select("*")
        .eq("taluka_name", currentWork.taluka)
        .eq("work_category", currentWork.work_category)
        .single();

      if (fetchDistrictFinError && fetchDistrictFinError.code !== "PGRST116") {
        throw fetchDistrictFinError;
      }

      // compute cumulative using incoming work values (not aggregated across all works)
      const calculatedDistrictCumulative = (existingDistrictFinancial.previous_expenditure || 0) + (existingDistrictFinancial.current_expenditure || 0);
      const districtAnnualReceived = aggregatedDistrictFinancial.released_amount || 0;
      const calculatedDistrictRemaining = districtAnnualReceived - calculatedDistrictCumulative;

      if (existingDistrictFinancial) {
        // Per your requirement: only update remaining_funds (calculated using annual received - cumulative)
        await pesaSupabase
          .from("district_aarakhada_financial")
          .update({
            annual_approved_fund: aggregatedDistrictFinancial.sanctioned_amount,
            annual_received_fund: aggregatedDistrictFinancial.released_amount,
            previous_expenditure: work.previous_expenditure ?? existingDistrictFinancial.previous_expenditure ?? 0,
            current_expenditure: work.current_expenditure ?? existingDistrictFinancial.current_expenditure ?? 0,
            cumulative_expenditure: calculatedDistrictCumulative,
            remaining_funds: calculatedDistrictRemaining,
            updated_at: new Date().toISOString(),
          })
          .eq("taluka_name", currentWork.taluka)
          .eq("work_category", currentWork.work_category);
      } else {
        // insert district row with the provided remaining value
        await pesaSupabase
          .from("district_aarakhada_financial")
          .insert({
            district_name: currentWork.district,
            taluka_name: currentWork.taluka,
            work_category: currentWork.work_category,
            previous_expenditure: work.previous_expenditure || 0,
            current_expenditure: work.current_expenditure || 0,
            cumulative_expenditure: work.cumulative_expenditure ?? (work.previous_expenditure || 0) + (work.current_expenditure || 0),
            remaining_funds: work.remaining_funds ?? 0,
            created_at: new Date().toISOString(),
          });
      }

    } catch (err) {
      console.error('Error syncing aarakhada tables:', err);
    }

    return data;
  },

  async delete(id: string) {
    const { data, error } = await pesaSupabase.from("works").delete().eq("id", id).select();
    if (error) {
      console.error('Error deleting PESA work:', error);
      throw error;
    }
  },
  async duplicate(id: string) {
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
    return newWork;
  },
  async getAvailableWorkNames(village_id?: string) {
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
    return data ?? [];
  }
};

// === PESA Workflow Operations ===
export const pesaWorkflowOperations = {
  async getAll() {
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
    return data ?? [];
  },
  async create(workflow: any) {
    const { data, error } = await pesaSupabase
      .from("workflows")
      .insert([workflow])
      .select()
      .single();
    if (error) {
      console.error('Error creating PESA workflow:', error);
      throw error;
    }
    return data;
  },
  async addStep(step: any) {
    const { data, error } = await pesaSupabase
      .from("workflow_steps")
      .insert([step])
      .select()
      .single();
    if (error) {
      console.error('Error adding workflow step:', error);
      throw error;
    }
    return data;
  },
  
async updateWorkflow(id: string, updates: any) {debugger;
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

  // ✅ Update current_status in works table if workflow is completed
  if (updates.status === 'completed' && data?.work_id) {
    const { error: workError } = await pesaSupabase
      .from("works")
      .update({ current_status: 'completed' })
      .eq("id", data.work_id);
    if (workError) {
      console.error('Error updating work current_status:', workError);
      throw workError;
    }
  }

  return data;
},

  async updateStep(id: string, updates: any) {debugger
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