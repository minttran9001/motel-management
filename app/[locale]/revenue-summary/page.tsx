"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageContainer from "@/components/PageContainer";
import apiClient from "@/lib/api-client";

interface RevenueData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  count: number;
  period: string;
  start: string;
  end: string;
}

interface Transaction {
  _id: string;
  roomNumber: string;
  customerName?: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  deposit: number;
  extras?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  cancelled?: boolean;
}

interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

interface MonthlyAnalytics {
  year: number;
  month: number;
  monthName: string;
  customerCount: number;
  totalRevenue: number;
  totalExtrasRevenue: number;
}

export default function RevenueSummaryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRevenueDetails, setShowRevenueDetails] = useState(false);
  const [showExpensesDetails, setShowExpensesDetails] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showMonthlyAnalytics, setShowMonthlyAnalytics] = useState(false);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalytics[]>(
    []
  );
  const [monthlyAnalyticsLoading, setMonthlyAnalyticsLoading] = useState(false);
  const [analyticsYear, setAnalyticsYear] = useState(new Date().getFullYear());
  const [loadingRevenueDetails, setLoadingRevenueDetails] = useState(false);
  const [loadingExpensesDetails, setLoadingExpensesDetails] = useState(false);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      let dateStr: string;
      if (viewMode === "month") {
        // Create date for the first day of selected month
        const date = new Date(selectedYear, selectedMonth - 1, 1);
        dateStr = date.toISOString();
      } else {
        // Create date for the first day of selected year
        const date = new Date(selectedYear, 0, 1);
        dateStr = date.toISOString();
      }

      const response = await apiClient.revenue.get({
        period: viewMode,
        date: dateStr,
      });

      if (response.data.success) {
        setRevenue(response.data.data);
      } else {
        console.error("Error fetching revenue:", response.data.error);
      }
    } catch (error) {
      console.error("Error fetching revenue:", error);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      month: "long",
    });
  };

  const handleRevenueClick = async () => {
    if (!revenue || loadingRevenueDetails) return;
    setShowRevenueDetails(true);
    setLoadingDetails(true);
    setLoadingRevenueDetails(true);
    try {
      // Fetch transactions for the period
      const startDate = new Date(revenue.start).toISOString();
      const endDate = new Date(revenue.end).toISOString();
      const transactionsRes = await apiClient.transactions.getAll({
        startDate,
        endDate,
      });
      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching revenue details:", error);
    } finally {
      setLoadingDetails(false);
      setLoadingRevenueDetails(false);
    }
  };

  const handleExpensesClick = async () => {
    if (!revenue || loadingExpensesDetails) return;
    setShowExpensesDetails(true);
    setLoadingDetails(true);
    setLoadingExpensesDetails(true);
    try {
      const startDate = new Date(revenue.start).toISOString();
      const endDate = new Date(revenue.end).toISOString();
      const response = await apiClient.expenses.getAll({
        startDate,
        endDate,
      });
      if (response.data.success) {
        setExpenses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching expenses details:", error);
    } finally {
      setLoadingDetails(false);
      setLoadingExpensesDetails(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(
      locale === "vi" ? "vi-VN" : "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getCategoryLabel = (category: string) => {
    return t(`expense.${category}`);
  };

  // Filter transactions based on search query and date range
  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      transaction.roomNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (transaction.customerName &&
        transaction.customerName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    // Date range filter
    const checkInDate = new Date(transaction.checkIn);
    const checkOutDate = new Date(transaction.checkOut);
    const matchesStartDate =
      filterStartDate === "" || checkInDate >= new Date(filterStartDate);
    const matchesEndDate =
      filterEndDate === "" ||
      checkOutDate <= new Date(filterEndDate + "T23:59:59");

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const fetchMonthlyAnalytics = useCallback(async () => {
    setMonthlyAnalyticsLoading(true);
    try {
      const response = await apiClient.revenue.monthlyAnalytics({
        year: analyticsYear,
      });
      if (response.data.success) {
        // Localize month names
        const monthNames =
          locale === "vi"
            ? [
                "Tháng 1",
                "Tháng 2",
                "Tháng 3",
                "Tháng 4",
                "Tháng 5",
                "Tháng 6",
                "Tháng 7",
                "Tháng 8",
                "Tháng 9",
                "Tháng 10",
                "Tháng 11",
                "Tháng 12",
              ]
            : [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ];

        const localized = response.data.data.map((item: MonthlyAnalytics) => ({
          ...item,
          monthName: monthNames[item.month - 1],
        }));
        setMonthlyAnalytics(localized);
      }
    } catch (error) {
      console.error("Error fetching monthly analytics:", error);
    } finally {
      setMonthlyAnalyticsLoading(false);
    }
  }, [analyticsYear, locale]);

  useEffect(() => {
    if (showMonthlyAnalytics) {
      fetchMonthlyAnalytics();
    }
  }, [showMonthlyAnalytics, fetchMonthlyAnalytics]);

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen">
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("revenueSummary.title")}
          </h1>
          <p className="text-sm text-gray-600">
            {t("revenueSummary.description")}
          </p>
        </div>

        {/* View Mode Selection */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium text-gray-700">
              {t("revenueSummary.viewMode")}:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "month"
                    ? "bg-blue-400 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("revenueSummary.byMonth")}
              </button>
              <button
                onClick={() => setViewMode("year")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "year"
                    ? "bg-blue-400 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("revenueSummary.byYear")}
              </button>
            </div>
          </div>

          {/* Month/Year Selection */}
          <div className="flex items-center gap-4">
            {viewMode === "month" && (
              <>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("revenueSummary.selectMonth")}
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("revenueSummary.selectYear")}
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {viewMode === "year" && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("revenueSummary.selectYear")}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Summary */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        ) : revenue ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Total Revenue */}
            <div
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleRevenueClick}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="shrink-0 bg-green-400 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t("revenueSummary.totalRevenue")}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {formatPrice(revenue.totalRevenue)} VND
                      </dd>
                    </dl>
                  </div>
                  <div className="ml-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Expenses */}
            <div
              className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow ${
                loadingExpensesDetails ? "opacity-50 cursor-wait" : ""
              }`}
              onClick={handleExpensesClick}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="shrink-0 bg-red-400 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t("revenueSummary.totalExpenses")}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {formatPrice(revenue.totalExpenses)} VND
                      </dd>
                    </dl>
                  </div>
                  <div className="ml-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div
                    className={`shrink-0 rounded-md p-3 ${
                      revenue.netIncome >= 0 ? "bg-blue-400" : "bg-orange-400"
                    }`}
                  >
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t("revenueSummary.netIncome")}
                      </dt>
                      <dd
                        className={`text-lg font-semibold ${
                          revenue.netIncome >= 0
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      >
                        {formatPrice(revenue.netIncome)} VND
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">{t("revenueSummary.noData")}</p>
          </div>
        )}

        {/* Monthly Analytics Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {t("revenueSummary.monthlyAnalyticsTitle")}
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={analyticsYear}
                onChange={(e) => setAnalyticsYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowMonthlyAnalytics(!showMonthlyAnalytics)}
                className="px-4 py-2 text-sm font-semibold bg-green-400 text-white rounded-lg hover:bg-green-400 transition-colors"
              >
                {showMonthlyAnalytics
                  ? t("revenueSummary.hideMonthlyAnalytics")
                  : t("revenueSummary.showMonthlyAnalytics")}
              </button>
            </div>
          </div>
          {showMonthlyAnalytics && (
            <>
              {monthlyAnalyticsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  {t("common.loading")}
                </div>
              ) : monthlyAnalytics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t("revenueSummary.noMonthlyAnalytics")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.rank")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.month")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.customerCount")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.totalRevenue")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monthlyAnalytics.map((item, index) => {
                        const isTopThree = index < 3;
                        const rankColors = [
                          "bg-yellow-100 text-yellow-800 border-yellow-300", // Gold
                          "bg-gray-100 text-gray-800 border-gray-300", // Silver
                          "bg-orange-100 text-orange-800 border-orange-300", // Bronze
                        ];
                        const rankBadges = ["🥇", "🥈", "🥉"];

                        return (
                          <tr
                            key={`${item.year}-${item.month}`}
                            className={
                              isTopThree
                                ? "bg-gradient-to-r from-blue-50 to-transparent"
                                : ""
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-bold px-2 py-1 rounded border ${
                                    isTopThree
                                      ? rankColors[index]
                                      : "text-gray-600"
                                  }`}
                                >
                                  {isTopThree
                                    ? rankBadges[index]
                                    : `#${index + 1}`}
                                </span>
                                {!isTopThree && (
                                  <span className="text-sm text-gray-500">
                                    #{index + 1}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    isTopThree
                                      ? "text-gray-900 font-bold"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {item.monthName}
                                </span>
                                {isTopThree && (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                    {t("revenueSummary.topRank", {
                                      rank: index + 1,
                                    })}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.customerCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatPrice(item.totalRevenue)} VND
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Additional Details */}
        {revenue && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("revenueSummary.details")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  {t("revenueSummary.period")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {viewMode === "month"
                    ? `${getMonthName(selectedMonth)} ${selectedYear}`
                    : selectedYear}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {t("revenueSummary.transactionCount")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {revenue.count} {t("revenueSummary.transactions")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {t("revenueSummary.startDate")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(revenue.start)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {t("revenueSummary.endDate")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(revenue.end)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Details Modal */}
        <Dialog open={showRevenueDetails} onOpenChange={setShowRevenueDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t("revenueSummary.revenueDetails")} -{" "}
                {viewMode === "month"
                  ? `${getMonthName(selectedMonth)} ${selectedYear}`
                  : selectedYear}
              </DialogTitle>
            </DialogHeader>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-600">{t("common.loading")}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {t("revenueSummary.noTransactions")}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                {/* Search and Filter Section */}
                <div className="mb-4 space-y-3">
                  <div className="flex gap-3 flex-wrap">
                    <input
                      type="text"
                      placeholder={t("revenueSummary.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="date"
                      placeholder={t("revenueSummary.startDate")}
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="date"
                      placeholder={t("revenueSummary.endDate")}
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {(searchQuery || filterStartDate || filterEndDate) && (
                      <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {t("revenueSummary.clearFilters")}
                      </button>
                    )}
                  </div>
                  {filteredTransactions.length !== transactions.length && (
                    <p className="text-sm text-gray-500">
                      {t("revenueSummary.showingResults", {
                        count: filteredTransactions.length,
                        total: transactions.length,
                      })}
                    </p>
                  )}
                </div>

                {(() => {
                  // Check if any transaction has extras
                  const hasExtras = filteredTransactions.some(
                    (t) => t.extras && t.extras.length > 0
                  );
                  const totalExtras = filteredTransactions.reduce((sum, t) => {
                    const extrasTotal = t.extras
                      ? t.extras.reduce((s, e) => s + e.price * e.quantity, 0)
                      : 0;
                    return sum + extrasTotal;
                  }, 0);

                  return filteredTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {t("revenueSummary.noMatchingTransactions")}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t("revenueSummary.roomNumber")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t("revenueSummary.customerName")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t("revenueSummary.checkIn")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t("revenueSummary.checkOut")}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t("revenueSummary.amount")}
                            </th>
                            {hasExtras && (
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("revenueSummary.extras")}
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredTransactions.map((transaction) => {
                            const extrasTotal = transaction.extras
                              ? transaction.extras.reduce(
                                  (sum, e) => sum + e.price * e.quantity,
                                  0
                                )
                              : 0;
                            return (
                              <tr
                                key={transaction._id}
                                className={
                                  transaction.cancelled ? "opacity-50" : ""
                                }
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {transaction.roomNumber}
                                  {transaction.cancelled && (
                                    <span className="ml-2 text-xs text-red-600">
                                      ({t("revenueSummary.cancelled")})
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {transaction.customerName || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {formatDateTime(transaction.checkIn)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {formatDateTime(transaction.checkOut)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                  {formatPrice(transaction.amount)} VND
                                </td>
                                {hasExtras && (
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                                    {extrasTotal > 0
                                      ? formatPrice(extrasTotal)
                                      : "-"}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td
                              colSpan={hasExtras ? 4 : 4}
                              className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"
                            >
                              {t("revenueSummary.total")}:
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                              {formatPrice(
                                filteredTransactions.reduce(
                                  (sum, t) => sum + t.amount,
                                  0
                                )
                              )}{" "}
                              VND
                            </td>
                            {hasExtras && (
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                {formatPrice(totalExtras)} VND
                              </td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Expenses Details Modal */}
        <Dialog
          open={showExpensesDetails}
          onOpenChange={setShowExpensesDetails}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t("revenueSummary.expensesDetails")} -{" "}
                {viewMode === "month"
                  ? `${getMonthName(selectedMonth)} ${selectedYear}`
                  : selectedYear}
              </DialogTitle>
            </DialogHeader>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-600">{t("common.loading")}</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {t("revenueSummary.noExpenses")}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.date")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.title")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.category")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.description")}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("revenueSummary.amount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <tr key={expense._id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {expense.title}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {getCategoryLabel(expense.category)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {expense.description || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatPrice(expense.amount)} VND
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"
                        >
                          {t("revenueSummary.total")}:
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          {formatPrice(
                            expenses.reduce((sum, e) => sum + e.amount, 0)
                          )}{" "}
                          VND
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageContainer>
    </div>
  );
}
