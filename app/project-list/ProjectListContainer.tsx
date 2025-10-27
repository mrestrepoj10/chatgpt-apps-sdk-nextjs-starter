"use client";

import { useState } from "react";
import { ProjectListApp } from "./ProjectListApp";
import { AutodeskViewerWrapper } from "./AutodeskViewerWrapper";

interface Project {
  id: string;
  name: string;
  urn: string;
}

interface ProjectListContainerProps {
  projects: Project[];
  error?: string;
  accessToken: string;
}

export function ProjectListContainer({
  projects,
  error,
  accessToken,
}: ProjectListContainerProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBack = () => {
    setSelectedProject(null);
  };

  if (selectedProject) {
    return (
      <AutodeskViewerWrapper
        urn={selectedProject.urn}
        projectName={selectedProject.name}
        onBack={handleBack}
        accessToken={accessToken}
      />
    );
  }

  return (
    <ProjectListApp
      projects={projects}
      error={error}
      onViewProject={handleViewProject}
    />
  );
}

