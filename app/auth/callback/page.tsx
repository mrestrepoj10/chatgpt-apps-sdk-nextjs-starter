"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Get the code and error from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");
        const errorDescription = params.get("error_description");

        if (error) {
          setStatus("error");
          setErrorMessage(errorDescription || error);
          return;
        }

        if (!code) {
          setStatus("error");
          setErrorMessage("No authorization code received");
          return;
        }

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setStatus("error");
          setErrorMessage(exchangeError.message);
          return;
        }

        if (!data.session) {
          setStatus("error");
          setErrorMessage("Failed to create session");
          return;
        }

        setStatus("success");

        // Redirect to home page after brief delay
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } catch (err) {
        console.error("Callback error:", err);
        setStatus("error");
        setErrorMessage("An unexpected error occurred");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8">
          <div className="text-center">
            {status === "loading" && (
              <>
                <div className="mb-4">
                  <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Completing sign in...
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Please wait while we set up your session
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Success!
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Redirecting you to the app...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Authentication failed
                </h2>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  {errorMessage}
                </p>
                <a
                  href="/auth/login"
                  className="inline-block text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Try again
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

