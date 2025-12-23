"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

interface Room {
  _id: string;
  category: "vip" | "regular";
  bedType: number;
  roomNumber: string;
  price: number;
  isAvailable: boolean;
  customerName?: string;
  identityCode?: string;
  origin?: string;
  currentStayPrice?: number;
  deposit?: number;
  checkInTime?: string;
}

interface BillingPreview {
  roomNumber: string;
  customerName: string;
  deposit: number;
  checkIn: string;
  checkOut: string;
  calculation: {
    totalPrice: number;
    breakdown: {
      days: number;
      hours: number;
      dailyPrice: number;
      hourlyPrice: number;
      description: string;
    };
  };
}

export default function RoomStatusPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterBedType, setFilterBedType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Check-in state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [identityCode, setIdentityCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [dailyPrice, setDailyPrice] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);

  // Check-out state
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [billingPreview, setBillingPreview] = useState<BillingPreview | null>(
    null
  );
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [processingCheckOut, setProcessingCheckOut] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const result = await response.json();
      if (result.success) {
        setRooms(result.data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (room: Room) => {
    setSelectedRoom(room);
    setCustomerName("");
    setIdentityCode("");
    setOrigin("");
    setDeposit(0);

    try {
      const res = await fetch("/api/hourly-pricing");
      const data = await res.json();
      if (data.success) {
        const rule = data.data.find(
          (r: any) => r.category === room.category && r.bedType === room.bedType
        );
        setDailyPrice(rule ? rule.dailyPrice : room.price);
      } else {
        setDailyPrice(room.price);
      }
    } catch (err) {
      setDailyPrice(room.price);
    }

    setShowCheckInModal(true);
  };

  const confirmCheckIn = async () => {
    if (!selectedRoom) return;
    try {
      const response = await fetch(`/api/rooms/${selectedRoom._id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          identityCode,
          origin,
          dailyPrice,
          deposit,
        }),
      });
      const result = await response.json();
      if (result.success) {
        fetchRooms();
        setShowCheckInModal(false);
        resetCheckInFields();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error in check-in:", error);
    }
  };

  const resetCheckInFields = () => {
    setCustomerName("");
    setIdentityCode("");
    setOrigin("");
    setDailyPrice(0);
    setDeposit(0);
    setSelectedRoom(null);
  };

  const handleCheckOutClick = async (room: Room) => {
    setSelectedRoom(room);
    try {
      const response = await fetch(`/api/rooms/${room._id}/check-out/preview`);
      const result = await response.json();
      console.log(result);
      if (result.success) {
        setBillingPreview(result.data);
        // Calculate the balance: Total - Deposit
        // If positive, customer pays more. If negative, motel refunds.
        setFinalAmount(
          result.data.calculation.totalPrice - result.data.deposit
        );
        setShowCheckOutModal(true);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error fetching billing preview:", error);
    }
  };

  const confirmCheckOut = async () => {
    if (!selectedRoom) return;
    setProcessingCheckOut(true);
    try {
      const response = await fetch(`/api/rooms/${selectedRoom._id}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalAmount }),
      });
      const result = await response.json();
      console.log(result);
      if (result.success) {
        fetchRooms();
        setShowCheckOutModal(false);
        setBillingPreview(null);
        setSelectedRoom(null);

        const successMsg = t("common.checkOutSuccess", {
          roomNumber: selectedRoom.roomNumber,
          amount: new Intl.NumberFormat("vi-VN").format(finalAmount),
        });
        alert(successMsg);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error in check-out:", error);
    } finally {
      setProcessingCheckOut(false);
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

  const filteredRooms = rooms
    .filter((room) => {
      const matchesCategory =
        filterCategory === "all" || room.category === filterCategory;
      const matchesBedType =
        filterBedType === "all" || room.bedType.toString() === filterBedType;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "available" ? room.isAvailable : !room.isAvailable);
      const matchesSearch =
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.customerName?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (room.identityCode?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        );

      return (
        matchesCategory && matchesBedType && matchesStatus && matchesSearch
      );
    })
    .sort((a, b) => {
      // Occupied rooms first
      if (!a.isAvailable && b.isAvailable) return -1;
      if (a.isAvailable && !b.isAvailable) return 1;

      // Within same availability, sort by room number
      return a.roomNumber.localeCompare(b.roomNumber, undefined, {
        numeric: true,
      });
    });

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("room.gridTitle")}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg
                  className="h-4 w-4"
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
              </span>
              <input
                type="text"
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">{t("discount.allCategories")}</option>
              <option value="regular">{t("room.regular")}</option>
              <option value="vip">{t("room.vip")}</option>
            </select>

            <select
              value={filterBedType}
              onChange={(e) => setFilterBedType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">{t("discount.allBedTypes")}</option>
              <option value="1">1 {t("room.beds")}</option>
              <option value="2">2 {t("room.beds")}</option>
              <option value="3">3 {t("room.beds")}</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">{t("discount.status")}</option>
              <option value="available">{t("room.available")}</option>
              <option value="occupied">{t("dashboard.occupiedRooms")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => {
            const isVip = room.category === "vip";

            // Theme classes
            const themeClasses = isVip
              ? room.isAvailable
                ? "bg-amber-50 border-amber-200 hover:border-amber-400"
                : "bg-amber-50 border-red-200 hover:border-red-400"
              : room.isAvailable
              ? "bg-white border-green-100 hover:border-green-300"
              : "bg-white border-red-100 hover:border-red-300";

            const numberColor = isVip
              ? "text-amber-700"
              : room.isAvailable
              ? "text-green-600"
              : "text-red-600";

            const badgeClasses = isVip
              ? "bg-amber-100 text-amber-700 border border-amber-200"
              : "bg-gray-100 text-gray-500";

            return (
              <div
                key={room._id}
                className={`relative flex flex-col p-6 rounded-2xl shadow-md border-2 transition-all cursor-default min-h-[340px] ${themeClasses}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-3xl font-black ${numberColor}`}>
                    {room.roomNumber}
                  </span>
                  <span
                    className={`text-xs uppercase font-black px-2 py-1 rounded ${badgeClasses}`}
                  >
                    {t(`room.${room.category}`)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-base text-gray-500 mb-6 font-bold">
                  <span>
                    {room.bedType} {t("room.beds")}
                  </span>
                  <span
                    className={`font-black text-xl ${
                      isVip ? "text-amber-600" : "text-blue-600"
                    }`}
                  >
                    {new Intl.NumberFormat("vi-VN").format(
                      room.isAvailable
                        ? room.price
                        : room.currentStayPrice || room.price
                    )}{" "}
                    VND
                  </span>
                </div>

                <div className="grow">
                  {room.isAvailable ? (
                    <div className="h-full flex items-center justify-center">
                      <p
                        className={`text-xl font-black italic ${
                          isVip ? "text-amber-500" : "text-green-500"
                        }`}
                      >
                        {t("room.available")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end gap-2">
                        <div className="overflow-hidden">
                          <p className="text-xs text-gray-400 uppercase font-black tracking-wider mb-1">
                            {t("room.customerName")}
                          </p>
                          <p
                            className="text-xl font-black text-gray-900 truncate"
                            title={room.customerName}
                          >
                            {room.customerName}
                          </p>
                          {room.identityCode && (
                            <p className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded inline-block mt-1">
                              ✓ {t("room.idReceived")}
                            </p>
                          )}
                        </div>
                        {room.deposit && room.deposit > 0 && (
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-amber-600 uppercase font-black tracking-wider mb-1">
                              {t("room.deposit")}
                            </p>
                            <p className="text-sm font-black text-amber-600">
                              {new Intl.NumberFormat("vi-VN").format(
                                room.deposit
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-end gap-2">
                        {room.identityCode && (
                          <div className="overflow-hidden">
                            <p className="text-xs text-gray-400 uppercase font-black tracking-wider mb-1">
                              {t("room.identityCode")}
                            </p>
                            <p className="text-base text-gray-600 font-bold truncate">
                              {room.identityCode}
                            </p>
                          </div>
                        )}
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400 uppercase font-black tracking-wider mb-1">
                            {t("room.checkIn")}
                          </p>
                          <p className="text-base text-gray-400 font-black">
                            {room.checkInTime
                              ? new Date(room.checkInTime).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  {room.isAvailable ? (
                    <button
                      onClick={() => handleCheckIn(room)}
                      className={`w-full text-white text-base font-black py-4 rounded-2xl transition-all shadow-lg shadow-gray-100 ${
                        isVip
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {t("room.checkIn")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckOutClick(room)}
                      className="w-full bg-red-600 text-white text-base font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                      {t("room.checkOut")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Check-in Modal */}
        {showCheckInModal && selectedRoom && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-sm shadow-lg rounded-xl bg-white max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {t("room.checkIn")} - {t("room.roomNumber")}{" "}
                {selectedRoom.roomNumber}
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.customerName")}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t("common.enterGuestName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.identityCode")}
                  </label>
                  <input
                    type="text"
                    value={identityCode}
                    onChange={(e) => setIdentityCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t("room.idPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.origin")}
                  </label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t("room.originPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.dailyPrice")} (VND)
                  </label>
                  <input
                    type="number"
                    value={dailyPrice}
                    onChange={(e) => setDailyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.deposit")} (VND)
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetCheckInFields}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={confirmCheckIn}
                  disabled={!customerName.trim()}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {t("room.checkIn")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Check-out Modal */}
        {showCheckOutModal && billingPreview && selectedRoom && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-2xl bg-white max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {t("room.checkOut")} - {t("room.roomNumber")}{" "}
                  {selectedRoom.roomNumber}
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                  {t(`room.${selectedRoom.category}`)}
                </span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="pb-4 border-b border-gray-100">
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("room.customerName")}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {billingPreview.customerName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {t("room.checkIn")}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatDateTime(billingPreview.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {t("room.checkOut")}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatDateTime(billingPreview.checkOut)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t("room.stayDuration")}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {billingPreview.calculation.breakdown.description
                        .replace("day(s)", t("room.dayUnit"))
                        .replace("hour(s)", t("room.hourUnit"))}
                    </span>
                  </div>

                  {billingPreview.calculation.breakdown.days > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {billingPreview.calculation.breakdown.days}{" "}
                        {t("room.dayUnit")}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {new Intl.NumberFormat("vi-VN").format(
                          billingPreview.calculation.breakdown.dailyPrice
                        )}{" "}
                        VND
                      </span>
                    </div>
                  )}

                  {billingPreview.calculation.breakdown.hours > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {billingPreview.calculation.breakdown.hours}{" "}
                        {t("room.hourUnit")}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {new Intl.NumberFormat("vi-VN").format(
                          billingPreview.calculation.breakdown.hourlyPrice
                        )}{" "}
                        VND
                      </span>
                    </div>
                  )}

                  {billingPreview.deposit > 0 && (
                    <div className="flex justify-between items-center text-sm p-2 bg-amber-50 rounded-lg border border-amber-100 mt-2">
                      <span className="text-amber-700 font-bold">
                        {t("room.deposit")}
                      </span>
                      <span className="text-amber-700 font-black">
                        -
                        {new Intl.NumberFormat("vi-VN").format(
                          billingPreview.deposit
                        )}{" "}
                        VND
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">
                      {t("room.totalAmount")}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat("vi-VN").format(
                        billingPreview.calculation.totalPrice
                      )}{" "}
                      VND
                    </span>
                  </div>

                  {billingPreview.deposit > 0 && (
                    <div className="flex justify-between items-center text-sm p-3 bg-blue-50 rounded-xl border border-blue-100 mt-2">
                      <span className="text-blue-700 font-bold">
                        {t("room.deposit")}
                      </span>
                      <span className="text-blue-700 font-black">
                        -
                        {new Intl.NumberFormat("vi-VN").format(
                          billingPreview.deposit
                        )}{" "}
                        VND
                      </span>
                    </div>
                  )}

                  <div className="pt-4 mt-2 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-black text-gray-900">
                      {billingPreview.calculation.totalPrice >=
                      billingPreview.deposit
                        ? t("room.amountToPay")
                        : t("room.amountToRefund")}
                    </span>
                    <span
                      className={`text-2xl font-black ${
                        billingPreview.calculation.totalPrice >=
                        billingPreview.deposit
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {new Intl.NumberFormat("vi-VN").format(
                        Math.abs(
                          billingPreview.calculation.totalPrice -
                            billingPreview.deposit
                        )
                      )}{" "}
                      VND
                    </span>
                  </div>
                </div>

                {selectedRoom.identityCode && (
                  <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <p className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      {t("room.returnIdentityCard")}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t("room.finalPrice")} (VND)
                  </label>
                  <input
                    type="number"
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(Number(e.target.value))}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-black ${
                      finalAmount >= 0
                        ? "text-red-700 border-red-100"
                        : "text-green-700 border-green-100"
                    }`}
                  />
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    {t("room.priceAdjustmentNote")}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckOutModal(false);
                    setBillingPreview(null);
                    setSelectedRoom(null);
                  }}
                  disabled={processingCheckOut}
                  className="flex-1 px-4 py-3 text-sm font-semibold border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={confirmCheckOut}
                  disabled={processingCheckOut}
                  className="flex-2 px-4 py-3 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg shadow-red-100"
                >
                  {processingCheckOut
                    ? t("common.loading")
                    : t("room.checkOut")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
