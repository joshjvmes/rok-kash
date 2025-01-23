import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PROJECT_ID = SUPABASE_URL.match(/https:\/\/(.*?)\.supabase/)?.[1] || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function handleFunctionsList() {
  console.log("Fetching functions list");
  try {
    const { data, error } = await supabase
      .from('_functions')
      .select('*');

    if (error) throw error;
    console.log("Functions list response:", data);
    return data;
  } catch (error) {
    console.error("Error in handleFunctionsList:", error);
    throw error;
  }
}

async function handleFunctionLogs(functionName: string) {
  console.log(`Fetching logs for function: ${functionName}`);
  try {
    const { data, error } = await supabase
      .from('_functions_logs')
      .select('*')
      .eq('function_name', functionName)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    console.log("Function logs response:", data);
    return data;
  } catch (error) {
    console.error("Error in handleFunctionLogs:", error);
    throw error;
  }
}

async function handleIpRanges() {
  console.log("Fetching Supabase IP ranges");
  try {
    const response = await fetch('https://api.supabase.com/v1/network-restrictions/ip-ranges', {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch IP ranges: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("IP ranges response:", data);
    return data;
  } catch (error) {
    console.error("Error in handleIpRanges:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command } = await req.json();
    console.log(`Executing command: ${command}`);

    if (!command || typeof command !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    const parts = command.trim().split(' ');
    
    if (parts[0] !== 'supabase') {
      throw new Error('Command must start with "supabase"');
    }

    let result;

    switch(parts[1]) {
      case 'functions':
        switch(parts[2]) {
          case 'list':
            result = await handleFunctionsList();
            break;
          case 'logs':
            if (!parts[3]) {
              throw new Error('Function name is required for logs');
            }
            result = await handleFunctionLogs(parts[3]);
            break;
          default:
            throw new Error(`Unsupported functions command: ${parts[2]}`);
        }
        break;
      case 'ip-ranges':
        result = await handleIpRanges();
        break;
      default:
        throw new Error(`Unsupported command: ${parts[1]}`);
    }

    return new Response(
      JSON.stringify({ output: result }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error executing command:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        output: `Error: ${error.message}`
      }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});