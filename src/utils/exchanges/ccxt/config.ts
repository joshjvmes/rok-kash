import { supabase } from "@/integrations/supabase/client";

export async function makeRequest(exchange: string, method: string, params: any = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, ...params, method }
    });

    if (error) {
      console.error(`Error in CCXT request for ${exchange}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in CCXT request for ${exchange}:`, error);
    throw error;
  }
}