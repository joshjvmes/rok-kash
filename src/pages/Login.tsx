import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export default function Login() {
  const navigate = useNavigate();
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [titleAnimationComplete, setTitleAnimationComplete] = useState(false);
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
    const typingDelay = 150; // Delay between each character
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= title.length) {
        setDisplayedTitle(title.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setTitleAnimationComplete(true);
          setTimeout(() => {
            setShowForm(true);
          }, 500); // Delay before showing form
        }, 300); // Delay before moving title up
      }
    }, typingDelay);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-serenity-white">
      <Card className="w-full max-w-[320px] p-4 xs:p-5 sm:p-6 bg-white/90 backdrop-blur-lg border border-serenity-sky-dark/20 shadow-2xl relative">
        <h1 
          className={`text-xl xs:text-2xl font-bold mb-4 sm:mb-6 text-center text-serenity-mountain tracking-wider uppercase transition-all duration-500 ${
            titleAnimationComplete ? 'transform -translate-y-2' : ''
          }`}
          style={{
            textShadow: 'none',
            transition: 'all 0.5s ease-in-out',
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
        <div 
          className={`transition-opacity duration-500 ${
            showForm ? 'opacity-100' : 'opacity-0'
          }`}
        >
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
                  WebkitTextFillColor: '#4A6670',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
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
              className: {
                input: 'autofill-fix',
              },
            }}
            providers={[]}
            view="sign_in"
          />
        </div>
      </Card>
      <style>{`
        .autofill-fix:-webkit-autofill,
        .autofill-fix:-webkit-autofill:hover,
        .autofill-fix:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.9) inset;
          -webkit-text-fill-color: #4A6670;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}