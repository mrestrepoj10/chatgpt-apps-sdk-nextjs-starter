import React from "react";
import { createClient } from "@/lib/supabase/server";
import { ProjectListApp } from "./ProjectListApp";

interface Project {
  id: string;
  name: string;
  urn: string;
}

async function fetchProjects(): Promise<{
  projects: Project[];
  error?: string;
  accessToken?: string;
}> {
  try {
    // Get the actual Supabase session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        projects: [],
        error: "Not authenticated. Please log in.",
      };
    }

    // Send the access token as Bearer token
    const response = await fetch("https://frame-git-dev-appsdk-mrestrepoj10s-projects.vercel.app/api/aps/model-names", {
      cache: "no-store",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return {
        projects: [],
        error: `Failed to fetch projects (${response.status})`,
      };
    }

    const data = await response.json();
    console.log(data);
    return {
      projects: Array.isArray(data) ? data : [],
      accessToken: session.access_token,
    };
  } catch (error) {
    return {
      projects: [],
      error: error instanceof Error ? error.message : "Failed to connect to API",
    };
  }
}

export default async function ProjectListPage() {
  const { projects, error, accessToken } = await fetchProjects();

  return (
    <ProjectListApp
      projects={projects}
      error={error}
      accessToken={accessToken || ""}
    />
  );
}

