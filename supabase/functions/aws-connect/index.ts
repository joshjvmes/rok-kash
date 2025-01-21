import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client } from "npm:@aws-sdk/client-s3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const s3Client = new S3Client({
      region: "us-east-1", // Replace with your desired region
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    // Test the connection
    const connectionTest = await s3Client.config.credentials();
    console.log("Successfully connected to AWS");

    return new Response(
      JSON.stringify({ 
        message: "Successfully connected to AWS",
        status: "success" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error connecting to AWS:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: "error" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});