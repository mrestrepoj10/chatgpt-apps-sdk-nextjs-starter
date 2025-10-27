"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";

interface ApsCredentials {
  access_token: string;
  expires_in: number;
}

interface AutodeskViewerWrapperProps {
  urn: string;
  projectName: string;
  onBack: () => void;
  accessToken: string;
}

type LoadStatus = "idle" | "loading" | "ready" | "error" | "fetchingCredentials";

const VIEWER_SCRIPT_URL =
  "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js";
const VIEWER_STYLE_URL =
  "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css";

let viewerResourcesPromise: Promise<void> | null = null;

function ensureViewerResources(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Autodesk Viewer requires a browser environment."));
  }

  if ((window as any).Autodesk?.Viewing && viewerResourcesPromise) {
    return viewerResourcesPromise;
  }

  if (viewerResourcesPromise) {
    return viewerResourcesPromise;
  }

  viewerResourcesPromise = new Promise<void>((resolve, reject) => {
    const handleReject = (reason: unknown) => {
      viewerResourcesPromise = null;
      reject(
        reason instanceof Error
          ? reason
          : new Error(String(reason ?? "Failed to load Autodesk Viewer resources."))
      );
    };

    const ensureStyle = () =>
      new Promise<void>((styleResolve) => {
        const existing = document.querySelector<HTMLLinkElement>(
          'link[data-autodesk-viewer="style"]'
        );
        if (existing) {
          styleResolve();
          return;
        }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = VIEWER_STYLE_URL;
        link.setAttribute("data-autodesk-viewer", "style");
        link.onload = () => styleResolve();
        link.onerror = () => styleResolve();
        document.head.appendChild(link);
      });

    const ensureScript = () =>
      new Promise<void>((scriptResolve, scriptReject) => {
        if ((window as any).Autodesk?.Viewing) {
          scriptResolve();
          return;
        }

        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-autodesk-viewer="script"]'
        );
        if (existing) {
          existing.addEventListener("load", () => scriptResolve(), { once: true });
          existing.addEventListener(
            "error",
            () =>
              scriptReject(new Error("Failed to load Autodesk Viewer script (existing tag error).")),
            { once: true }
          );
          return;
        }

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = VIEWER_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        script.setAttribute("data-autodesk-viewer", "script");
        script.onload = () => scriptResolve();
        script.onerror = () =>
          scriptReject(new Error("Failed to load Autodesk Viewer script from CDN."));
        document.head.appendChild(script);
      });

    Promise.all([ensureStyle(), ensureScript()])
      .then(() => resolve())
      .catch(handleReject);
  });

  return viewerResourcesPromise;
}

function getStatusMessage(status: LoadStatus): string {
  switch (status) {
    case "fetchingCredentials":
      return "Fetching credentials...";
    case "loading":
      return "Loading Autodesk Viewer...";
    case "error":
      return "Failed to load viewer";
    default:
      return "";
  }
}

function StatusOverlay({
  status,
  error,
}: {
  status: LoadStatus;
  error: string | null;
}) {
  if (status === "ready" || status === "idle") {
    return null;
  }

  const message = getStatusMessage(status);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-6 text-center text-sm text-white">
      <div>
        <p className="font-medium">{message}</p>
        {error && (
          <p className="mt-2 text-xs text-white/80">{error}</p>
        )}
      </div>
    </div>
  );
}

