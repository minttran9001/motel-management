"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchHourlyPricing();
  }, []);

  useEffect(() => {
    // Filter bed types based on selected category
    const bedTypes = hourlyPricingOptions
      .filter((p) => p.category === selectedCategory)
      .map((p) => p.bedType);
    if (bedTypes.length > 0 && !bedTypes.includes(selectedBedType)) {
      setSelectedBedType(bedTypes[0]);
    }
  }, [selectedCategory, hourlyPricingOptions]);

  const fetchHourlyPricing = async () => {
    try {
      const response = await fetch("/api/hourly-pricing");
      const result = await response.json();
      if (result.success) {
        setHourlyPricingOptions(result.data);
        if (result.data.length > 0) {
          setSelectedCategory(result.data[0].category);
          setSelectedBedType(result.data[0].bedType);
        }
      }
    } catch (error) {
      console.error("Error fetching hourly pricing:", error);
    }
  };

  const handleCalculate = async () => {
    if (!selectedCategory || !selectedBedType || !checkIn || !checkOut) {
      setError("Please fill in all fields");
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      setError("Check-out must be after check-in");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const response = await fetch("/api/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          bedType: selectedBedType,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setResult(result.data);
      } else {
        setError(result.error || "Failed to calculate price");
      }
    } catch (error: any) {
      setError(error.message || "Failed to calculate price");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!result || !selectedCategory || !selectedBedType) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // For demonstration, we'll use a dummy roomId
      const response = await fetch("/api/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: "000000000000000000000000",
          roomNumber: "Calculator-Stay",
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          amount: result.totalPrice,
          category: selectedCategory,
          bedType: selectedBedType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Transaction recorded successfully! Revenue updated.");
        setResult(null);
        setCheckIn("");
        setCheckOut("");
      } else {
        setError(data.error || "Failed to save transaction");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save transaction");
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={loading || availableBedTypes.length === 0}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? t("common.loading") : t("priceCalculator.calculate")}
            </button>
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

              <button
                onClick={handleSaveTransaction}
                disabled={saving}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {saving
                  ? t("common.loading")
                  : "Record Check-out (Update Revenue)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
