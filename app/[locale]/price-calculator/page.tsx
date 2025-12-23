"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { showToast } from "@/lib/toast";

interface HourlyPricing {
  _id: string;
  category: "vip" | "regular";
  bedType: number;
}

interface CalculationResult {
  totalPrice: number;
  breakdown: {
    days: number;
    hours: number;
    dailyPrice: number;
    hourlyPrice: number;
    description: string;
  };
}

export default function PriceCalculatorPage() {
  const t = useTranslations();
  const [hourlyPricingOptions, setHourlyPricingOptions] = useState<
    HourlyPricing[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<"vip" | "regular">(
    "regular"
  );
  const [selectedBedType, setSelectedBedType] = useState<number | "">("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHourlyPricing();
  }, []);

  useEffect(() => {
    // Filter bed types based on selected category
    const bedTypes = hourlyPricingOptions
      .filter((p) => p.category === selectedCategory)
      .map((p) => p.bedType);
    if (bedTypes.length > 0 && !bedTypes.includes(selectedBedType as number)) {
      setSelectedBedType(bedTypes[0]);
    }
  }, [selectedCategory, hourlyPricingOptions, selectedBedType]);

  const fetchHourlyPricing = async () => {
    try {
      const response = await apiClient.hourlyPricing.getAll();
      if (response.data.success) {
        setHourlyPricingOptions(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCategory(response.data.data[0].category);
          setSelectedBedType(response.data.data[0].bedType);
        }
      }
    } catch (error) {
      console.error("Error fetching hourly pricing:", error);
    }
  };

  const handleCalculate = async () => {
    if (!selectedCategory || !selectedBedType || !checkIn || !checkOut) {
      showToast.error(t("priceCalculator.fillAllFields"));
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      showToast.error(t("priceCalculator.checkoutAfterCheckin"));
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiClient.calculatePrice.calculate({
        category: selectedCategory,
        bedType: selectedBedType,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
      });

      if (response.data.success) {
        setResult(response.data.data);
        showToast.success(
          t("priceCalculator.calculateSuccess") ||
            "Price calculated successfully"
        );
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      showToast.error(
        err.response?.data?.error ||
          err.message ||
          t("priceCalculator.calculateError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!result || !selectedCategory || !selectedBedType) return;

    setSaving(true);

    try {
      // Note: The revenue POST endpoint expects different fields
      // For now, we'll skip saving from calculator as it requires a roomId
      showToast.warning(
        t("priceCalculator.saveNotSupported") ||
          "Saving from calculator is not supported"
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast.error(err.message || t("priceCalculator.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const availableBedTypes = hourlyPricingOptions
    .filter((p) => p.category === selectedCategory)
    .map((p) => p.bedType);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t("priceCalculator.title")}
        </h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("room.category")}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as "vip" | "regular")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="regular">{t("room.regular")}</option>
                <option value="vip">{t("room.vip")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("room.bedType")}
              </label>
              <select
                value={selectedBedType}
                onChange={(e) => setSelectedBedType(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={availableBedTypes.length === 0}
              >
                {availableBedTypes.length === 0 ? (
                  <option value="">No pricing available</option>
                ) : (
                  availableBedTypes.map((bedType) => (
                    <option key={bedType} value={bedType}>
                      {bedType} {t("room.beds")}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("priceCalculator.checkIn")}
              </label>
              <input
                type="datetime-local"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("priceCalculator.checkOut")}
              </label>
              <input
                type="datetime-local"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              onClick={handleCalculate}
              disabled={loading || availableBedTypes.length === 0}
              className="w-full bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed h-auto"
            >
              {loading ? t("common.loading") : t("priceCalculator.calculate")}
            </Button>
          </div>
        </div>

        {result && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t("priceCalculator.totalPrice")}
            </h2>
            <div className="text-4xl font-bold text-blue-600 mb-6">
              {formatPrice(result.totalPrice)} VND
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t("priceCalculator.breakdown")}
              </h3>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("priceCalculator.days")}:
                  </span>
                  <span className="font-medium">{result.breakdown.days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("priceCalculator.hours")}:
                  </span>
                  <span className="font-medium">{result.breakdown.hours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("priceCalculator.dailyPrice")}:
                  </span>
                  <span className="font-medium">
                    {formatPrice(result.breakdown.dailyPrice)} VND
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("priceCalculator.hourlyPrice")}:
                  </span>
                  <span className="font-medium">
                    {formatPrice(result.breakdown.hourlyPrice)} VND
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    {result.breakdown.description}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSaveTransaction}
                disabled={saving}
                className="w-full bg-green-400 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors disabled:bg-gray-300 h-auto"
              >
                {saving
                  ? t("common.loading")
                  : "Record Check-out (Update Revenue)"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
