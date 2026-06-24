export type LeadSource = "LinkedIn" | "WhatsApp" | "Website" | "Referral" | "Cold Call" | "Other";
export type LeadStatus =
  | "New Lead"
  | "Called"
  | "Interested"
  | "Follow Up"
  | "Demo Scheduled"
  | "Demo Completed"
  | "Closed Won"
  | "Closed Lost";

export interface Lead {
  id: string;
  _id?: string;
  name: string;
  mobile: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  nextFollowUp?: string;
  lastContactDate?: string;
  followUpCount?: number;
  notes?: string;
  expectedRevenue?: number;
  actualRevenue?: number;
  createdAt: string;
  updatedAt: string;
}

export type CallOutcome =
  | "Interested"
  | "Busy"
  | "No Answer"
  | "Call Back Later"
  | "Not Interested";

export interface Call {
  id: string;
  _id?: string;
  leadId: string;
  leadName?: string;
  callDate: string;
  durationMinutes?: number;
  duration?: number;
  outcome: CallOutcome;
  remarks?: string;
  notes?: string;
  nextFollowUp?: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  callsToday: number;
  todayFollowUps: number;
  tomorrowFollowUps: number;
  overdueFollowUps: number;
  completedFollowUps: number;
  interestedLeads: number;
  demoScheduled: number;
  closedWon: number;
  closedLost: number;
  expectedRevenue: number;
  actualRevenue: number;
  conversionRate: number;
}

export const LEAD_SOURCES: LeadSource[] = [
  "LinkedIn",
  "WhatsApp",
  "Website",
  "Referral",
  "Cold Call",
  "Other",
];

export const LEAD_STATUSES: LeadStatus[] = [
  "New Lead",
  "Called",
  "Interested",
  "Follow Up",
  "Demo Scheduled",
  "Demo Completed",
  "Closed Won",
  "Closed Lost",
];

export const CALL_OUTCOMES: CallOutcome[] = [
  "Interested",
  "Busy",
  "No Answer",
  "Call Back Later",
  "Not Interested",
];
