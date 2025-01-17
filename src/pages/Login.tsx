import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export default function Login() {
  const navigate = useNavigate();
  const [displayedTitle, setDisplayedTitle] = useState("");
  const title = "$ROK KASH";

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  useEffect(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= title.length) {
        setDisplayedTitle(title.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 150);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-trading-gray">
      <Card className="w-full max-w-[320px] p-4 xs:p-5 sm:p-6 bg-white/90 backdrop-blur-lg border border-serenity-sky-dark/20 shadow-2xl">
        <h1 
          className="text-xl xs:text-2xl font-bold mb-4 sm:mb-6 text-center text-serenity-mountain tracking-wider uppercase transition-all duration-300 hover:text-shadow-glow cursor-default"
          style={{
            textShadow: 'none',
            transition: 'text-shadow 0.3s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textShadow = '0 0 10px rgba(135, 206, 235, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textShadow = 'none';
          }}
        >
          {displayedTitle || '\u00A0'}
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