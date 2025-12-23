"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { showToast } from "@/lib/toast";

interface DebtTransaction {
  _id: string;
  roomNumber: string;
  customerName?: string;
  identityCode?: string;
  phoneNumber?: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  paidAmount?: number;
  debtRemaining?: number;
  createdAt: string;
}

export default function DebtsPage() {
  const t = useTranslations();
  const [debts, setDebts] = useState<DebtTransaction[]>([]);
  const [allDebts, setAllDebts] = useState<DebtTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtTransaction | null>(null);
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/transactions?debtsOnly=true";
      if (filterStartDate && filterEndDate) {
        url += `&startDate=${filterStartDate}&endDate=${filterEndDate}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to load debts");
        return;
      }
      setAllDebts(data.data || []);
      setDebts(data.data || []);
    } catch (error) {
      console.error("Failed to fetch debts", error);
      showToast.error("Failed to load debts");
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  // Filter debts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebts(allDebts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allDebts.filter(
      (debt) =>
        debt.roomNumber.toLowerCase().includes(query) ||
        debt.customerName?.toLowerCase().includes(query) ||
        debt.identityCode?.toLowerCase().includes(query) ||
        debt.phoneNumber?.toLowerCase().includes(query)
    );
    setDebts(filtered);
  }, [searchQuery, allDebts]);

  const formatCurrency = (value: number | undefined) =>
    new Intl.NumberFormat("vi-VN").format(value || 0) + " VND";

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("vi-VN");

  const handleUpdateClick = (debt: DebtTransaction) => {
    setSelectedDebt(debt);
    setPaidAmount((debt.paidAmount || 0).toString());
    setShowUpdateModal(true);
  };

  const handleSettle = async (id: string) => {
    try {
      setSettlingId(id);
      const res = await fetch(`/api/transactions/${id}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to settle debt");
        return;
      }
      showToast.success(t("debts.settleSuccess"));
      fetchDebts();
    } catch (error) {
      console.error("Failed to settle debt", error);
      showToast.error("Failed to settle debt");
    } finally {
      setSettlingId(null);
    }
  };

  const handleUpdatePaidAmount = async () => {
    if (!selectedDebt) return;

    const paidAmountNum = Number(paidAmount);
    if (isNaN(paidAmountNum) || paidAmountNum < 0) {
      showToast.error(t("debts.invalidAmount"));
      return;
    }

    if (paidAmountNum > selectedDebt.amount) {
      showToast.error(t("debts.amountExceedsBill"));
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`/api/transactions/${selectedDebt._id}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: paidAmountNum }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to update paid amount");
        return;
      }
      showToast.success(t("debts.updateSuccess"));
      setShowUpdateModal(false);
      setSelectedDebt(null);
      setPaidAmount("");
      fetchDebts();
    } catch (error) {
      console.error("Failed to update paid amount", error);
      showToast.error("Failed to update paid amount");
    } finally {
      setUpdating(false);
    }
  };

  const totalDebt = debts.reduce(
    (sum, d) => sum + (d.debtRemaining || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("debts.title")}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t("debts.description")}
        </p>
      </div>

      <div className="flex items-center justify-between bg-white border border-amber-200 rounded-xl p-4">
        <div>
          <p className="text-sm font-semibold text-amber-800">
            {t("debts.totalOutstanding")}
          </p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {formatCurrency(totalDebt)}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDebts}
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? t("common.loading") : t("common.refresh")}
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              {t("debts.listTitle")}
            </h2>
            <span className="text-xs text-gray-500">
              {t("debts.count", { count: debts.length })}
            </span>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder={t("debts.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t("debts.filterStartDate")}
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t("debts.filterEndDate")}
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className="w-full px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={!filterStartDate && !filterEndDate}
                >
                  {t("debts.clearFilters")}
                </button>
              </div>
            </div>
          </div>
        </div>
        {debts.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            {t("debts.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("room.roomNumber")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("room.customerName")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("room.identityCode")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("room.phoneNumber")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("debts.totalBill")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("debts.currentPaid")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("debts.debtRemaining")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("room.checkIn")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("room.checkOut")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debts.map((debt) => (
                  <tr key={debt._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {debt.roomNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {debt.customerName || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {debt.identityCode || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {debt.phoneNumber || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(debt.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(debt.paidAmount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {formatCurrency(debt.debtRemaining)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      {formatDateTime(debt.checkIn)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      {formatDateTime(debt.checkOut)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateClick(debt)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                        >
                          {t("debts.updatePaidAmount")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSettle(debt._id)}
                          disabled={settlingId === debt._id}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {settlingId === debt._id
                            ? t("common.loading")
                            : t("debts.settleButton")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Paid Amount Modal */}
      {showUpdateModal && selectedDebt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t("debts.updatePaidAmountTitle")}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("room.customerName")}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedDebt.customerName || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("room.roomNumber")}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedDebt.roomNumber}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("debts.totalBill")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(selectedDebt.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("debts.currentPaid")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(selectedDebt.paidAmount)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("debts.debtRemaining")}
                </p>
                <p className="text-sm font-semibold text-red-600">
                  {formatCurrency(selectedDebt.debtRemaining)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("debts.newPaidAmount")} (VND)
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedDebt.amount}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("debts.paidAmountHint", {
                    max: formatCurrency(selectedDebt.amount),
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedDebt(null);
                  setPaidAmount("");
                }}
                disabled={updating}
                className="flex-1 px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleUpdatePaidAmount}
                disabled={updating}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {updating ? t("common.loading") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}


