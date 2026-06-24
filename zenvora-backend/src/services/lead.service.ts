import Lead from "../models/Lead";
import { createAuditLog } from "./audit.service";

export const getAllLeads = async (query: any) => {
  const { search, source, status, startDate, endDate } = query;
  const filter: any = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { source: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }

  if (source) filter.source = source;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  return await Lead.find(filter).sort({ createdAt: -1 });
};

export const getLeadById = async (id: string) => {
  return await Lead.findById(id);
};

export const createLead = async (data: any) => {
  const lead = await Lead.create(data);
  await createAuditLog("Lead Created", lead._id as any);
  return lead;
};

export const updateLead = async (id: string, data: any) => {
  const lead = await Lead.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (lead) await createAuditLog("Lead Updated", lead._id as any);
  return lead;
};

export const deleteLead = async (id: string) => {
  const lead = await Lead.findByIdAndDelete(id);
  if (lead) await createAuditLog("Lead Deleted", lead._id as any);
  return lead;
};