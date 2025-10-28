"use client";

import React from "react";
import { FileText, Eye } from "lucide-react";
import { useCallTool } from "@/app/hooks";

interface Project {
  id: string;
  name: string;
  urn: string;
}

interface ProjectListAppProps {
  projects: Project[];
  error?: string;
  accessToken: string;
}

export function ProjectListApp({ projects, error, accessToken }: ProjectListAppProps) {
  const callTool = useCallTool();

  const handleViewProject = async (project: Project) => {
    try {
      await callTool("view_project_model", {
        projectName: project.name,
        urn: project.urn,
        accessToken: accessToken,
      });
    } catch (error) {
      console.error("Failed to open viewer:", error);
    }
  };
  if (error) {
    return (
      <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
        <div className="max-w-full">
          <div className="flex flex-row items-center gap-4 sm:gap-4 border-b border-black/5 py-4">
            <div
              className="sm:w-18 w-16 aspect-square rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
            >
              <FileText className="w-8 h-8 text-gray-700" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-base sm:text-xl font-medium">
                Project Models
              </div>
              <div className="text-sm text-black/60">
                A list of your building information models
              </div>
            </div>
          </div>
          <div className="py-6 text-center text-red-600">
            <p className="font-medium">Error loading projects</p>
            <p className="text-sm mt-1 text-black/60">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full">
        <div className="flex flex-row items-center gap-4 sm:gap-4 border-b border-black/5 py-4">
          <div
            className="sm:w-18 w-16 aspect-square rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
          >
            <FileText className="w-8 h-8 text-gray-700" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-base sm:text-xl font-medium">
              Project Models
            </div>
            <div className="text-sm text-black/60">
              A list of your building information models
            </div>
          </div>
        </div>
        <div className="min-w-full text-sm flex flex-col">
          {projects.slice(0, 7).map((project, i) => (
            <div
              key={project.id}
              className="px-3 -mx-2 rounded-2xl hover:bg-black/5"
            >
              <div
                style={{
                  borderBottom:
                    i === 6 ? "none" : "1px solid rgba(0, 0, 0, 0.05)",
                }}
                className="flex w-full items-center hover:border-black/0! gap-2"
              >
                <div className="py-3 pr-3 min-w-0 w-full flex items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ring ring-black/5">
                      <FileText
                        className="w-5 h-5 text-gray-700"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="w-3 text-end sm:block hidden text-sm text-black/40">
                      {i + 1}
                    </div>
                    <div className="min-w-0 sm:pl-1 flex flex-col items-start h-full flex-1">
                      <div className="font-medium text-sm sm:text-md truncate max-w-full">
                        {project.name}
                      </div>
                      <div className="mt-1 sm:mt-0.25 flex items-center gap-3 text-black/70 text-xs">
                        <span className="text-black/50">Model file</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewProject(project)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="hidden sm:inline">View</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="py-6 text-center text-black/60">
              No projects found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

