import { supabase } from "@/integrations/supabase/client";

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .limit(1);
    
    // If no error, table exists
    return !error;
  } catch (error: any) {
    // If error contains "does not exist", table doesn't exist
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return false;
    }
    // For other errors, assume table exists but there's a different issue
    return true;
  }
}

export async function createDutiesTable(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('create_duties_table');
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Failed to create duties table" 
    };
  }
}

export async function setupRequiredTables(): Promise<{
  success: boolean;
  results: Array<{ table: string; exists: boolean; created?: boolean; error?: string }>;
}> {
  const requiredTables = ['personnel', 'cases', 'duties', 'profiles'];
  const results = [];

  for (const tableName of requiredTables) {
    try {
      const exists = await checkTableExists(tableName);
      
      if (exists) {
        results.push({ table: tableName, exists: true });
      } else {
        // Table doesn't exist, try to create it
        console.log(`Table ${tableName} does not exist, attempting to create...`);
        
        if (tableName === 'duties') {
          // For duties table, we can create it programmatically
          const createResult = await createDutiesTable();
          results.push({ 
            table: tableName, 
            exists: false, 
            created: createResult.success,
            error: createResult.error 
          });
        } else {
          // For other tables, just report they don't exist
          results.push({ 
            table: tableName, 
            exists: false, 
            error: `Table ${tableName} does not exist. Please run the database setup script.` 
          });
        }
      }
    } catch (error: any) {
      results.push({ 
        table: tableName, 
        exists: false, 
        error: error.message || `Failed to check ${tableName} table` 
      });
    }
  }

  const allTablesReady = results.every(r => r.exists || r.created);
  
  return {
    success: allTablesReady,
    results
  };
}

// SQL function to create duties table (this would need to be created in Supabase)
export const CREATE_DUTIES_TABLE_SQL = `
CREATE OR REPLACE FUNCTION create_duties_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create duties table if it doesn't exist
  CREATE TABLE IF NOT EXISTS duties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE,
    duty_type TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('scheduled', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create index for better performance
  CREATE INDEX IF NOT EXISTS idx_duties_personnel_id ON duties(personnel_id);
  CREATE INDEX IF NOT EXISTS idx_duties_status ON duties(status);
  CREATE INDEX IF NOT EXISTS idx_duties_start_time ON duties(start_time);

  -- Enable RLS
  ALTER TABLE duties ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies
  CREATE POLICY IF NOT EXISTS "Authenticated users can view duties" 
    ON duties FOR SELECT TO authenticated USING (true);
  CREATE POLICY IF NOT EXISTS "Authenticated users can insert duties" 
    ON duties FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "Authenticated users can update duties" 
    ON duties FOR UPDATE TO authenticated USING (true);
  CREATE POLICY IF NOT EXISTS "Authenticated users can delete duties" 
    ON duties FOR DELETE TO authenticated USING (true);

  -- Add comment
  COMMENT ON TABLE duties IS 'Duty assignments and scheduling';
END;
$$;
`;

export async function createDutiesTableFunction(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql: CREATE_DUTIES_TABLE_SQL 
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Failed to create duties table function" 
    };
  }
}

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check if required tables exist
    const tableCheck = await setupRequiredTables();
    
    if (!tableCheck.success) {
      const missingTables = tableCheck.results
        .filter(r => !r.exists && !r.created)
        .map(r => r.table);
      
      if (missingTables.length > 0) {
        issues.push(`Missing tables: ${missingTables.join(', ')}`);
        recommendations.push("Run the database setup script in Supabase SQL Editor");
        recommendations.push("Check the scripts/setup-database.sql file for the complete setup");
      }
    }

    // Check if storage buckets exist (basic check)
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const requiredBuckets = ['user-profiles', 'personnel-photos'];
      const missingBuckets = requiredBuckets.filter(
        bucket => !buckets?.some(b => b.id === bucket)
      );
      
      if (missingBuckets.length > 0) {
        issues.push(`Missing storage buckets: ${missingBuckets.join(', ')}`);
        recommendations.push("Use the 'Setup Storage Buckets' button in Settings");
      }
    } catch (error) {
      issues.push("Cannot access storage buckets");
      recommendations.push("Check Supabase storage configuration");
    }

  } catch (error: any) {
    issues.push(`Database health check failed: ${error.message}`);
    recommendations.push("Check Supabase connection and credentials");
  }

  return {
    healthy: issues.length === 0,
    issues,
    recommendations
  };
}