export function AutodeskViewerWrapper({
  urn,
  projectName,
  onBack,
  accessToken,
}: AutodeskViewerWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [apsToken, setApsToken] = useState<string | null>(null);

  // Fetch APS credentials
  useEffect(() => {
    let disposed = false;

    async function fetchCredentials() {
      setStatus("fetchingCredentials");
      setError(null);

      try {
        const response = await fetch(`http://localhost:4321/api/auth/aps-token?urn=${encodeURIComponent(urn)}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch credentials (${response.status})`);
        }

        const data: ApsCredentials = await response.json();
        
        if (disposed) return;

        setApsToken(data.access_token);
        setStatus("idle");
      } catch (err) {
        if (disposed) return;
        const failure = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to fetch APS credentials:", failure);
        setError(failure.message);
        setStatus("error");
      }
    }

    fetchCredentials();

    return () => {
      disposed = true;
    };
  }, [accessToken, urn]);

  // Initialize viewer once we have credentials
  useEffect(() => {
    if (!apsToken || !urn) return;

    let disposed = false;

    async function initViewer() {
      setStatus("loading");
      setError(null);

      try {
        await ensureViewerResources();
        if (disposed) return;

        const Autodesk = (window as any).Autodesk;
        if (!Autodesk?.Viewing) {
          throw new Error("Autodesk Viewer runtime is unavailable after loading resources.");
        }

        // Initialize Autodesk Viewer
        await new Promise<void>((resolve, reject) => {
          Autodesk.Viewing.Initializer(
            {
              env: "AutodeskProduction",
              api: "derivativeV2",
              getAccessToken: (onGetAccessToken: (token: string, expire: number) => void) => {
                onGetAccessToken(apsToken!, 60 * 30); // 30 minutes in seconds
              },
            },
            () => {
              // Explicitly configure the viewer endpoint
              if (Autodesk.Viewing.endpoint?.setApiEndpoint) {
                Autodesk.Viewing.endpoint.setApiEndpoint("https://developer.api.autodesk.com");
              }
              resolve();
            }
          );
        });

        if (disposed) return;

        if (!containerRef.current) {
          throw new Error("Viewer container is not ready.");
        }

        if (viewerRef.current) {
          try {
            viewerRef.current.finish();
          } catch {
            // ignore cleanup errors
          }
          viewerRef.current = null;
          containerRef.current.innerHTML = "";
        }

        const viewer = new Autodesk.Viewing.GuiViewer3D(containerRef.current);
        viewerRef.current = viewer;

        const startCode = viewer.start();
        if (startCode !== 0) {
          throw new Error(`Failed to start Autodesk Viewer (code ${startCode}).`);
        }

        // Ensure URN has proper "urn:" prefix for Document.load
        const documentId = urn.startsWith('urn:') ? urn : `urn:${urn}`;
        
        Autodesk.Viewing.Document.load(
          documentId,
          async (doc: any) => {
            try {
              if (disposed || !viewerRef.current) return;

              const defaultModel = doc.getRoot().getDefaultGeometry();
              if (!defaultModel) {
                throw new Error("The URN does not contain any viewable geometry.");
              }

              await viewerRef.current.loadDocumentNode(doc, defaultModel);
              if (disposed) return;

              // Set dark theme
              if (Autodesk.Viewing.themes?.DARK) {
                viewerRef.current.setTheme(Autodesk.Viewing.themes.DARK);
              }

              setStatus("ready");
            } catch (innerError) {
              if (disposed) return;
              const failure =
                innerError instanceof Error
                  ? innerError
                  : new Error(String(innerError));
              console.error("Failed to load Autodesk document node:", failure);
              setError(failure.message);
              setStatus("error");
            }
          },
          (code: number, message: string) => {
            if (disposed) return;
            const failureMessage = message
              ? `${message} (code ${code})`
              : `Document load failed with code ${code}.`;
            console.error("Autodesk document load failed:", failureMessage);
            setError(failureMessage);
            setStatus("error");
          }
        );
      } catch (err) {
        if (disposed) return;
        const failure =
          err instanceof Error ? err : new Error(String(err ?? "Unknown viewer error"));
        console.error("Autodesk Viewer initialization error:", failure);
        setError(failure.message);
        setStatus("error");
      }
    }

    initViewer();

    return () => {
      disposed = true;
      if (viewerRef.current) {
        try {
          viewerRef.current.finish();
        } catch {
          // ignore cleanup errors
        }
        viewerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [apsToken, urn]);

  return (
    <div className="antialiased w-full text-black">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-black/10 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          <span className="text-sm font-medium">Back to List</span>
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold truncate">{projectName}</h2>
        </div>
      </div>

      {/* Viewer container */}
      <div className="relative w-full bg-[#181a1f] rounded-2xl overflow-hidden border border-black/10" style={{ height: "600px" }}>
        <div ref={containerRef} className="absolute inset-0" />
        <StatusOverlay status={status} error={error} />
      </div>
    </div>
  );
}

