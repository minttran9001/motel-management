"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import PageContainer from "@/components/PageContainer";
import apiClient from "@/lib/api-client";

interface RoomStats {
  total: number;
  available: number;
  occupied: number;
}

interface RevenueData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  count: number;
  period: string;
}

export default function DashboardPage() {
  const t = useTranslations();
  const [stats, setStats] = useState<RoomStats>({
    total: 0,
    available: 0,
    occupied: 0,
  });
  const [revenue, setRevenue] = useState<RevenueData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    count: 0,
    period: "day",
  });
  const [period, setPeriod] = useState("day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, revenueRes] = await Promise.all([
        apiClient.rooms.getAll(),
        apiClient.revenue.get({ period }),
      ]);

      if (roomsRes.data.success) {
        const total = roomsRes.data.data.length;
        const available = roomsRes.data.data.filter(
          (r: { isAvailable: boolean }) => r.isAvailable
        ).length;
        setStats({ total, available, occupied: total - available });
      }

      if (revenueRes.data.success) {
        setRevenue(revenueRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  if (loading && stats.total === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageContainer>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t("dashboard.title")}
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Room Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0 bg-blue-400 rounded-md p-3">
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t("dashboard.totalRooms")}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t("dashboard.availableRooms")}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.available}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t("dashboard.occupiedRooms")}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.occupied}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Net Income Stat */}
          <div className="bg-white overflow-hidden shadow rounded-lg ring-2 ring-blue-500 ring-offset-2">
            <div className="p-5">
              <div className="flex items-center">
                <div
                  className={`shrink-0 rounded-md p-3 ${
                    revenue.netIncome >= 0 ? "bg-yellow-300" : "bg-red-400"
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t("dashboard.totalIncome")} ({t(`dashboard.${period}`)})
                    </dt>
                    <dd
                      className={`text-lg font-semibold ${
                        revenue.netIncome >= 0
                          ? "text-gray-900"
                          : "text-red-600"
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

        {/* Revenue Filters */}
        <div className="mb-8 flex space-x-2">
          {["day", "week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? "bg-blue-400 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {t(`dashboard.${p}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("dashboard.recentActivity")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/room-status"
                className="block p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
              >
                <p className="text-sm text-blue-600 font-bold">
                  {t("nav.roomStatus")}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {t("dashboard.roomStatusDesc")}
                </p>
              </Link>
              <Link
                href="/expenses"
                className="block p-4 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all"
              >
                <p className="text-sm text-red-600 font-bold">
                  {t("nav.expenses")}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {t("dashboard.expensesDesc")}
                </p>
              </Link>
              <Link
                href="/history"
                className="block p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all"
              >
                <p className="text-sm text-green-600 font-bold">
                  {t("nav.history")}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {t("history.description")}
                </p>
              </Link>
              <Link
                href="/rooms"
                className="block p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm text-gray-600 font-medium">
                  {t("room.title")}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {t("dashboard.roomsDesc")}
                </p>
              </Link>
              <Link
                href="/price-calculator"
                className="block p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm text-gray-600 font-medium">
                  {t("nav.priceCalculator")}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {t("dashboard.calcDesc")}
                </p>
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {t("dashboard.revenueByPeriod")}
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="text-sm text-green-700 font-medium">
                  {t("dashboard.revenue")}
                </span>
                <span className="text-base font-bold text-green-700">
                  +{formatPrice(revenue.totalRevenue)} VND
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                <span className="text-sm text-red-700 font-medium">
                  {t("expense.totalExpenses")}
                </span>
                <span className="text-base font-bold text-red-700">
                  -{formatPrice(revenue.totalExpenses)} VND
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">
                  {t("dashboard.totalIncome")}
                </span>
                <div className="text-right">
                  <div
                    className={`text-xl font-black ${
                      revenue.netIncome >= 0 ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {formatPrice(revenue.netIncome)} VND
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t("dashboard.basedOn", {
                      count: revenue.count,
                      period: t(`dashboard.${period}`),
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
