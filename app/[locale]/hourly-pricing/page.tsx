"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ConfirmModal from "@/components/ConfirmModal";

interface HourlyPricing {
  _id: string;
  category: "vip" | "regular";
  bedType: number;
  firstHours: number;
  firstHoursPrice: number;
  additionalHourPrice: number;
  dailyPrice: number;
  checkoutTime: string;
}

export default function HourlyPricingPage() {
  const t = useTranslations();
  const [pricing, setPricing] = useState<HourlyPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<HourlyPricing | null>(
    null
  );

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
    category: "regular" as "vip" | "regular",
    bedType: 1,
    firstHours: 2,
    firstHoursPrice: 120000,
    additionalHourPrice: 20000,
    dailyPrice: 200000,
    checkoutTime: "12:00",
  });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch("/api/hourly-pricing");
      const result = await response.json();
      if (result.success) {
        setPricing(result.data);
      }
    } catch (error) {
      console.error("Error fetching hourly pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPricing
        ? `/api/hourly-pricing/${editingPricing._id}`
        : "/api/hourly-pricing";
      const method = editingPricing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        fetchPricing();
        setShowModal(false);
        resetForm();
      } else {
        alert(result.error || "Failed to save pricing");
      }
    } catch (error) {
      console.error("Error saving hourly pricing:", error);
      alert("Failed to save pricing");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      title: t("common.confirm"),
      message: t("common.confirmDelete"),
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/hourly-pricing/${id}`, {
            method: "DELETE",
          });
          const result = await response.json();
          if (result.success) {
            fetchPricing();
          }
        } catch (error) {
          console.error("Error deleting hourly pricing:", error);
        } finally {
          setShowConfirm(false);
        }
      },
      type: "danger",
    });
    setShowConfirm(true);
  };

  const handleEdit = (p: HourlyPricing) => {
    setEditingPricing(p);
    setFormData({
      category: p.category,
      bedType: p.bedType,
      firstHours: p.firstHours,
      firstHoursPrice: p.firstHoursPrice,
      additionalHourPrice: p.additionalHourPrice,
      dailyPrice: p.dailyPrice,
      checkoutTime: p.checkoutTime,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      category: "regular",
      bedType: 1,
      firstHours: 2,
      firstHoursPrice: 120000,
      additionalHourPrice: 20000,
      dailyPrice: 200000,
      checkoutTime: "12:00",
    });
    setEditingPricing(null);
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
              {t("hourlyPricing.title")}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {t("hourlyPricing.description")}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("hourlyPricing.addPricing")}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("room.category")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("room.bedType")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("hourlyPricing.firstHours")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("hourlyPricing.firstHoursPrice")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("hourlyPricing.additionalHourPrice")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("hourlyPricing.dailyPrice")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("hourlyPricing.checkoutTime")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricing.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                pricing.map((p) => (
                  <tr key={p._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t(`room.${p.category}`)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.bedType} {t("room.beds")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.firstHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrice(p.firstHoursPrice)} VND
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrice(p.additionalHourPrice)} VND
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(p.dailyPrice)} VND
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.checkoutTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
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
            <div className="relative mx-auto p-5 border w-full max-w-sm shadow-lg rounded-xl bg-white max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingPricing
                  ? t("hourlyPricing.editPricing")
                  : t("hourlyPricing.addPricing")}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.category")}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as "vip" | "regular",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="regular">{t("room.regular")}</option>
                    <option value="vip">{t("room.vip")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.bedType")}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.bedType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bedType: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("hourlyPricing.firstHours")}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.firstHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstHours: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("hourlyPricing.firstHoursPrice")}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.firstHoursPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstHoursPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("hourlyPricing.additionalHourPrice")}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.additionalHourPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additionalHourPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("hourlyPricing.dailyPrice")}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.dailyPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("hourlyPricing.checkoutTime")} (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.checkoutTime}
                    onChange={(e) =>
                      setFormData({ ...formData, checkoutTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t("common.save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setShowConfirm(false)}
          type={confirmConfig.type}
        />
      </div>
    </div>
  );
}
