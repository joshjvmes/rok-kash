import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-trading-gray-light flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-trading-gray">
        <h1 className="text-2xl font-bold mb-6 text-center">Trading Dashboard Login</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0ea5e9',
                  brandAccent: '#0284c7',
                }
              }
            }
          }}
          providers={[]}
        />
      </Card>
    </div>
  );
}