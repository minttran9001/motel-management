"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ConfirmModal from "@/components/ConfirmModal";
import Modal from "@/components/Modal";
import PageContainer from "@/components/PageContainer";
import apiClient from "@/lib/api-client";
import { showToast } from "@/lib/toast";

interface Discount {
  _id: string;
  name: string;
  category: "vip" | "regular" | "all";
  bedType?: number;
  discountType: "percentage" | "fixed";
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function DiscountsPage() {
  const t = useTranslations();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
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
    category: "all" as "vip" | "regular" | "all",
    bedType: undefined as number | undefined,
    discountType: "percentage" as "percentage" | "fixed",
    value: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await apiClient.discounts.getAll();
      if (response.data.success) {
        setDiscounts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setProcessingSubmit(true);
    try {
      const response = editingDiscount
        ? await apiClient.discounts.update(editingDiscount._id, formData)
        : await apiClient.discounts.create(formData);
      if (response.data.success) {
        fetchDiscounts();
        setShowModal(false);
        resetForm();
      }
    } catch (error: any) {
      console.error("Error saving discount:", error);
      showToast.error(error.response?.data?.error || "Error saving discount");
    } finally {
      setProcessingSubmit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      title: t("common.confirm"),
      message: t("common.confirmDelete"),
      onConfirm: async () => {
        try {
          const response = await apiClient.discounts.delete(id);
          if (response.data.success) {
            fetchDiscounts();
          }
        } catch (error: any) {
          console.error("Error deleting discount:", error);
          showToast.error(
            error.response?.data?.error || "Error deleting discount"
          );
        } finally {
          setShowConfirm(false);
        }
      },
      type: "danger",
    });
    setShowConfirm(true);
  };

  const handleEdit = (d: Discount) => {
    setEditingDiscount(d);
    setFormData({
      name: d.name,
      category: d.category,
      bedType: d.bedType,
      discountType: d.discountType,
      value: d.value,
      startDate: new Date(d.startDate).toISOString().split("T")[0],
      endDate: new Date(d.endDate).toISOString().split("T")[0],
      isActive: d.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "all",
      bedType: undefined,
      discountType: "percentage",
      value: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      isActive: true,
    });
    setEditingDiscount(null);
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
          <h1 className="text-3xl font-bold text-gray-900">
            {t("discount.title")}
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
          >
            {t("discount.addDiscount")}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("discount.name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("room.category")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("room.bedType")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("discount.value")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("discount.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {d.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {d.category === "all"
                        ? t("discount.allCategories")
                        : t(`room.${d.category}`)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {d.bedType
                        ? `${d.bedType} ${t("room.beds")}`
                        : t("discount.allBedTypes")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {d.discountType === "percentage"
                        ? `${d.value}%`
                        : `${new Intl.NumberFormat("vi-VN").format(
                            d.value
                          )} VND`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          d.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {d.isActive
                          ? t("discount.isActive")
                          : t("discount.inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(d)}
                        disabled={processingDelete !== null}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(d._id)}
                        disabled={
                          processingDelete === d._id ||
                          processingDelete !== null
                        }
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingDelete === d._id
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
          title={
            editingDiscount
              ? t("discount.editDiscount")
              : t("discount.addDiscount")
          }
          maxWidth="sm"
          onSave={handleSubmit}
          isLoading={processingSubmit}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("discount.name")}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("room.category")}
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t("discount.allCategories")}</option>
                <option value="regular">{t("room.regular")}</option>
                <option value="vip">{t("room.vip")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("room.bedType")} ({t("discount.optional")})
              </label>
              <input
                type="number"
                min="1"
                value={formData.bedType || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bedType: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("discount.bedType")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("discount.type")}
              </label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">{t("discount.percentage")}</option>
                <option value="fixed">{t("discount.fixed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("discount.value")}
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("discount.startDate")}
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("discount.endDate")}
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                {t("discount.isActive")}
              </label>
            </div>
          </div>
        </Modal>

        {/* Custom Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setShowConfirm(false)}
          type={confirmConfig.type}
        />
      </PageContainer>
    </div>
  );
}
