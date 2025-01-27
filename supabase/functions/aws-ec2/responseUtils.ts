export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    },
  );
};

export const createErrorResponse = (error: Error) => {
  return new Response(
    JSON.stringify({
      error: error.message,
      details: error.stack,
    }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    },
  );
};