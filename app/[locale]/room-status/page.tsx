"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { showToast } from "@/lib/toast";

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
  phoneNumber?: string;
  numberOfPeople?: number;
  currentStayPrice?: number;
  deposit?: number;
  checkInTime?: string;
  extras?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface BillingPreview {
  roomNumber: string;
  customerName: string;
  phoneNumber?: string;
  numberOfPeople?: number;
  deposit: number;
  checkIn: string;
  checkOut: string;
  extras?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState<string>("1");
  const [dailyPrice, setDailyPrice] = useState<string>("");
  const [deposit, setDeposit] = useState<string>("0");

  // Check-out state
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [billingPreview, setBillingPreview] = useState<BillingPreview | null>(
    null
  );
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [isDebt, setIsDebt] = useState<boolean>(false);
  const [processingCheckOut, setProcessingCheckOut] = useState(false);

  // Update room state
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Cancel room state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [processingCancel, setProcessingCancel] = useState(false);

  // Highlight state for recently checked-in room
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(
    null
  );

  // Extras state for check-in/update
  const [extras, setExtras] = useState<
    Array<{ name: string; quantity: number; price: number }>
  >([]);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraQuantity, setNewExtraQuantity] = useState<string>("1");
  const [newExtraPrice, setNewExtraPrice] = useState<string>("");

  // Extras options state
  const [extrasOptions, setExtrasOptions] = useState<
    Array<{ _id: string; name: string; price: number }>
  >([]);
  const [showExtrasDropdown, setShowExtrasDropdown] = useState(false);
  const [extrasSearchQuery, setExtrasSearchQuery] = useState("");
  const extrasDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRooms();
    fetchExtrasOptions();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        extrasDropdownRef.current &&
        !extrasDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExtrasDropdown(false);
      }
    };

    if (showExtrasDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExtrasDropdown]);

  const fetchExtrasOptions = async () => {
    try {
      const response = await fetch("/api/extras-options");
      const result = await response.json();
      if (result.success) {
        setExtrasOptions(result.data);
      }
    } catch (error) {
      console.error("Error fetching extras options:", error);
    }
  };

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
    setPhoneNumber("");
    setNumberOfPeople("1");
    setDeposit("0");
    setExtras([]);
    setNewExtraName("");
    setNewExtraQuantity("1");
    setNewExtraPrice("");
    setExtrasSearchQuery("");
    setShowExtrasDropdown(false);

    try {
      const res = await fetch("/api/hourly-pricing");
      const data = await res.json();
      if (data.success) {
        const rule = data.data.find(
          (r: any) => r.category === room.category && r.bedType === room.bedType
        );
        setDailyPrice(
          rule ? rule.dailyPrice.toString() : room.price.toString()
        );
      } else {
        setDailyPrice(room.price.toString());
      }
    } catch (err) {
      setDailyPrice(room.price.toString());
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
          phoneNumber:
            phoneNumber && phoneNumber.trim() !== ""
              ? phoneNumber.trim()
              : undefined,
          numberOfPeople: numberOfPeople ? Number(numberOfPeople) : 1,
          dailyPrice: dailyPrice ? Number(dailyPrice) : 0,
          deposit: deposit ? Number(deposit) : 0,
          extras: extras.length > 0 ? extras : undefined,
        }),
      });
      const result = await response.json();
      if (result.success) {
        // Show success message
        showToast.success(
          t("room.checkInSuccess", { roomNumber: selectedRoom.roomNumber })
        );

        // Highlight the checked-in room
        if (selectedRoom._id) {
          setHighlightedRoomId(selectedRoom._id);
          // Remove highlight after 5 seconds
          setTimeout(() => {
            setHighlightedRoomId(null);
          }, 5000);
        }

        fetchRooms();
        setShowCheckInModal(false);
        resetCheckInFields();
      } else {
        showToast.error(result.error);
      }
    } catch (error) {
      console.error("Error in check-in:", error);
    }
  };

  const resetCheckInFields = () => {
    setCustomerName("");
    setIdentityCode("");
    setOrigin("");
    setPhoneNumber("");
    setNumberOfPeople("1");
    setDailyPrice("");
    setDeposit("0");
    setSelectedRoom(null);
  };

  const handleCheckOutClick = async (room: Room) => {
    setSelectedRoom(room);
    // Reset debt checkbox state every time checkout modal opens
    setIsDebt(false);
    try {
      const response = await fetch(`/api/rooms/${room._id}/check-out/preview`);
      const result = await response.json();
      console.log(result);
      if (result.success) {
        setBillingPreview(result.data);
        // finalAmount is the amount collected at checkout (total - deposit)
        // The total amount to charge is: room price + extras
        const previewExtras = result.data.extras || room.extras || [];
        const extrasTotal = previewExtras.reduce(
          (
            sum: number,
            extra: { name: string; quantity: number; price: number }
          ) => sum + extra.quantity * extra.price,
          0
        );
        const totalAmount = result.data.calculation.totalPrice + extrasTotal;
        const deposit = result.data.deposit || 0;
        setFinalAmount(totalAmount - deposit);
        setShowCheckOutModal(true);
      } else {
        showToast.error(result.error);
      }
    } catch (error) {
      console.error("Error fetching billing preview:", error);
    }
  };

  const addExtra = () => {
    if (!newExtraName.trim() || !newExtraPrice || Number(newExtraPrice) <= 0) {
      return;
    }
    const quantity = Number(newExtraQuantity) || 1;
    const price = Number(newExtraPrice);
    setExtras([
      ...extras,
      {
        name: newExtraName.trim(),
        quantity,
        price,
      },
    ]);
    setNewExtraName("");
    setNewExtraQuantity("1");
    setNewExtraPrice("");
    setExtrasSearchQuery("");
    setShowExtrasDropdown(false);
  };

  const selectExtrasOption = (option: { name: string; price: number }) => {
    setNewExtraName(option.name);
    setNewExtraPrice(option.price.toString());
    setExtrasSearchQuery(option.name);
    setShowExtrasDropdown(false);
  };

  const filteredExtrasOptions = extrasOptions.filter((option) =>
    option.name.toLowerCase().includes(extrasSearchQuery.toLowerCase())
  );

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  const getExtrasTotal = () => {
    return extras.reduce((sum, extra) => sum + extra.quantity * extra.price, 0);
  };

  const confirmCheckOut = async () => {
    if (!selectedRoom) return;
    setProcessingCheckOut(true);
    try {
      // finalAmount is the amount collected at checkout (after deposit)
      const roomExtras = selectedRoom.extras || [];
      const depositAmount = billingPreview?.deposit || 0;
      const subtotalWithExtras =
        (billingPreview?.calculation.totalPrice || 0) +
        (billingPreview?.extras || selectedRoom.extras || []).reduce(
          (sum, extra) => sum + extra.quantity * extra.price,
          0
        );
      const netToPay = subtotalWithExtras - depositAmount;

      // Total bill we send to API is handled there; here we send what is paid now
      const paidNow = finalAmount;
      const remainingDebt = Math.max(netToPay - paidNow, 0);

      const response = await fetch(`/api/rooms/${selectedRoom._id}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalAmount: paidNow,
          isDebt,
          debtRemaining: isDebt ? remainingDebt : 0,
          extras: roomExtras.length > 0 ? roomExtras : undefined,
        }),
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
          amount: new Intl.NumberFormat("vi-VN").format(
            Math.max(finalAmount, 0)
          ),
        });
        showToast.success(successMsg);
      } else {
        showToast.error(result.error);
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

  const handleUpdateClick = async (room: Room) => {
    setSelectedRoom(room);
    setCustomerName(room.customerName || "");
    setIdentityCode(room.identityCode || "");
    setOrigin(room.origin || "");
    setPhoneNumber(room.phoneNumber || "");
    setNumberOfPeople(room.numberOfPeople?.toString() || "1");
    setDailyPrice(room.currentStayPrice?.toString() || "");
    setDeposit(room.deposit?.toString() || "0");
    setExtras(room.extras || []);
    setNewExtraName("");
    setNewExtraQuantity("1");
    setNewExtraPrice("");
    setExtrasSearchQuery("");
    setShowExtrasDropdown(false);
    setShowUpdateModal(true);
  };

  const confirmUpdate = async () => {
    if (!selectedRoom) return;
    try {
      const response = await fetch(`/api/rooms/${selectedRoom._id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          identityCode,
          origin,
          phoneNumber:
            phoneNumber && phoneNumber.trim() !== ""
              ? phoneNumber.trim()
              : undefined,
          numberOfPeople: numberOfPeople ? Number(numberOfPeople) : 1,
          dailyPrice: dailyPrice ? Number(dailyPrice) : 0,
          deposit: deposit ? Number(deposit) : 0,
          extras: extras.length > 0 ? extras : undefined,
        }),
      });
      const result = await response.json();
      if (result.success) {
        fetchRooms();
        setShowUpdateModal(false);
        resetCheckInFields();
        showToast.success(t("room.updateSuccess"));
      } else {
        showToast.error(result.error);
      }
    } catch (error) {
      console.error("Error updating room:", error);
      showToast.error(t("common.error"));
    }
  };

  const handleCancelClick = (room: Room) => {
    setSelectedRoom(room);
    setCancellationReason("");
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedRoom) return;
    setProcessingCancel(true);
    try {
      const response = await fetch(`/api/rooms/${selectedRoom._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancellationReason || undefined,
        }),
      });
      const result = await response.json();
      if (result.success) {
        fetchRooms();
        setShowCancelModal(false);
        setCancellationReason("");
        showToast.success(t("room.cancelSuccess"));
      } else {
        showToast.error(result.error);
      }
    } catch (error) {
      console.error("Error cancelling room:", error);
      showToast.error(t("common.error"));
    } finally {
      setProcessingCancel(false);
    }
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
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {t("room.cardView")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`ml-1 px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {t("room.tableView")}
              </button>
            </div>

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

        {viewMode === "grid" ? (
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

              const isHighlighted = highlightedRoomId === room._id;

              return (
                <div
                  key={room._id}
                  className={`relative flex flex-col p-6 rounded-2xl shadow-md border-2 transition-all cursor-default min-h-[340px] ${themeClasses} ${
                    isHighlighted
                      ? "ring-4 ring-green-500 ring-offset-2 animate-pulse"
                      : ""
                  }`}
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
                          {room.deposit && room.deposit > 0 ? (
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
                          ) : null}
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
                      <div className="space-y-2">
                        <button
                          onClick={() => handleCheckOutClick(room)}
                          className="w-full bg-red-600 text-white text-base font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                        >
                          {t("room.checkOut")}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateClick(room)}
                            className="bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-all"
                          >
                            {t("room.update")}
                          </button>
                          <button
                            onClick={() => handleCancelClick(room)}
                            className="bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-orange-700 transition-all"
                          >
                            {t("room.cancel")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.roomNumber")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.category")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.bedType")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.availability")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.customerName")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.identityCode")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.phoneNumber")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.checkIn")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.extras")}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.price")}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("room.deposit")}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRooms.map((room) => {
                    const extrasList = room.extras || [];
                    const extrasTotal = extrasList.reduce(
                      (sum, e) => sum + e.quantity * e.price,
                      0
                    );

                    return (
                      <tr key={room._id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {room.roomNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {t(`room.${room.category}`)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {room.bedType} {t("room.beds")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              room.isAvailable
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {room.isAvailable
                              ? t("room.available")
                              : t("room.unavailable")}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {room.customerName || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {room.identityCode || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {room.phoneNumber || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {room.checkInTime
                            ? formatDateTime(room.checkInTime)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {extrasList.length > 0 ? (
                            <div className="max-w-xs space-y-0.5">
                              {extrasList.slice(0, 3).map((extra, idx) => (
                                <div
                                  key={`${extra.name}-${idx}`}
                                  className="flex justify-between gap-2 text-xs"
                                >
                                  <span className="text-gray-700 truncate">
                                    {extra.name} x{extra.quantity}
                                  </span>
                                  <span className="text-gray-900 font-medium whitespace-nowrap">
                                    {new Intl.NumberFormat("vi-VN").format(
                                      extra.quantity * extra.price
                                    )}{" "}
                                    VND
                                  </span>
                                </div>
                              ))}
                              {extrasList.length > 3 && (
                                <div className="text-[10px] text-gray-400">
                                  + {extrasList.length - 3}{" "}
                                  {t("room.extras").toLowerCase()}
                                </div>
                              )}
                              <div className="pt-1 text-[11px] text-gray-600 border-t border-gray-100 flex justify-between">
                                <span>{t("room.extrasTotal")}</span>
                                <span className="font-semibold">
                                  {new Intl.NumberFormat("vi-VN").format(
                                    extrasTotal
                                  )}{" "}
                                  VND
                                </span>
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                          {new Intl.NumberFormat("vi-VN").format(
                            room.isAvailable
                              ? room.price
                              : room.currentStayPrice || room.price
                          )}{" "}
                          VND
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                          {room.deposit
                            ? `${new Intl.NumberFormat("vi-VN").format(
                                room.deposit
                              )} VND`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right space-x-2">
                          {room.isAvailable ? (
                            <button
                              onClick={() => handleCheckIn(room)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700"
                            >
                              {t("room.checkIn")}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCheckOutClick(room)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
                              >
                                {t("room.checkOut")}
                              </button>
                              <button
                                onClick={() => handleUpdateClick(room)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                {t("room.update")}
                              </button>
                              <button
                                onClick={() => handleCancelClick(room)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                              >
                                {t("room.cancel")}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Check-in Modal */}
        {showCheckInModal && selectedRoom && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white max-h-[90vh] overflow-y-auto">
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
                    {t("room.phoneNumber")} ({t("discount.optional")})
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t("room.phoneNumberPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.numberOfPeople")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={numberOfPeople}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || Number(value) >= 1) {
                        setNumberOfPeople(value);
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || Number(e.target.value) < 1) {
                        setNumberOfPeople("1");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.dailyPrice")} (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dailyPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || Number(value) >= 0) {
                        setDailyPrice(value);
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || Number(e.target.value) < 0) {
                        setDailyPrice("");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.deposit")} (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deposit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || Number(value) >= 0) {
                        setDeposit(value);
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || Number(e.target.value) < 0) {
                        setDeposit("0");
                      }
                    }}
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
            <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-2xl bg-white max-h-[95vh] overflow-y-auto">
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
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("room.phoneNumber")}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {billingPreview.phoneNumber ||
                        selectedRoom.phoneNumber ||
                        "-"}
                    </p>
                  </div>
                  {(billingPreview.numberOfPeople ||
                    selectedRoom.numberOfPeople) &&
                    (billingPreview.numberOfPeople ||
                      selectedRoom.numberOfPeople ||
                      0) > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">
                          {t("room.numberOfPeople")}
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {billingPreview.numberOfPeople ||
                            selectedRoom.numberOfPeople}
                        </p>
                      </div>
                    )}
                </div>

                {/* Price Breakdown Section */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    {t("room.priceBreakdown")}
                  </h4>

                  {/* Room Price Breakdown */}
                  <div className="space-y-2">
                    {billingPreview.calculation.breakdown.days > 0 && (
                      <div className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-gray-700">
                          {billingPreview.calculation.breakdown.days}{" "}
                          {t("room.dayUnit")} ×{" "}
                          {new Intl.NumberFormat("vi-VN").format(
                            Math.round(
                              billingPreview.calculation.breakdown.dailyPrice /
                                billingPreview.calculation.breakdown.days
                            )
                          )}{" "}
                          VND/{t("room.dayUnit")}
                        </span>
                        <span className="text-gray-900 font-semibold">
                          ={" "}
                          {new Intl.NumberFormat("vi-VN").format(
                            billingPreview.calculation.breakdown.dailyPrice
                          )}{" "}
                          VND
                        </span>
                      </div>
                    )}

                    {billingPreview.calculation.breakdown.hours > 0 && (
                      <div className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-gray-700">
                          {billingPreview.calculation.breakdown.hours}{" "}
                          {t("room.hourUnit")} ({t("room.hourlyRate")})
                        </span>
                        <span className="text-gray-900 font-semibold">
                          ={" "}
                          {new Intl.NumberFormat("vi-VN").format(
                            billingPreview.calculation.breakdown.hourlyPrice
                          )}{" "}
                          VND
                        </span>
                      </div>
                    )}

                    {/* Room Subtotal */}
                    <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-gray-300">
                      <span className="text-gray-700">
                        {t("room.roomPrice")}
                      </span>
                      <span className="text-gray-900">
                        {new Intl.NumberFormat("vi-VN").format(
                          billingPreview.calculation.totalPrice
                        )}{" "}
                        VND
                      </span>
                    </div>
                  </div>

                  {/* Extras Breakdown */}
                  {(billingPreview.extras || selectedRoom.extras || []).length >
                    0 && (
                    <div className="pt-3 border-t border-gray-300 space-y-2">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">
                        {t("room.extras")}
                      </p>
                      {(billingPreview.extras || selectedRoom.extras || []).map(
                        (extra, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm bg-white p-2 rounded-lg"
                          >
                            <span className="text-gray-600">
                              {extra.name} × {extra.quantity} @{" "}
                              {new Intl.NumberFormat("vi-VN").format(
                                extra.price
                              )}{" "}
                              VND
                            </span>
                            <span className="text-gray-900 font-semibold">
                              {new Intl.NumberFormat("vi-VN").format(
                                extra.quantity * extra.price
                              )}{" "}
                              VND
                            </span>
                          </div>
                        )
                      )}
                      <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-gray-300">
                        <span className="text-gray-700">
                          {t("room.extrasTotal")}
                        </span>
                        <span className="text-gray-900">
                          {new Intl.NumberFormat("vi-VN").format(
                            (
                              billingPreview.extras ||
                              selectedRoom.extras ||
                              []
                            ).reduce(
                              (sum, extra) =>
                                sum + extra.quantity * extra.price,
                              0
                            )
                          )}{" "}
                          VND
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Subtotal (Room + Extras) */}
                  <div className="pt-3 border-t-2 border-gray-400 flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">
                      {t("room.subtotal")}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat("vi-VN").format(
                        billingPreview.calculation.totalPrice +
                          (
                            billingPreview.extras ||
                            selectedRoom.extras ||
                            []
                          ).reduce(
                            (sum, extra) => sum + extra.quantity * extra.price,
                            0
                          )
                      )}{" "}
                      VND
                    </span>
                  </div>

                  {/* Deposit Deduction */}
                  {billingPreview.deposit > 0 && (
                    <div className="flex justify-between items-center text-sm p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-amber-700 font-bold">
                        {t("room.deposit")} ({t("room.alreadyPaid")})
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

                  {/* Final Amount */}
                  <div className="pt-3 mt-2 border-t-2 border-dashed border-gray-400 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black text-gray-900">
                        {finalAmount >= 0
                          ? t("room.amountToPay")
                          : t("room.amountToRefund")}
                      </span>
                      <span
                        className={`text-2xl font-black ${
                          finalAmount >= 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {new Intl.NumberFormat("vi-VN").format(
                          Math.abs(finalAmount)
                        )}{" "}
                        VND
                      </span>
                    </div>

                    {finalAmount > 0 &&
                      (() => {
                        // Calculate if there's actually remaining debt
                        const subtotalWithExtras =
                          (billingPreview?.calculation.totalPrice || 0) +
                          (
                            billingPreview?.extras ||
                            selectedRoom.extras ||
                            []
                          ).reduce(
                            (sum, extra) => sum + extra.quantity * extra.price,
                            0
                          );
                        const depositAmount = billingPreview?.deposit || 0;
                        const netToPay = subtotalWithExtras - depositAmount;
                        const hasRemainingDebt = finalAmount < netToPay;

                        return (
                          <div className="flex items-start gap-2 pt-2 border-t border-gray-300">
                            <input
                              id="debtCheckbox"
                              type="checkbox"
                              checked={isDebt}
                              onChange={(e) => {
                                // Only allow checking if there's remaining debt
                                if (e.target.checked && !hasRemainingDebt) {
                                  showToast.error(
                                    t("room.debtErrorFullAmount") ||
                                      "Cannot mark as debt if full amount is paid"
                                  );
                                  return;
                                }
                                setIsDebt(e.target.checked);
                              }}
                              disabled={!hasRemainingDebt}
                              className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div>
                              <label
                                htmlFor="debtCheckbox"
                                className={`text-sm font-semibold ${
                                  hasRemainingDebt
                                    ? "text-gray-800"
                                    : "text-gray-400"
                                }`}
                              >
                                {t("room.debtCheckbox")}
                              </label>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {hasRemainingDebt
                                  ? t("room.debtNote")
                                  : t("room.debtNoteFullAmount") ||
                                    "Enter less than the full amount to mark as debt"}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
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
                    onChange={(e) => {
                      setFinalAmount(Number(e.target.value));
                    }}
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

        {/* Update Room Modal */}
        {showUpdateModal && selectedRoom && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {t("room.update")} - {t("room.roomNumber")}{" "}
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.phoneNumber")}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t("room.phoneNumberPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.numberOfPeople")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={numberOfPeople}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || Number(value) >= 1) {
                        setNumberOfPeople(value);
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || Number(e.target.value) < 1) {
                        setNumberOfPeople("1");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.dailyPrice")} (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dailyPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || Number(value) >= 0) {
                        setDailyPrice(value);
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || Number(e.target.value) < 0) {
                        setDailyPrice("");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.deposit")} (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deposit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || Number(value) >= 0) {
                        setDeposit(value);
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || Number(e.target.value) < 0) {
                        setDeposit("0");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0"
                  />
                </div>

                {/* Add Extras Section */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">
                    {t("room.addExtras")}
                  </h4>
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <div
                      className="col-span-5 relative"
                      ref={extrasDropdownRef}
                    >
                      <input
                        type="text"
                        placeholder={t("room.extraNamePlaceholder")}
                        value={extrasSearchQuery}
                        onChange={(e) => {
                          setExtrasSearchQuery(e.target.value);
                          setNewExtraName(e.target.value);
                          setShowExtrasDropdown(true);
                        }}
                        onFocus={() => setShowExtrasDropdown(true)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (
                              filteredExtrasOptions.length > 0 &&
                              showExtrasDropdown
                            ) {
                              selectExtrasOption(filteredExtrasOptions[0]);
                            } else {
                              addExtra();
                            }
                          } else if (e.key === "Escape") {
                            setShowExtrasDropdown(false);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      {showExtrasDropdown &&
                        filteredExtrasOptions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredExtrasOptions.map((option) => (
                              <button
                                key={option._id}
                                type="button"
                                onClick={() => selectExtrasOption(option)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm"
                              >
                                <div className="font-medium text-gray-900">
                                  {option.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Intl.NumberFormat("vi-VN").format(
                                    option.price
                                  )}{" "}
                                  VND
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      placeholder={t("room.quantity")}
                      value={newExtraQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || Number(value) >= 1) {
                          setNewExtraQuantity(value);
                        }
                      }}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder={t("room.price")}
                      value={newExtraPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || Number(value) >= 0) {
                          setNewExtraPrice(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addExtra();
                        }
                      }}
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addExtra}
                      className="col-span-2 px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                    >
                      {t("common.add")}
                    </button>
                  </div>
                  {extras.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {extras.map((extra, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                        >
                          <span className="text-gray-700">
                            {extra.name} x{extra.quantity}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">
                              {new Intl.NumberFormat("vi-VN").format(
                                extra.quantity * extra.price
                              )}{" "}
                              VND
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExtra(index)}
                              className="text-red-500 hover:text-red-700 text-lg font-bold w-6 h-6 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    resetCheckInFields();
                  }}
                  className="flex-1 px-4 py-3 text-sm font-bold bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={confirmUpdate}
                  className="flex-1 px-4 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  {t("room.update")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Room Modal */}
        {showCancelModal && selectedRoom && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-xl shadow-lg rounded-xl bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {t("room.cancel")} - {t("room.roomNumber")}{" "}
                {selectedRoom.roomNumber}
              </h3>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  {t("room.cancelConfirmation")}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("room.cancellationReason")} ({t("discount.optional")})
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    rows={3}
                    placeholder={t("room.cancellationReasonPlaceholder")}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason("");
                  }}
                  className="flex-1 px-4 py-3 text-sm font-bold bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={processingCancel}
                  className="flex-1 px-4 py-3 text-sm font-bold bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processingCancel
                    ? t("common.loading")
                    : t("room.confirmCancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
