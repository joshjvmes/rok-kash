import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-rokcat-purple-darker flex items-center justify-center p-4 bg-gradient-to-br from-rokcat-purple-darker to-rokcat-gray">
      <Card className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg border border-rokcat-purple/20 shadow-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
          Trading Dashboard
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#9b87f5',
                  brandAccent: '#7E69AB',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#403E43',
                  defaultButtonBackgroundHover: '#4a484d',
                  inputBackground: 'rgba(255, 255, 255, 0.05)',
                  inputBorder: '#7E69AB',
                  inputBorderHover: '#9b87f5',
                  inputBorderFocus: '#9b87f5',
                }
              }
            },
            style: {
              button: {
                borderRadius: '8px',
                height: '42px',
                fontSize: '16px',
              },
              input: {
                borderRadius: '8px',
                height: '42px',
                fontSize: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
              },
              label: {
                color: '#D6BCFA',
                fontSize: '14px',
              },
            },
          }}
          providers={[]}
        />
      </Card>
    </div>
  );
}