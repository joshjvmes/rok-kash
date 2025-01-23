import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PROJECT_ID = SUPABASE_URL.match(/https:\/\/(.*?)\.supabase/)?.[1] || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function handleFunctionsList() {
  console.log("Fetching functions list");
  console.log("Using Project ID:", PROJECT_ID);
  
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/functions`,
    {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Functions list error:", errorText);
    throw new Error(`Failed to fetch functions: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log("Functions list response:", data);
  return data;
}

async function handleFunctionLogs(functionName: string) {
  console.log(`Fetching logs for function: ${functionName}`);
  console.log("Using Project ID:", PROJECT_ID);
  
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/functions/${functionName}/logs`,
    {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Function logs error:", errorText);
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log("Function logs response:", data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command } = await req.json();
    console.log(`Executing command: ${command}`);

    // Validate command format
    if (!command || typeof command !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    // Parse the command
    const parts = command.trim().split(' ');
    
    // Validate it starts with 'supabase'
    if (parts[0] !== 'supabase') {
      throw new Error('Command must start with "supabase"');
    }

    let result;

    // Handle different commands
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