"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

interface AuthorizationDetails {
  id: string;
  client: {
    name: string;
    description: string;
  };
  scopes: string[];
  user_id: string;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "profile:read": "View your profile information (name, email)",
  "app:access": "Access and interact with the application",
  "tasks:read": "Read your tasks and projects",
  "tasks:write": "Create and update your tasks",
};

export default function ConsentPage() {
  const [authDetails, setAuthDetails] = useState<AuthorizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadAuthorizationDetails = async () => {
      try {
        const authorizationId = searchParams.get("authorization_id");

        if (!authorizationId) {
          setError("Missing authorization ID");
          setLoading(false);
          return;
        }

        const supabase = createClient();

        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          // Redirect to login with authorization_id preserved
          router.push(`/auth/login?authorization_id=${authorizationId}`);
          return;
        }

        // Fetch authorization details
        // In production, this would call your authorization API
        // For now, we'll use mock data
        const mockDetails: AuthorizationDetails = {
          id: authorizationId,
          client: {
            name: "ChatGPT App",
            description: "Access your data through ChatGPT",
          },
          scopes: ["profile:read", "app:access"],
          user_id: session.user.id,
        };

        setAuthDetails(mockDetails);
        setLoading(false);
      } catch (err) {
        console.error("Error loading authorization:", err);
        setError("Failed to load authorization details");
        setLoading(false);
      }
    };

    loadAuthorizationDetails();
  }, [searchParams, router]);

  const handleConsent = async (approved: boolean) => {
    if (!authDetails) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Session expired. Please log in again.");
        setSubmitting(false);
        return;
      }

      if (approved) {
        // Store consent approval
        const { error: consentError } = await supabase
          .from("oauth_consents")
          .insert({
            authorization_id: authDetails.id,
            user_id: session.user.id,
            approved: true,
            scopes: authDetails.scopes,
            approved_at: new Date().toISOString(),
          });

        if (consentError && consentError.code !== "42P01") {
          // Ignore table not found error (42P01) for now
          console.warn("Consent storage error:", consentError);
        }

        // Redirect to callback with success
        router.push(`/auth/callback?code=${authDetails.id}&state=success`);
      } else {
        // User denied consent
        router.push(`/auth/login?error=access_denied`);
      }
    } catch (err) {
      console.error("Error submitting consent:", err);
      setError("Failed to process your response");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Loading authorization...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !authDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-red-500 mb-4"
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
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Authorization Error
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error || "Invalid authorization request"}
              </p>
              <a
                href="/auth/login"
                className="inline-block text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Back to login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Authorize {authDetails.client.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {authDetails.client.description}
            </p>
          </div>

          <div className="mb-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                This application is requesting permission to:
              </h3>
              <ul className="space-y-2">
                {authDetails.scopes.map((scope) => (
                  <li key={scope} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {scope}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {SCOPE_DESCRIPTIONS[scope] || "Access to application features"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => handleConsent(false)}
              disabled={submitting}
              className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-100 text-slate-900 dark:text-slate-100 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Deny
            </button>
            <button
              onClick={() => handleConsent(true)}
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {submitting ? "Processing..." : "Allow"}
            </button>
          </div>

          <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-500">
            By clicking "Allow", you authorize this application to access your data as
            described above.
          </p>
        </div>
      </div>
    </div>
  );
}

