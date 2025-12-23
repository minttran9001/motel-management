import api from "./api";

// Types
export interface Room {
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

export interface HourlyPricing {
  _id: string;
  category: "vip" | "regular";
  bedType: number;
  firstHours: number;
  firstHoursPrice: number;
  additionalHourPrice: number;
  dailyPrice: number;
  checkoutTime: string;
}

export interface ExtrasOption {
  _id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Discount {
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

export interface Transaction {
  _id: string;
  roomNumber: string;
  customerName: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  paidAmount?: number;
  debtRemaining?: number;
  isDebt?: boolean;
  createdAt: string;
}

export interface Expense {
  _id: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  title: string;
}

export interface RevenueData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface BillingPreview {
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

// API Client Functions
export const apiClient = {
  // Rooms
  rooms: {
    getAll: () => api.get<{ success: boolean; data: Room[] }>("/rooms"),
    getById: (id: string) =>
      api.get<{ success: boolean; data: Room }>(`/rooms/${id}`),
    create: (data: Partial<Room>) =>
      api.post<{ success: boolean; data: Room }>("/rooms", data),
    update: (id: string, data: Partial<Room>) =>
      api.put<{ success: boolean; data: Room }>(`/rooms/${id}`, data),
    delete: (id: string) => api.delete<{ success: boolean }>(`/rooms/${id}`),
    checkIn: (
      id: string,
      data: {
        customerName: string;
        identityCode?: string;
        origin?: string;
        phoneNumber?: string;
        numberOfPeople?: number;
        dailyPrice?: number;
        deposit?: number;
        extras?: Array<{ name: string; quantity: number; price: number }>;
      }
    ) =>
      api.post<{ success: boolean; data: Room }>(`/rooms/${id}/check-in`, data),
    checkOutPreview: (id: string) =>
      api.get<{ success: boolean; data: BillingPreview }>(
        `/rooms/${id}/check-out/preview`
      ),
    checkOut: (
      id: string,
      data: {
        finalAmount: number;
        isDebt?: boolean;
        debtRemaining?: number;
        extras?: Array<{ name: string; quantity: number; price: number }>;
      }
    ) =>
      api.post<{ success: boolean; data: Room }>(
        `/rooms/${id}/check-out`,
        data
      ),
    updateRoom: (
      id: string,
      data: {
        customerName?: string;
        identityCode?: string;
        origin?: string;
        phoneNumber?: string;
        numberOfPeople?: number;
        dailyPrice?: number;
        deposit?: number;
        extras?: Array<{ name: string; quantity: number; price: number }>;
      }
    ) => api.put<{ success: boolean; data: Room }>(`/rooms/${id}/update`, data),
    cancel: (id: string, data?: { reason?: string }) =>
      api.post<{ success: boolean; data: Room }>(`/rooms/${id}/cancel`, data),
    bulkCheckIn: (data: { roomIds: string[]; customerName: string }) =>
      api.post<{ success: boolean; data: Room[] }>(
        "/rooms/bulk-check-in",
        data
      ),
    bulkCheckOut: (data: { roomIds: string[] }) =>
      api.post<{ success: boolean; data: Room[] }>(
        "/rooms/bulk-check-out",
        data
      ),
    analytics: (params?: { startDate?: string; endDate?: string }) =>
      api.get<{ success: boolean; data: any[] }>("/rooms/analytics", {
        params,
      }),
  },

  // Hourly Pricing
  hourlyPricing: {
    getAll: () =>
      api.get<{ success: boolean; data: HourlyPricing[] }>("/hourly-pricing"),
    getById: (id: string) =>
      api.get<{ success: boolean; data: HourlyPricing }>(
        `/hourly-pricing/${id}`
      ),
    create: (data: Partial<HourlyPricing>) =>
      api.post<{ success: boolean; data: HourlyPricing }>(
        "/hourly-pricing",
        data
      ),
    update: (id: string, data: Partial<HourlyPricing>) =>
      api.put<{ success: boolean; data: HourlyPricing }>(
        `/hourly-pricing/${id}`,
        data
      ),
    delete: (id: string) =>
      api.delete<{ success: boolean }>(`/hourly-pricing/${id}`),
  },

  // Extras Options
  extrasOptions: {
    getAll: () =>
      api.get<{ success: boolean; data: ExtrasOption[] }>("/extras-options"),
    getById: (id: string) =>
      api.get<{ success: boolean; data: ExtrasOption }>(
        `/extras-options/${id}`
      ),
    create: (data: { name: string; price: number }) =>
      api.post<{ success: boolean; data: ExtrasOption }>(
        "/extras-options",
        data
      ),
    update: (id: string, data: { name: string; price: number }) =>
      api.put<{ success: boolean; data: ExtrasOption }>(
        `/extras-options/${id}`,
        data
      ),
    delete: (id: string) =>
      api.delete<{ success: boolean }>(`/extras-options/${id}`),
    toggleActive: (id: string) =>
      api.patch<{ success: boolean; data: ExtrasOption }>(
        `/extras-options/${id}/toggle`
      ),
    analytics: (params?: { startDate?: string; endDate?: string }) =>
      api.get<{ success: boolean; data: any[] }>("/extras-options/analytics", {
        params,
      }),
  },

  // Discounts
  discounts: {
    getAll: () => api.get<{ success: boolean; data: Discount[] }>("/discounts"),
    getById: (id: string) =>
      api.get<{ success: boolean; data: Discount }>(`/discounts/${id}`),
    create: (data: Partial<Discount>) =>
      api.post<{ success: boolean; data: Discount }>("/discounts", data),
    update: (id: string, data: Partial<Discount>) =>
      api.put<{ success: boolean; data: Discount }>(`/discounts/${id}`, data),
    delete: (id: string) =>
      api.delete<{ success: boolean }>(`/discounts/${id}`),
  },

  // Transactions
  transactions: {
    getAll: (params?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      debtsOnly?: boolean;
    }) =>
      api.get<{ success: boolean; data: Transaction[] }>("/transactions", {
        params,
      }),
    getById: (id: string) =>
      api.get<{ success: boolean; data: Transaction }>(`/transactions/${id}`),
    settle: (id: string, data?: { paidAmount?: number }) =>
      api.patch<{ success: boolean; data: Transaction }>(
        `/transactions/${id}/settle`,
        data
      ),
  },

  // Revenue
  revenue: {
    get: (params?: { period?: string; date?: string }) =>
      api.get<{ success: boolean; data: RevenueData }>("/revenue", { params }),
    create: (data: { amount: number; date: string; description?: string }) =>
      api.post<{ success: boolean; data: any }>("/revenue", data),
    monthlyAnalytics: (params?: { year?: number }) =>
      api.get<{ success: boolean; data: any[] }>("/revenue/monthly-analytics", {
        params,
      }),
  },

  // Expenses
  expenses: {
    getAll: (params?: { startDate?: string; endDate?: string }) =>
      api.get<{ success: boolean; data: Expense[] }>("/expenses", { params }),
    getById: (id: string) =>
      api.get<{ success: boolean; data: Expense }>(`/expenses/${id}`),
    create: (data: Partial<Expense>) =>
      api.post<{ success: boolean; data: Expense }>("/expenses", data),
    update: (id: string, data: Partial<Expense>) =>
      api.put<{ success: boolean; data: Expense }>(`/expenses/${id}`, data),
    delete: (id: string) => api.delete<{ success: boolean }>(`/expenses/${id}`),
  },

  // Price Calculator
  calculatePrice: {
    calculate: (data: {
      category: "vip" | "regular";
      bedType: number;
      checkIn: string;
      checkOut: string;
    }) => api.post<{ success: boolean; data: any }>("/calculate-price", data),
  },
};

export default apiClient;
