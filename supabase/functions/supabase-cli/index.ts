import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PROJECT_ID = SUPABASE_URL.match(/https:\/\/(.*?)\.supabase/)?.[1] || "";

async function handleFunctionsList() {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/functions`,
    {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch functions: ${response.statusText}`);
  }
  
  return await response.json();
}

async function handleFunctionLogs(functionName: string) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/functions/${functionName}/logs`,
    {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }
  
  return await response.json();
}

serve(async (req) => {
  try {
    const { command } = await req.json();
    let result;

    // Parse the command
    const parts = command.split(' ');
    if (parts[0] !== 'supabase') {
      throw new Error('Only supabase commands are supported');
    }

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
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        output: `Error: ${error.message}`
      }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
});