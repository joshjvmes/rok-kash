export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
};

export const createErrorResponse = (error: Error) => {
  console.error('Error in AWS EC2 function:', error);
  return new Response(
    JSON.stringify({ 
      error: error.message,
      status: "error",
      stack: error.stack,
      details: 'Check the function logs for more information'
    }),
    { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};