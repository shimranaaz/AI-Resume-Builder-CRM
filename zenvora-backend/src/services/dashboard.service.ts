import Lead from "../models/Lead";
import Call from "../models/Call";

export const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const [
    totalLeads,
    newLeadsToday,
    callsToday,
    todayFollowUps,
    tomorrowFollowUps,
    overdueFollowUps,
    completedFollowUps,
    interestedLeads,
    demoScheduled,
    closedWon,
    closedLost,
    revenueData,
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
    Call.countDocuments({ callDate: { $gte: today, $lt: tomorrow } }),
    Lead.countDocuments({
      nextFollowUp: { $gte: today, $lt: tomorrow },
      status: { $nin: ["Closed Won", "Closed Lost"] },
    }),
    Lead.countDocuments({
      nextFollowUp: { $gte: tomorrow, $lt: dayAfterTomorrow },
      status: { $nin: ["Closed Won", "Closed Lost"] },
    }),
    Lead.countDocuments({
      nextFollowUp: { $lt: today },
      status: { $nin: ["Closed Won", "Closed Lost"] },
    }),
    Lead.countDocuments({
      status: { $in: ["Closed Won", "Closed Lost"] },
    }),
    Lead.countDocuments({ status: "Interested" }),
    Lead.countDocuments({ status: "Demo Scheduled" }),
    Lead.countDocuments({ status: "Closed Won" }),
    Lead.countDocuments({ status: "Closed Lost" }),
    Lead.aggregate([
      {
        $group: {
          _id: null,
          totalExpectedRevenue: { $sum: "$expectedRevenue" },
          totalActualRevenue: { $sum: "$actualRevenue" },
        },
      },
    ]),
  ]);

  const expectedRevenue = revenueData[0]?.totalExpectedRevenue || 0;
  const actualRevenue = revenueData[0]?.totalActualRevenue || 0;
  const conversionRate =
    totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(2) : "0.00";

  return {
    totalLeads,
    newLeadsToday,
    callsToday,
    todayFollowUps,
    tomorrowFollowUps,
    overdueFollowUps,
    completedFollowUps,
    interestedLeads,
    demoScheduled,
    closedWon,
    closedLost,
    expectedRevenue,
    actualRevenue,
    conversionRate: parseFloat(conversionRate),
  };
};