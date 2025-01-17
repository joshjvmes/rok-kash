import { supabase } from "@/integrations/supabase/client";

export interface PackageDependency {
  id: string;
  package_name: string;
  current_version: string;
  required_by: string[];
  conflicts_with: Record<string, string>;
  resolution_strategy: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPackageDependencies() {
  const { data, error } = await supabase
    .from('package_dependencies')
    .select('*')
    .order('package_name');
    
  if (error) {
    console.error('Error fetching package dependencies:', error);
    throw error;
  }
  
  return data as PackageDependency[];
}

export async function addPackageDependency(dependency: Omit<PackageDependency, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('package_dependencies')
    .insert([dependency])
    .select()
    .single();
    
  if (error) {
    console.error('Error adding package dependency:', error);
    throw error;
  }
  
  return data as PackageDependency;
}

export async function updatePackageDependency(
  id: string,
  updates: Partial<Omit<PackageDependency, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('package_dependencies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating package dependency:', error);
    throw error;
  }
  
  return data as PackageDependency;
}