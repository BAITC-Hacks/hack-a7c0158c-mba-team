"use client";

import { useEffect } from "react";
import { demoProposals, demoTasks, demoTeams } from "@/lib/demo-data";
import {
  getProposals,
  getTasks,
  getTeams,
  hasDemoSeed,
  markDemoSeeded,
  saveProposals,
  saveTasks,
  saveTeams,
} from "@/lib/storage";

export function DemoDataInitializer() {
  useEffect(() => {
    if (hasDemoSeed()) return;

    const tasks = getTasks();
    const teams = getTeams();
    const proposals = getProposals();

    saveTasks([...tasks, ...demoTasks.filter((item) => !tasks.some((current) => current.id === item.id))]);
    saveTeams([...teams, ...demoTeams.filter((item) => !teams.some((current) => current.id === item.id))]);
    saveProposals([...proposals, ...demoProposals.filter((item) => !proposals.some((current) => current.id === item.id))]);
    markDemoSeeded();
  }, []);

  return null;
}
