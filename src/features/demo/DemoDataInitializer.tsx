"use client";

import { useEffect } from "react";
import { scoreTask } from "@/features/tasks/scoring";
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
    // Repair only the exact old synthetic example, preserving user edits.
    const existingTasks = getTasks();
    const repaired = existingTasks.map((task) => {
      if (task.id !== "demo-task-delivery" || task.dataMaterials !== "Примеры статусов пока не предоставлены.") return task;
      const fields = { ...task, dataMaterials: "", constraints: `${task.constraints} Примеры статусов пока не предоставлены.`.trim() };
      const { score, readinessLevel } = scoreTask(fields);
      return { ...fields, score, readinessLevel };
    });
    if (repaired.some((task, i) => task !== existingTasks[i])) saveTasks(repaired);
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
