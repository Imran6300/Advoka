import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Case, type ICase } from "@/lib/db/models/Case";
import type { IUser } from "@/lib/db/models/User";

export interface CreateCaseInput {
  title: string;
  caseType: string;
  clientName: string;
  opposingParty?: string;
  importantDate?: string | null;
}

/**
 * Every function here takes the resolved `owner` (from getOwner()) rather
 * than a raw id, and every query is scoped to `ownerId` — never trust a
 * client-supplied id (build plan non-negotiable).
 */

export async function createCaseForOwner(owner: IUser, input: CreateCaseInput) {
  await connectDB();
  return Case.create({
    ownerId: owner._id,
    title: input.title.trim(),
    caseType: input.caseType,
    clientName: input.clientName.trim(),
    opposingParty: input.opposingParty?.trim() || undefined,
    importantDate: input.importantDate ? new Date(input.importantDate) : undefined,
  });
}

export async function listCasesForOwner(owner: IUser) {
  await connectDB();
  return Case.find({ ownerId: owner._id }).sort({ updatedAt: -1 }).lean<ICase[]>();
}

export async function getCaseForOwner(owner: IUser, caseId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(caseId)) return null;
  return Case.findOne({ _id: caseId, ownerId: owner._id }).lean<ICase>();
}

export interface DashboardStats {
  activeCases: number;
  documentsProcessed: number;
  contradictionsFound: number;
  upcomingDeadlines: number;
  recentCases: ICase[];
}

export async function getDashboardStatsForOwner(owner: IUser): Promise<DashboardStats> {
  await connectDB();
  const cases = await Case.find({ ownerId: owner._id }).sort({ updatedAt: -1 }).lean<ICase[]>();

  return {
    activeCases: cases.length,
    documentsProcessed: cases.reduce((sum, c) => sum + (c.stats?.documentsCount ?? 0), 0),
    contradictionsFound: cases.reduce((sum, c) => sum + (c.stats?.contradictionsCount ?? 0), 0),
    // Deadline tracking lands with the AI Case Analyzer on Day 4 — zeroed until then.
    upcomingDeadlines: 0,
    recentCases: cases.slice(0, 5),
  };
}
