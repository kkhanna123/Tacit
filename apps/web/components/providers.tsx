"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000, refetchOnWindowFocus: false } },
});

type ProjectCtx = {
  projectId: string;
  setProjectId: (id: string) => void;
};

const ProjectContext = createContext<ProjectCtx>({
  projectId: "proj_healthcare",
  setProjectId: () => {},
});

export function useProject() {
  return useContext(ProjectContext);
}

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: api.projects });
}

function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectId] = useState("proj_healthcare");
  useEffect(() => {
    const saved = localStorage.getItem("em_project");
    if (saved) setProjectId(saved);
  }, []);
  const set = (id: string) => {
    setProjectId(id);
    localStorage.setItem("em_project", id);
  };
  return (
    <ProjectContext.Provider value={{ projectId, setProjectId: set }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>{children}</ProjectProvider>
    </QueryClientProvider>
  );
}
