"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import ConfirmModal from "@/components/ConfirmModal";
import { showToast } from "@/lib/toast";

interface ExtrasOption {
  _id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface ExtraAnalytics {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number;
}

export default function ExtrasPage() {
  const t = useTranslations();
  const [options, setOptions] = useState<ExtrasOption[]>([]);
  const [analytics, setAnalytics] = useState<ExtraAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [editingOption, setEditingOption] = useState<ExtrasOption | null>(null);

  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "danger" | "warning" | "info";
  }>({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState({
    name: "",
    price: "",
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      let url = "/api/extras-options/analytics";
      if (filterStartDate && filterEndDate) {
        url += `?startDate=${filterStartDate}&endDate=${filterEndDate}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Error fetching extras analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [filterStartDate, filterEndDate]);

  useEffect(() => {
    if (showAnalytics) {
      fetchAnalytics();
    }
  }, [showAnalytics, fetchAnalytics]);

  const fetchOptions = async () => {
    try {
      const response = await fetch("/api/extras-options");
      const result = await response.json();
      if (result.success) {
        setOptions(result.data);
      }
    } catch (error) {
      console.error("Error fetching extras options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingOption
        ? `/api/extras-options/${editingOption._id}`
        : "/api/extras-options";
      const method = editingOption ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
        }),
      });
      const result = await response.json();
      if (result.success) {
        showToast.success(
          editingOption ? t("extras.updateSuccess") : t("extras.createSuccess")
        );
        fetchOptions();
        setShowModal(false);
        resetForm();
      } else {
        showToast.error(result.error || t("extras.saveError"));
      }
    } catch (error) {
      console.error("Error saving extras option:", error);
      showToast.error(t("extras.saveError"));
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      title: t("common.confirm"),
      message: t("extras.confirmDelete"),
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/extras-options/${id}`, {
            method: "DELETE",
          });
          const result = await response.json();
          if (result.success) {
            showToast.success(t("extras.deleteSuccess"));
            fetchOptions();
          } else {
            showToast.error(result.error || t("extras.deleteError"));
          }
        } catch (error) {
          console.error("Error deleting extras option:", error);
          showToast.error(t("extras.deleteError"));
        } finally {
          setShowConfirm(false);
        }
      },
      type: "danger",
    });
    setShowConfirm(true);
  };

  const handleEdit = (option: ExtrasOption) => {
    setEditingOption(option);
    setFormData({
      name: option.name,
      price: option.price.toString(),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
    });
    setEditingOption(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("extras.title")}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {t("extras.description")}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {showAnalytics
                ? t("extras.hideAnalytics")
                : t("extras.showAnalytics")}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("extras.addOption")}
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {t("extras.analyticsTitle")}
              </h2>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("extras.filterStartDate")}
                />
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("extras.filterEndDate")}
                />
                {(filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => {
                      setFilterStartDate("");
                      setFilterEndDate("");
                    }}
                    className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t("extras.clearFilters")}
                  </button>
                )}
              </div>
            </div>
            {analyticsLoading ? (
              <div className="text-center py-8 text-gray-500">
                {t("common.loading")}
              </div>
            ) : analytics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t("extras.noAnalytics")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("extras.rank")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("extras.name")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("extras.totalQuantity")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("extras.transactionCount")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("extras.totalRevenue")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.map((item, index) => {
                      const isTopThree = index < 3;
                      const rankColors = [
                        "bg-yellow-100 text-yellow-800 border-yellow-300", // Gold
                        "bg-gray-100 text-gray-800 border-gray-300", // Silver
                        "bg-orange-100 text-orange-800 border-orange-300", // Bronze
                      ];
                      const rankBadges = ["🥇", "🥈", "🥉"];

                      return (
                        <tr
                          key={item.name}
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
                                {item.name}
                              </span>
                              {isTopThree && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  {t("extras.topRank", { rank: index + 1 })}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.totalQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.transactionCount}
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
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("extras.name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("extras.price")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {options.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                options.map((option) => (
                  <tr key={option._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {option.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrice(option.price)} VND
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(option)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(option._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingOption ? t("extras.editOption") : t("extras.addOption")}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("extras.name")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("extras.namePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("extras.price")} (VND)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 text-sm font-bold bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                  >
                    {editingOption ? t("common.update") : t("common.add")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
        />
      </div>
    </div>
  );
}
