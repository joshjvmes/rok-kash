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
    <div className="min-h-screen bg-serenity-white flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-serenity-sky-light to-serenity-sky-dark">
      <Card className="w-full max-w-[320px] p-4 xs:p-5 sm:p-6 bg-white/90 backdrop-blur-lg border border-serenity-sky-dark/20 shadow-2xl">
        <h1 className="text-xl xs:text-2xl font-bold mb-4 sm:mb-6 text-center text-serenity-mountain tracking-wider uppercase">
          $ROK KASH
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#87CEEB',
                  brandAccent: '#4A6670',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#2F4F4F',
                  defaultButtonBackgroundHover: '#8FBC8F',
                  inputBackground: 'rgba(255, 255, 255, 0.9)',
                  inputBorder: '#87CEEB',
                  inputBorderHover: '#4A6670',
                  inputBorderFocus: '#4A6670',
                }
              }
            },
            style: {
              button: {
                borderRadius: '8px',
                height: '38px',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
              input: {
                borderRadius: '8px',
                height: '38px',
                fontSize: '13px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#4A6670',
              },
              label: {
                color: '#4A6670',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
              anchor: {
                fontSize: '11px',
                color: '#2F4F4F',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
            },
          }}
          providers={[]}
          view="sign_in"
        />
      </Card>
    </div>
  );
}