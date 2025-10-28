"use client";

import { useWidgetProps } from "@/app/hooks";
import { AutodeskViewerWrapper } from "../project-list/AutodeskViewerWrapper";

interface ProjectViewerWidgetProps extends Record<string, unknown> {
  result?: {
    structuredContent?: {
      projectName?: string;
      urn?: string;
      accessToken?: string;
    };
  };
}

export default function ProjectViewerPage() {
  const toolOutput = useWidgetProps<ProjectViewerWidgetProps>();
  
  const projectName = toolOutput?.result?.structuredContent?.projectName;
  const urn = toolOutput?.result?.structuredContent?.urn;
  const accessToken = toolOutput?.result?.structuredContent?.accessToken;

  if (!projectName || !urn || !accessToken) {
    return (
      <div className="antialiased w-full text-black px-4 py-6 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
        <div className="text-center">
          <p className="font-medium text-red-600">Missing project information</p>
          <p className="text-sm mt-1 text-black/60">
            Unable to load viewer without project details
          </p>
        </div>
      </div>
    );
  }

  // No back button needed - ChatGPT handles navigation
  return (
    <div className="w-full">
      <AutodeskViewerWrapper
        urn={urn}
        projectName={projectName}
        onBack={() => {}} // No-op since ChatGPT handles navigation
        accessToken={accessToken}
      />
    </div>
  );
}

