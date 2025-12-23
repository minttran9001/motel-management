"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import ConfirmModal from "@/components/ConfirmModal";
import Modal from "@/components/Modal";
import PageContainer from "@/components/PageContainer";
import apiClient from "@/lib/api-client";
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
  const [processingSubmit, setProcessingSubmit] = useState(false);
  const [processingDelete, setProcessingDelete] = useState<string | null>(null);

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
      const params =
        filterStartDate && filterEndDate
          ? { startDate: filterStartDate, endDate: filterEndDate }
          : undefined;
      const response = await apiClient.extrasOptions.analytics(params);
      if (response.data.success) {
        setAnalytics(response.data.data);
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
      const response = await apiClient.extrasOptions.getAll();
      if (response.data.success) {
        setOptions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching extras options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setProcessingSubmit(true);
    try {
      const response = editingOption
        ? await apiClient.extrasOptions.update(editingOption._id, {
            name: formData.name,
            price: Number(formData.price),
          })
        : await apiClient.extrasOptions.create({
            name: formData.name,
            price: Number(formData.price),
          });
      if (response.data.success) {
        showToast.success(
          editingOption ? t("extras.updateSuccess") : t("extras.createSuccess")
        );
        fetchOptions();
        setShowModal(false);
        resetForm();
      }
    } catch (error: any) {
      console.error("Error saving extras option:", error);
      showToast.error(error.response?.data?.error || t("extras.saveError"));
    } finally {
      setProcessingSubmit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      title: t("common.confirm"),
      message: t("extras.confirmDelete"),
      onConfirm: async () => {
        try {
          const response = await apiClient.extrasOptions.delete(id);
          if (response.data.success) {
            showToast.success(t("extras.deleteSuccess"));
            fetchOptions();
          }
        } catch (error: any) {
          console.error("Error deleting extras option:", error);
          showToast.error(
            error.response?.data?.error || t("extras.deleteError")
          );
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
      <PageContainer>
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
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
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
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
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
                        disabled={processingDelete !== null}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(option._id)}
                        disabled={
                          processingDelete === option._id ||
                          processingDelete !== null
                        }
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingDelete === option._id
                          ? t("common.loading")
                          : t("common.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={editingOption ? t("extras.editOption") : t("extras.addOption")}
          maxWidth="md"
          onSave={handleSubmit}
          saveText={editingOption ? t("common.update") : t("common.add")}
          isLoading={processingSubmit}
        >
          <div className="space-y-4">
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
          </div>
        </Modal>

        <ConfirmModal
          isOpen={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
        />
      </PageContainer>
    </div>
  );
}
