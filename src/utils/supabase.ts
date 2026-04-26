import { createClient } from '@supabase/supabase-js';
import { Village, AarakhadaWork } from '../types';

const Password = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bXFrb25kaWhzb21sZWJpempqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTQ0NjcsImV4cCI6MjA2OTI3MDQ2N30.W1fSD_RLJjcsIoJhJDnE6Xri9AIxv5DuAlN65iqI6BE'
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://tvmqkondihsomlebizjj.supabase.co';
const supabaseUrl = URL as string;
const supabaseKey = Password as string;

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
  async insert(workData: any) {debugger

    const tableName = workData.work_type === 'financial' ? 'aarakhada_financial' : 'aarakhada_physical';
    // Debug: log payload and break here to inspect in devtools
    console.log('workService.insert payload:', workData, 'targetTable:', tableName);
    debugger;

    // Insert the work first
    const { data, error } = await pesaSupabase.from(tableName).insert(workData).select().single();
    if (error) throw error;

    // 🔹 Additional logic for financial updates
    if (workData.work_type === "financial") {
      const worksUpdate: any = {};
      if (workData.sanctioned_amount !== undefined && workData.sanctioned_amount !== null) {
        worksUpdate.admin_approval_amount = workData.sanctioned_amount;
      }
      if (workData.released_amount !== undefined && workData.released_amount !== null) {
        worksUpdate.agreement_approval_amount = workData.released_amount;
      }
      if (Object.keys(worksUpdate).length) {
        await pesaSupabase
          .from("works")
          .update(worksUpdate)
          .eq("village_id", workData.village_id)
          .eq("work_category", workData.work_category)
          .eq("work_name", workData.work_name);
      }
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
            previous_expenditure: workData.previous_expenditure,
            current_expenditure: workData.current_expenditure,
            cumulative_expenditure: workData.cumulative_expenditure,
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

  async update(id: string, workData: any) {debugger

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
      const worksUpdate: any = {};
      if (workData.sanctioned_amount !== undefined && workData.sanctioned_amount !== null) {
        worksUpdate.admin_approval_amount = workData.sanctioned_amount;
      }
      if (workData.released_amount !== undefined && workData.released_amount !== null) {
        worksUpdate.agreement_approval_amount = workData.released_amount;
      }
      if (Object.keys(worksUpdate).length) {
        await pesaSupabase
          .from("works")
          .update(worksUpdate)
          .eq("village_id", workData.village_id)
          .eq("work_category", workData.work_category)
          .eq("work_name", workData.work_name);
      }
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
    debugger;

    const trimmedWorkName = work.work_name?.trim();

    const { data: existingWork, error: checkError } = await pesaSupabase
      .from('works')
      .select('id')
      .eq('village_id', work.village_id)
      .eq('work_category', work.work_category)
      .ilike('work_name', trimmedWorkName)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingWork) {
      throw new Error('DUPLICATE_WORK');
    }

    work.work_name = trimmedWorkName;

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
          const status = allowedStatuses.includes(data.current_status) ? data.current_status : 'pending';

          const completedWorksInc = status === 'completed' ? 1 : 0;
          const ongoingWorksInc = status === 'in_progress' ? 1 : 0;
          const pendingWorksInc = status === 'pending' ? 1 : 0;

          // aarakhada_physical table - update or insert
          const { data: existingPhysical, error: physicalFetchError } = await pesaSupabase
            .from('aarakhada_physical')
            .select('*')
            .eq('village_name', village.village_name)
            .eq('work_category', data.work_category)
            .single();

          if (physicalFetchError && physicalFetchError.code !== 'PGRST116') {
            throw physicalFetchError;
          }
          if (existingPhysical) {
            await pesaSupabase
              .from('aarakhada_physical')
              .update({
                village_name: village.village_name,
                work_category: data.work_category,
                added_month: data.added_month || null,
                completed_works: completedWorksInc + (existingPhysical.completed_works || 0),
                ongoing_works: ongoingWorksInc + (existingPhysical.ongoing_works || 0),
                pending_works: pendingWorksInc + (existingPhysical.pending_works || 0),
                sanctioned_works: completedWorksInc + ongoingWorksInc + pendingWorksInc + (existingPhysical.completed_works || 0) + (existingPhysical.ongoing_works || 0) + (existingPhysical.pending_works || 0),
                updated_at: new Date().toISOString(),
              })
              .eq('village_name', village.village_name)
              .eq('work_category', data.work_category);
          } else {
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

          const sanctionedAmount = Number(data.admin_approval_amount) || 0;
          const releasedAmount = Number(data.agreement_approval_amount) || 0;
          const previousExpenditure = Number(data.previous_expenditure) || 0;
          const currentExpenditure = Number(data.current_expenditure) || 0;
          const cumulativeExpenditure = previousExpenditure + currentExpenditure;
          const remainingFunds = releasedAmount - cumulativeExpenditure;

          const financialData = {
            village_id: data.village_id,
            village_name: village.village_name,
            gram_panchayat: village.gram_panchayat,
            taluka: village.block,
            district: village.district,
            work_category: data.work_category,
            sanctioned_amount: sanctionedAmount,
            released_amount: releasedAmount,
            status: status,
            previous_expenditure: previousExpenditure,
            current_expenditure: currentExpenditure,
            cumulative_expenditure: cumulativeExpenditure,
            remaining_funds: remainingFunds,
            year: data.year || null,
            added_month: data.added_month || null,
            work_name: data.work_name,
            work_type: "financial",
            created_at: new Date().toISOString(),
          };

          await workService.insert(financialData);


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

          const talukaCompletedWorksInc = status === 'completed' ? 1 : 0;
          const talukaOngoingWorksInc = status === 'in_progress' ? 1 : 0;
          const talukaPendingWorksInc = status === 'pending' ? 1 : 0;

          if (existingTalukaPhysical) {
            await pesaSupabase
              .from('taluka_aarakhada_physical')
              .update({
                taluka_name: village.block,
                work_category: data.work_category,
                gram_panchayat: village.gram_panchayat,
                village_id: data.village_id,
                completed_works: talukaCompletedWorksInc + existingTalukaPhysical.completed_works,
                ongoing_works: talukaOngoingWorksInc + existingTalukaPhysical.ongoing_works,
                pending_works: talukaPendingWorksInc + existingTalukaPhysical.pending_works,
                sanctioned_works: talukaCompletedWorksInc + talukaOngoingWorksInc + talukaPendingWorksInc + existingTalukaPhysical.completed_works + existingTalukaPhysical.ongoing_works + existingTalukaPhysical.pending_works,
                year: data.year || null,
                updated_at: new Date().toISOString(),
              })
              .eq('work_category', data.work_category)
              .eq('gram_panchayat', village.gram_panchayat);
          } else {
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
              year: data.year || null,
            };
            await talukaWorkService.insert(talukaPhysicalData);
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
                year: data.year || null,
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
              year: data.year || null,
            };
            await talukaWorkService.insert(talukaFinancialData);
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

          const { data: existingDistrictPhysical, error: districtPhysicalFetchError } =
            await pesaSupabase
              .from('district_aarakhada_physical')
              .select('*')
              .eq('taluka_name', village.block)
              .eq('work_category', data.work_category)
              .limit(1)
              .maybeSingle();

          if (districtPhysicalFetchError && districtPhysicalFetchError.code !== 'PGRST116') {
            throw districtPhysicalFetchError;
          }

          const districtCompletedWorksInc = status === 'completed' ? 1 : 0;
          const districtOngoingWorksInc = status === 'in_progress' ? 1 : 0;
          const districtPendingWorksInc = status === 'pending' ? 1 : 0;

          if (existingDistrictPhysical) {
            await pesaSupabase
              .from('district_aarakhada_physical')
              .update({
                completed_works: districtCompletedWorksInc + existingDistrictPhysical.completed_works,
                ongoing_works: districtOngoingWorksInc + existingDistrictPhysical.ongoing_works,
                pending_works: districtPendingWorksInc + existingDistrictPhysical.pending_works,
                sanctioned_works: districtCompletedWorksInc + districtOngoingWorksInc + districtPendingWorksInc + existingDistrictPhysical.completed_works + existingDistrictPhysical.ongoing_works + existingDistrictPhysical.pending_works,
                pesa_gram_panchayat_count: pesaGramPanchayatCount,
                pesa_village_count: pesaVillageCountInTaluka,
                year: data.year || null,
                updated_at: new Date().toISOString(),
              })
              .eq('taluka_name', village.block)
              .eq('work_category', data.work_category);
          } else {
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
              year: data.year || null,
            };
            await districtWorkService.insert(districtPhysicalData);
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

            // ✅ Create work for District : district_aarakhada_physical table
            const { data: allVillagesInTaluka, error: allVillagesInTalukaError } = await pesaSupabase
              .from('villages')
              .select('id, gram_panchayat')
              .eq('block', village.block);
            if (allVillagesInTalukaError) throw allVillagesInTalukaError;

            const uniqueGramPanchayatsInTaluka = new Set(allVillagesInTaluka?.map(v => v.gram_panchayat) || []);
            const pesaGramPanchayatCount = uniqueGramPanchayatsInTaluka.size;
            // Calculate expenditure and remaining funds
            const calculatedCumulative = existingDistrictFinancial.cumulative_expenditure;
            const districtAnnualReceived = aggregatedDistrictFinancial.released_amount ?? existingDistrictFinancial.annual_received_fund ?? 0;
            const calculatedRemaining = districtAnnualReceived - calculatedCumulative;

            await pesaSupabase
              .from('district_aarakhada_financial')
              .update({
                annual_approved_fund: aggregatedDistrictFinancial.sanctioned_amount,
                annual_received_fund: aggregatedDistrictFinancial.released_amount,
                pesa_gram_panchayat_count: pesaGramPanchayatCount,
                previous_expenditure: data.previous_expenditure ?? existingDistrictFinancial.previous_expenditure ?? 0,
                current_expenditure: data.current_expenditure ?? existingDistrictFinancial.current_expenditure ?? 0,
                cumulative_expenditure: calculatedCumulative,
                remaining_funds: calculatedRemaining,
                pesa_village_count: pesaVillageCountInTaluka,
                year: data.year || null,
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

            // ✅ Create work for District : district_aarakhada_physical table
            const { data: allVillagesInTaluka, error: allVillagesInTalukaError } = await pesaSupabase
              .from('villages')
              .select('id, gram_panchayat')
              .eq('block', village.block);
            if (allVillagesInTalukaError) throw allVillagesInTalukaError;

            const uniqueGramPanchayatsInTaluka = new Set(allVillagesInTaluka?.map(v => v.gram_panchayat) || []);
            const pesaGramPanchayatCount = uniqueGramPanchayatsInTaluka.size;
            // Calculate expenditure and remaining funds
            const calculatedCumulative = (data.previous_expenditure || 0) + (data.current_expenditure || 0);
            const calculatedRemaining = aggregatedDistrictFinancial.released_amount - calculatedCumulative;

            const districtFinancialData = {
              district_name: village.district,
              taluka_name: village.block,
              village_id: data.village_id,
              pesa_village_count: pesaVillageCountInTaluka,
              pesa_gram_panchayat_count: pesaGramPanchayatCount,
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
              year: data.year || null,
              created_at: new Date().toISOString(),
            };

            await districtWorkService.insert(districtFinancialData);
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
      // Sync aarakhada_physical counts
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
        let completed = existingPhysical.completed_works || 0;
        let ongoing = existingPhysical.ongoing_works || 0;
        let pending = existingPhysical.pending_works || 0;

        const oldStatus = currentWork.current_status;
        const newStatus = work.current_status;

        if (oldStatus !== newStatus) {

          // subtract old bucket
          if (oldStatus === "completed") completed = Math.max(completed - 1, 0);
          if (oldStatus === "in_progress") ongoing = Math.max(ongoing - 1, 0);
          if (oldStatus === "pending") pending = Math.max(pending - 1, 0);

          // add new bucket
          if (newStatus === "completed") completed += 1;
          if (newStatus === "in_progress") ongoing += 1;
          if (newStatus === "pending") pending += 1;
        }

        // Only update the physical row that matches the previous added_month
        await pesaSupabase
          .from("aarakhada_physical")
          .update({
            work_category: currentWork.work_category,
            village_id: currentWork.village_id,
            gram_panchayat: currentWork.pesa_grampanchayat,
            status: newStatus,
            // if the month was changed in the work, update the physical row's month too
            added_month: work.added_month ?? currentWork.added_month,
            completed_works: completed,
            ongoing_works: ongoing,
            pending_works: pending,
            sanctioned_works: completed + ongoing + pending,
            updated_at: new Date().toISOString(),
          })
          .eq("village_id", currentWork.village_id)
          .eq("work_category", currentWork.work_category)
          .eq("added_month", currentWork.added_month);
      }

      // Sync taluka_aarakhada_physical
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
        let completed = existingTalukaPhysical.completed_works || 0;
        let ongoing = existingTalukaPhysical.ongoing_works || 0;
        let pending = existingTalukaPhysical.pending_works || 0;

        const oldStatus = currentWork.current_status;
        const newStatus = work.current_status;

        if (oldStatus !== newStatus) {

          if (oldStatus === "completed") completed = Math.max(completed - 1, 0);
          if (oldStatus === "in_progress") ongoing = Math.max(ongoing - 1, 0);
          if (oldStatus === "pending") pending = Math.max(pending - 1, 0);

          if (newStatus === "completed") completed += 1;
          if (newStatus === "in_progress") ongoing += 1;
          if (newStatus === "pending") pending += 1;
        }

        await pesaSupabase
          .from("taluka_aarakhada_physical")
          .update({
            work_category: currentWork.work_category,
            gram_panchayat: currentWork.pesa_grampanchayat,
            completed_works: completed,
            ongoing_works: ongoing,
            pending_works: pending,
            sanctioned_works: completed + ongoing + pending,
            updated_at: new Date().toISOString(),
          })
          .eq("taluka_name", currentWork.taluka)
          .eq("gram_panchayat", currentWork.pesa_grampanchayat)
          .eq("work_category", currentWork.work_category);
      }

      // Sync district_aarakhada_physical
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
        let completed = existingDistrictPhysical.completed_works || 0;
        let ongoing = existingDistrictPhysical.ongoing_works || 0;
        let pending = existingDistrictPhysical.pending_works || 0;

        const oldStatus = currentWork.current_status;
        const newStatus = work.current_status;

        if (oldStatus !== newStatus) {

          if (oldStatus === "completed") completed = Math.max(completed - 1, 0);
          if (oldStatus === "in_progress") ongoing = Math.max(ongoing - 1, 0);
          if (oldStatus === "pending") pending = Math.max(pending - 1, 0);

          if (newStatus === "completed") completed += 1;
          if (newStatus === "in_progress") ongoing += 1;
          if (newStatus === "pending") pending += 1;
        }

        await pesaSupabase
          .from("district_aarakhada_physical")
          .update({
            district_name: currentWork.district,
            taluka_name: currentWork.taluka,
            work_category: currentWork.work_category,
            completed_works: completed,
            ongoing_works: ongoing,
            pending_works: pending,
            sanctioned_works: completed + ongoing + pending,
            updated_at: new Date().toISOString(),
          })
          .eq("taluka_name", currentWork.taluka)
          .eq("work_category", currentWork.work_category);
      }

      const sanctionedAmount = Number(work.admin_approval_amount ?? currentWork.admin_approval_amount) || 0;
      const releasedAmount = Number(work.agreement_approval_amount ?? currentWork.agreement_approval_amount) || 0;

      // Try to find the financial row for the previous month only
      const { data: existingVillageFinancial, error: fetchVillageFinError } = await pesaSupabase
        .from("aarakhada_financial")
        .select("*")
        .eq("village_id", currentWork.village_id)
        .eq("work_category", currentWork.work_category)
        .eq("work_name", currentWork.work_name)
        .eq("added_month", currentWork.added_month)
        .maybeSingle();

      if (fetchVillageFinError && fetchVillageFinError.code !== "PGRST116") {
        throw fetchVillageFinError;
      }

      if (existingVillageFinancial) {
        const previousExpenditure = Number(
          work.previous_expenditure ?? existingVillageFinancial.previous_expenditure ?? 0
        );
        const currentExpenditure = Number(
          work.current_expenditure ?? existingVillageFinancial.current_expenditure ?? 0
        );

        const cumulativeExpenditure = previousExpenditure + currentExpenditure;
        const remainingFunds = releasedAmount - cumulativeExpenditure;

        // 🔹 1️⃣ Update ALL common financial fields
        await pesaSupabase
          .from("aarakhada_financial")
          .update({
            status: work.current_status ?? existingVillageFinancial.status,
            sanctioned_amount: sanctionedAmount,
            year: work.year ?? existingVillageFinancial.year,
            released_amount: releasedAmount,
            previous_expenditure: previousExpenditure,
            current_expenditure: currentExpenditure,
            cumulative_expenditure: cumulativeExpenditure,
            remaining_funds: remainingFunds,
            updated_at: new Date().toISOString(),
          })
          .eq("village_id", currentWork.village_id)
          .eq("work_category", currentWork.work_category);

        // 🔹 2️⃣ Update ONLY added_month (restricted by work_name + previous added_month)
        if (work.added_month && work.added_month !== currentWork.added_month) {
          await pesaSupabase
            .from("aarakhada_financial")
            .update({
              added_month: work.added_month,
              updated_at: new Date().toISOString(),
            })
            .eq("village_id", currentWork.village_id)
            .eq("work_category", currentWork.work_category)
            .eq("work_name", currentWork.work_name)
            .eq("added_month", currentWork.added_month);
        }

      } else {
        // 🟢 INSERT logic remains unchanged
        const { data: village, error: vError } = await pesaSupabase
          .from("villages")
          .select("*")
          .eq("id", currentWork.village_id)
          .single();

        if (vError) throw vError;

        const previousExpenditure = Number(work.previous_expenditure) || 0;
        const currentExpenditure = Number(work.current_expenditure) || 0;

        const cumulativeExpenditure = previousExpenditure + currentExpenditure;
        const remainingFunds = releasedAmount - cumulativeExpenditure;

        await pesaSupabase
          .from("aarakhada_financial")
          .insert({
            village_id: currentWork.village_id,
            village_name: village.village_name,
            gram_panchayat: village.gram_panchayat,
            taluka: village.block,
            district: village.district,
            status: work.current_status,
            work_category: currentWork.work_category,
            sanctioned_amount: sanctionedAmount,
            released_amount: releasedAmount,
            previous_expenditure: previousExpenditure,
            current_expenditure: currentExpenditure,
            cumulative_expenditure: cumulativeExpenditure,
            remaining_funds: remainingFunds,
            year: work.year || currentWork.year || null,
            added_month: work.added_month || currentWork.added_month || null,
            work_name: currentWork.work_name,
            work_type: "financial",
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

      // compute cumulative safely
      const calculatedTalukaCumulative =
        (existingTalukaFinancial?.previous_expenditure ?? 0) +
        (existingTalukaFinancial?.current_expenditure ?? 0);

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
            cumulative_expenditure:
              work.cumulative_expenditure ??
              (work.previous_expenditure || 0) + (work.current_expenditure || 0),
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

      // compute cumulative safely
      const calculatedDistrictCumulative =
        (existingDistrictFinancial?.previous_expenditure ?? 0) +
        (existingDistrictFinancial?.current_expenditure ?? 0);

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
            cumulative_expenditure:
              work.cumulative_expenditure ??
              (work.previous_expenditure || 0) + (work.current_expenditure || 0),
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
    debugger
    // Fetch the work to identify counts and related metadata
    const { data: workToDelete, error: fetchWorkError } = await pesaSupabase
      .from("works")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchWorkError) {
      console.error("Error fetching PESA work before delete:", fetchWorkError);
      throw fetchWorkError;
    }

    try {
      if (workToDelete) {
        const allowedStatuses = ["pending", "in_progress", "completed"];
        const status = allowedStatuses.includes(workToDelete.current_status) ? workToDelete.current_status : "pending";

        const completedDec = status === "completed" ? 1 : 0;
        const ongoingDec = status === "in_progress" ? 1 : 0;
        const pendingDec = status === "pending" ? 1 : 0;

        // Decrement counts in aarakhada_physical for the village and category
        const { data: existingPhysical, error: physicalFetchError } = await pesaSupabase
          .from("aarakhada_physical")
          .select("*")
          .eq("village_id", workToDelete.village_id)
          .eq("work_category", workToDelete.work_category)
          .single();

        if (physicalFetchError && physicalFetchError.code !== "PGRST116") {
          throw physicalFetchError;
        }

        if (existingPhysical) {
          const updatedCompleted = Math.max((existingPhysical.completed_works || 0) - completedDec, 0);
          const updatedOngoing = Math.max((existingPhysical.ongoing_works || 0) - ongoingDec, 0);
          const updatedPending = Math.max((existingPhysical.pending_works || 0) - pendingDec, 0);

          if (updatedCompleted === 0 && updatedOngoing === 0 && updatedPending === 0) {
            // Delete the row if all counts are zero
            await pesaSupabase
              .from("aarakhada_physical")
              .delete()
              .eq("village_id", workToDelete.village_id)
              .eq("work_category", workToDelete.work_category);

            // Delete corresponding financial row
            await pesaSupabase
              .from("aarakhada_financial")
              .delete()
              .eq("village_id", workToDelete.village_id)
              .eq("work_category", workToDelete.work_category);
          } else {
            await pesaSupabase
              .from("aarakhada_physical")
              .update({
                completed_works: updatedCompleted,
                ongoing_works: updatedOngoing,
                pending_works: updatedPending,
                sanctioned_works: updatedCompleted + updatedOngoing + updatedPending,
                updated_at: new Date().toISOString(),
              })
              .eq("village_id", workToDelete.village_id)
              .eq("work_category", workToDelete.work_category);
          }
        }

        // taluka_aarakhada_physical table decrement
        const { data: existingTalukaPhysical, error: talukaPhysicalError } = await pesaSupabase
          .from("taluka_aarakhada_physical")
          .select("*")
          .eq("taluka_name", workToDelete.taluka)
          .eq("gram_panchayat", workToDelete.pesa_grampanchayat)
          .eq("work_category", workToDelete.work_category)
          .single();

        if (talukaPhysicalError && talukaPhysicalError.code !== "PGRST116") {
          throw talukaPhysicalError;
        }

        if (existingTalukaPhysical) {
          const updatedCompleted = Math.max((existingTalukaPhysical.completed_works || 0) - completedDec, 0);
          const updatedOngoing = Math.max((existingTalukaPhysical.ongoing_works || 0) - ongoingDec, 0);
          const updatedPending = Math.max((existingTalukaPhysical.pending_works || 0) - pendingDec, 0);

          if (updatedCompleted === 0 && updatedOngoing === 0 && updatedPending === 0) {
            // Delete the row if all counts are zero
            await pesaSupabase
              .from("taluka_aarakhada_physical")
              .delete()
              .eq("taluka_name", workToDelete.taluka)
              .eq("gram_panchayat", workToDelete.pesa_grampanchayat)
              .eq("work_category", workToDelete.work_category);

            // Delete corresponding taluka financial row
            await pesaSupabase
              .from("taluka_aarakhada_financial")
              .delete()
              .eq("taluka_name", workToDelete.taluka)
              .eq("gram_panchayat", workToDelete.pesa_grampanchayat)
              .eq("work_category", workToDelete.work_category);
          } else {
            await pesaSupabase
              .from("taluka_aarakhada_physical")
              .update({
                completed_works: updatedCompleted,
                ongoing_works: updatedOngoing,
                pending_works: updatedPending,
                sanctioned_works: updatedCompleted + updatedOngoing + updatedPending,
                updated_at: new Date().toISOString(),
              })
              .eq("taluka_name", workToDelete.taluka)
              .eq("gram_panchayat", workToDelete.pesa_grampanchayat)
              .eq("work_category", workToDelete.work_category);
          }
        }

        // district_aarakhada_physical table decrement
        const { data: existingDistrictPhysical, error: districtPhysicalError } = await pesaSupabase
          .from("district_aarakhada_physical")
          .select("*")
          .eq("taluka_name", workToDelete.taluka)
          .eq("work_category", workToDelete.work_category)
          .single();

        if (districtPhysicalError && districtPhysicalError.code !== "PGRST116") {
          throw districtPhysicalError;
        }

        if (existingDistrictPhysical) {
          const updatedCompleted = Math.max((existingDistrictPhysical.completed_works || 0) - completedDec, 0);
          const updatedOngoing = Math.max((existingDistrictPhysical.ongoing_works || 0) - ongoingDec, 0);
          const updatedPending = Math.max((existingDistrictPhysical.pending_works || 0) - pendingDec, 0);

          if (updatedCompleted === 0 && updatedOngoing === 0 && updatedPending === 0) {
            // Delete the row if all counts are zero
            await pesaSupabase
              .from("district_aarakhada_physical")
              .delete()
              .eq("taluka_name", workToDelete.taluka)
              .eq("work_category", workToDelete.work_category);

            // Delete corresponding district financial row
            await pesaSupabase
              .from("district_aarakhada_financial")
              .delete()
              .eq("taluka_name", workToDelete.taluka)
              .eq("work_category", workToDelete.work_category);
          } else {
            await pesaSupabase
              .from("district_aarakhada_physical")
              .update({
                completed_works: updatedCompleted,
                ongoing_works: updatedOngoing,
                pending_works: updatedPending,
                sanctioned_works: updatedCompleted + updatedOngoing + updatedPending,
                updated_at: new Date().toISOString(),
              })
              .eq("taluka_name", workToDelete.taluka)
              .eq("work_category", workToDelete.work_category);
          }
        }

        // Financial updates (for remaining physical rows)
        const { data: existingAarakhadaFinancial, error: financialFetchError } = await pesaSupabase
          .from("aarakhada_financial")
          .select("*")
          .eq("village_id", workToDelete.village_id)
          .eq("work_category", workToDelete.work_category)
          .single();

        if (financialFetchError && financialFetchError.code !== "PGRST116") {
          throw financialFetchError;
        }

        if (existingAarakhadaFinancial) {
          const previousExpenditure = workToDelete.previous_expenditure || 0;
          const currentExpenditure = workToDelete.current_expenditure || 0;
          const cumulativeExpenditure = previousExpenditure + currentExpenditure;

          // Updated released_amount and remaining funds
          const updatedReleasedAmount = (existingAarakhadaFinancial.released_amount || 0) - (workToDelete.agreement_approval_amount || 0);
          const updatedRemainingFunds = updatedReleasedAmount - ((existingAarakhadaFinancial.cumulative_expenditure || 0) - cumulativeExpenditure);

          const updatedPreviousExpenditure = Math.max((existingAarakhadaFinancial.previous_expenditure || 0) - previousExpenditure, 0);
          const updatedCurrentExpenditure = Math.max((existingAarakhadaFinancial.current_expenditure || 0) - currentExpenditure, 0);
          const updatedCumulativeExpenditure = (existingAarakhadaFinancial.cumulative_expenditure || 0) - cumulativeExpenditure;

          await pesaSupabase
            .from("aarakhada_financial")
            .update({
              added_month: workToDelete.added_month,
              previous_expenditure: updatedPreviousExpenditure,
              current_expenditure: updatedCurrentExpenditure,
              cumulative_expenditure: updatedCumulativeExpenditure >= 0 ? updatedCumulativeExpenditure : 0,
              released_amount: updatedReleasedAmount >= 0 ? updatedReleasedAmount : 0,
              remaining_funds: updatedRemainingFunds >= 0 ? updatedRemainingFunds : 0,
              updated_at: new Date().toISOString(),
            })
            .eq("village_id", workToDelete.village_id)
            .eq("work_category", workToDelete.work_category);
        }

        // taluka_aarakhada_financial update
        const { data: existingTalukaFinancial, error: talukaFinancialError } = await pesaSupabase
          .from("taluka_aarakhada_financial")
          .select("*")
          .eq("taluka_name", workToDelete.taluka)
          .eq("gram_panchayat", workToDelete.pesa_grampanchayat)
          .eq("work_category", workToDelete.work_category)
          .single();

        if (talukaFinancialError && talukaFinancialError.code !== "PGRST116") {
          throw talukaFinancialError;
        }

        if (existingTalukaFinancial) {
          const previousExpenditure = workToDelete.previous_expenditure || 0;
          const currentExpenditure = workToDelete.current_expenditure || 0;

          const updatedAnnualReceivedFund = (existingTalukaFinancial.annual_received_fund || 0) - (workToDelete.agreement_approval_amount || 0);
          const updatedRemainingFunds = updatedAnnualReceivedFund - existingTalukaFinancial.cumulative_expenditure;

          const updatedPreviousExpenditure = Math.max((existingTalukaFinancial.previous_expenditure || 0) - previousExpenditure, 0);
          const updatedCurrentExpenditure = Math.max((existingTalukaFinancial.current_expenditure || 0) - currentExpenditure, 0);

          await pesaSupabase
            .from("taluka_aarakhada_financial")
            .update({
              previous_expenditure: updatedPreviousExpenditure,
              current_expenditure: updatedCurrentExpenditure,
              annual_received_fund: updatedAnnualReceivedFund >= 0 ? updatedAnnualReceivedFund : 0,
              remaining_funds: updatedRemainingFunds >= 0 ? updatedRemainingFunds : 0,
              updated_at: new Date().toISOString(),
            })
            .eq("taluka_name", workToDelete.taluka)
            .eq("gram_panchayat", workToDelete.pesa_grampanchayat)
            .eq("work_category", workToDelete.work_category);
        }

        // district_aarakhada_financial update
        const { data: existingDistrictFinancial, error: districtFinancialError } = await pesaSupabase
          .from("district_aarakhada_financial")
          .select("*")
          .eq("taluka_name", workToDelete.taluka)
          .eq("work_category", workToDelete.work_category)
          .single();

        if (districtFinancialError && districtFinancialError.code !== "PGRST116") {
          throw districtFinancialError;
        }

        if (existingDistrictFinancial) {
          const previousExpenditure = workToDelete.previous_expenditure || 0;
          const currentExpenditure = workToDelete.current_expenditure || 0;

          const updatedAnnualReceivedFund = (existingDistrictFinancial.annual_received_fund || 0) - (workToDelete.agreement_approval_amount || 0);
          const updatedRemainingFunds = updatedAnnualReceivedFund - existingDistrictFinancial.cumulative_expenditure;

          await pesaSupabase
            .from("district_aarakhada_financial")
            .update({
              annual_received_fund: updatedAnnualReceivedFund >= 0 ? updatedAnnualReceivedFund : 0,
              remaining_funds: updatedRemainingFunds >= 0 ? updatedRemainingFunds : 0,
              previous_expenditure: previousExpenditure >= 0 ? previousExpenditure : 0,
              current_expenditure: currentExpenditure >= 0 ? currentExpenditure : 0,
              updated_at: new Date().toISOString(),
            })
            .eq("taluka_name", workToDelete.taluka)
            .eq("work_category", workToDelete.work_category);
        }

        // Finally delete the work entry
        const { error: deleteError } = await pesaSupabase.from("works").delete().eq("id", id);

        if (deleteError) {
          console.error("Error deleting PESA work:", deleteError);
          throw deleteError;
        }
      }
    } catch (err) {
      console.error("Error during PESA work delete sync:", err);
      throw err;
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

    if (data && Array.isArray(data)) {
      for (const workflow of data) {
        if (workflow.status === 'completed' && workflow.work_id) {
          await pesaSupabase
            .from("aarakhada_financial")
            .update({ status: 'completed' })
            .eq("village_id", workflow.work.village_id)
            .eq("work_name", workflow.work.work_name);
        }
      }
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

  async updateWorkflow(id: string, updates: any) {
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
      console.error("Error updating PESA workflow:", error);
      throw error;
    }

    if (updates.status === "completed" && data?.work_id) {
      // fetch work including its previous current_status so we know what to decrement
      const { data: workRow, error: workError } = await pesaSupabase
        .from("works")
        .select("work_name, work_category, village_id, taluka, pesa_grampanchayat, current_status")
        .eq("id", data.work_id)
        .single();
      if (workError) {
        console.error("Error fetching work row:", workError);
        throw workError;
      }

      const previousWorkStatus = workRow?.current_status ?? null; // previous status of this work
      const newWorkStatus = "completed"; // workflow update sets this work to completed in this flow

      const { error: workStatusError } = await pesaSupabase
        .from("works")
        .update({ current_status: newWorkStatus })
        .eq("id", data.work_id);
      if (workStatusError) {
        console.error("Error updating work current_status:", workStatusError);
        throw workStatusError;
      }

      // Update aarakhada_financial status
      const { error: financialError } = await pesaSupabase
        .from("aarakhada_financial")
        .update({ status: "completed" })
        .eq("village_id", workRow.village_id);

      if (financialError) {
        console.error("Error updating aarakhada_financial status:", financialError);
        throw financialError;
      }

      // Normalizer: keep 'ongoing' and 'in_progress' aligned
      const normalize = (s: string | null) => {
        if (!s) return s;
        if (s === "ongoing") return "in_progress";
        return s;
      };

      const oldStatusNormalized = normalize(previousWorkStatus);
      const newStatusNormalized = normalize(newWorkStatus);

      // ---------------------------------------------------
      // 1) VILLAGE LEVEL — aarakhada_physical
      // ---------------------------------------------------
      const { data: existingPhysical, error: fetchPhysicalError } =
        await pesaSupabase
          .from("aarakhada_physical")
          .select("*")
          .eq("village_id", workRow.village_id)
          .eq("work_category", workRow.work_category)
          .single();

      if (fetchPhysicalError && fetchPhysicalError.code !== "PGRST116") {
        console.error("Error fetching aarakhada_physical:", fetchPhysicalError);
        throw fetchPhysicalError;
      }

      if (existingPhysical) {
        let completed = existingPhysical.completed_works || 0;
        let ongoing = existingPhysical.ongoing_works || 0;
        let pending = existingPhysical.pending_works || 0;

        // Subtract previous work status bucket
        if (oldStatusNormalized && oldStatusNormalized !== newStatusNormalized) {
          if (oldStatusNormalized === "completed") completed = Math.max(completed - 1, 0);
          if (oldStatusNormalized === "in_progress") ongoing = Math.max(ongoing - 1, 0);
          if (oldStatusNormalized === "pending") pending = Math.max(pending - 1, 0);
        }

        // Add to new work status bucket
        if (newStatusNormalized === "completed") completed += 1;
        if (newStatusNormalized === "in_progress") ongoing += 1;
        if (newStatusNormalized === "pending") pending += 1;

        const sanctioned = completed + ongoing + pending;

        const { error: physicalUpdateError } = await pesaSupabase
          .from("aarakhada_physical")
          .update({
            status: newWorkStatus,
            completed_works: completed,
            ongoing_works: ongoing,
            pending_works: pending,
            sanctioned_works: sanctioned,
            updated_at: new Date().toISOString(),
          })
          .eq("village_id", workRow.village_id)
          .eq("work_category", workRow.work_category);

        if (physicalUpdateError) {
          console.error("Error updating aarakhada_physical:", physicalUpdateError);
          throw physicalUpdateError;
        }
      }

      // ---------------------------------------------------
      // 2) TALUKA LEVEL — taluka_aarakhada_physical
      //    -> decrement previousWorkStatus bucket, increment newWorkStatus bucket
      // ---------------------------------------------------
      const { data: existingTaluka, error: talukaFetchError } = await pesaSupabase
        .from("taluka_aarakhada_physical")
        .select("*")
        .eq("taluka_name", workRow.taluka)
        .eq("gram_panchayat", workRow.pesa_grampanchayat)
        .eq("work_category", workRow.work_category)
        .single();

      if (talukaFetchError && talukaFetchError.code !== "PGRST116") {
        console.error("Error fetching taluka_aarakhada_physical:", talukaFetchError);
        throw talukaFetchError;
      }

      if (existingTaluka) {
        let completed = existingTaluka.completed_works || 0;
        let ongoing = existingTaluka.ongoing_works || 0;
        let pending = existingTaluka.pending_works || 0;

        // Subtract previous status bucket for taluka
        if (oldStatusNormalized && oldStatusNormalized !== newStatusNormalized) {
          if (oldStatusNormalized === "completed") completed = Math.max(completed - 1, 0);
          if (oldStatusNormalized === "in_progress") ongoing = Math.max(ongoing - 1, 0);
          if (oldStatusNormalized === "pending") pending = Math.max(pending - 1, 0);
        }

        // Add to new status bucket for taluka
        if (newStatusNormalized === "completed") completed += 1;
        if (newStatusNormalized === "in_progress") ongoing += 1;
        if (newStatusNormalized === "pending") pending += 1;

        const sanctioned = completed + ongoing + pending;

        const { error: talukaUpdateError } = await pesaSupabase
          .from("taluka_aarakhada_physical")
          .update({
            status: newWorkStatus,
            completed_works: completed,
            ongoing_works: ongoing,
            pending_works: pending,
            sanctioned_works: sanctioned,
            updated_at: new Date().toISOString(),
          })
          .eq("taluka_name", workRow.taluka)
          .eq("gram_panchayat", workRow.pesa_grampanchayat)
          .eq("work_category", workRow.work_category);

        if (talukaUpdateError) {
          console.error("Error updating taluka_aarakhada_physical:", talukaUpdateError);
          throw talukaUpdateError;
        }
      }

      // ---------------------------------------------------
      // 3) DISTRICT LEVEL — district_aarakhada_physical
      //    -> decrement previousWorkStatus bucket, increment newWorkStatus bucket
      // ---------------------------------------------------
      const { data: existingDistrict, error: districtFetchError } =
        await pesaSupabase
          .from("district_aarakhada_physical")
          .select("*")
          .eq("taluka_name", workRow.taluka)
          .eq("work_category", workRow.work_category)
          .single();

      if (districtFetchError && districtFetchError.code !== "PGRST116") {
        console.error("Error fetching district_aarakhada_physical:", districtFetchError);
        throw districtFetchError;
      }

      if (existingDistrict) {
        let completed = existingDistrict.completed_works || 0;
        let ongoing = existingDistrict.ongoing_works || 0;
        let pending = existingDistrict.pending_works || 0;

        // Subtract previous status bucket for district
        if (oldStatusNormalized && oldStatusNormalized !== newStatusNormalized) {
          if (oldStatusNormalized === "completed") completed = Math.max(completed - 1, 0);
          if (oldStatusNormalized === "in_progress") ongoing = Math.max(ongoing - 1, 0);
          if (oldStatusNormalized === "pending") pending = Math.max(pending - 1, 0);
        }

        // Add to new status bucket for district
        if (newStatusNormalized === "completed") completed += 1;
        if (newStatusNormalized === "in_progress") ongoing += 1;
        if (newStatusNormalized === "pending") pending += 1;

        const sanctioned = completed + ongoing + pending;

        const { error: districtUpdateError } = await pesaSupabase
          .from("district_aarakhada_physical")
          .update({
            completed_works: completed,
            ongoing_works: ongoing,
            pending_works: pending,
            sanctioned_works: sanctioned,
            updated_at: new Date().toISOString(),
          })
          .eq("taluka_name", workRow.taluka)
          .eq("work_category", workRow.work_category);

        if (districtUpdateError) {
          console.error("Error updating district_aarakhada_physical:", districtUpdateError);
          throw districtUpdateError;
        }
      }
    }

    return data;
  },

  async updateStep(id: string, updates: any) {
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
  },

  async deleteWorkflow(id: string) {
    const { error } = await pesaSupabase.from("workflows").delete().eq("id", id);
    if (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
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