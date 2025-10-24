const Transaction = require("../models/transaction");
const Payment = require("../models/payment");

exports.getDashboardStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const sevenMonthsAgo = new Date(
      currentDate.setMonth(currentDate.getMonth() - 7)
    );

    const totalRevenue = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Monthly growth (current month vs previous month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const currentMonthRevenue = await Payment.aggregate([
      { $match: { status: "paid", paidDate: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const previousMonthRevenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          paidDate: { $gte: previousMonth, $lt: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Security alerts (failed transactions)
    const securityAlerts = await Transaction.countDocuments({
      status: "failed",
    });

    // Active users
    const activeUsers = await require("../models/user").countDocuments({
      isActive: true,
    });

    // Monthly data (last 7 months)
    const monthlyData = await Payment.aggregate([
      { $match: { status: "paid", paidDate: { $gte: sevenMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: "$paidDate" },
            year: { $year: "$paidDate" },
          },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get user counts for each month
    const monthlyUsers = await Promise.all(
      monthlyData.map(async (item) => {
        const count = await require("../models/user").countDocuments({
          isActive: true,
          createdAt: { $lte: new Date(item._id.year, item._id.month, 0) },
        });
        return count;
      })
    );

    // Department data
    const departmentData = await Payment.aggregate([
      { $match: { status: "paid" } },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $group: {
          _id: "$student.department",
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 5 },
    ]);

    // Recent transactions
    const recentTransactions = await Payment.find({ status: "paid" })
      .populate("studentId", "name studentId department")
      .sort({ paidDate: -1 })
      .limit(5);

    // Calculate metrics
    const prevMonthTotal = previousMonthRevenue[0]?.total || 0;
    const currMonthTotal = currentMonthRevenue[0]?.total || 0;
    const monthlyGrowthPercent =
      prevMonthTotal > 0
        ? (((currMonthTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(
            1
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRevenue[0]?.total || 0,
          monthlyGrowth: currMonthTotal,
          monthlyGrowthPercent: parseFloat(monthlyGrowthPercent),
          securityAlerts,
          activeUsers,
        },
        monthlyData: monthlyData.map((item, idx) => ({
          month: new Date(item._id.year, item._id.month - 1).toLocaleString(
            "default",
            { month: "short" }
          ),
          revenue: item.revenue,
          transactions: item.transactions,
          users: monthlyUsers[idx],
        })),
        departmentData: departmentData.map((d) => ({
          department: d._id || "Unknown",
          amount: d.amount,
        })),
        recentTransactions: recentTransactions.map((t) => ({
          id: t._id,
          studentName: t.studentId?.name || "N/A",
          studentId: t.studentId?.studentId || "N/A",
          department: t.studentId?.department || "N/A",
          amount: t.amount,
          timeAgo: getTimeAgo(t.paidDate),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [key, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `${interval} ${key}${interval > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}
