import HourlyPricing, { IHourlyPricing } from "@/models/HourlyPricing";
import connectDB from "@/lib/mongodb";

export interface PriceCalculationResult {
  totalPrice: number;
  breakdown: {
    days: number;
    hours: number;
    dailyPrice: number;
    hourlyPrice: number;
    description: string;
  };
}

/**
 * Helper to calculate hourly price with a daily cap
 */
function calculateHourlyPrice(
  hours: number,
  pricing: IHourlyPricing,
  dailyPrice: number
): number {
  if (hours <= 0) return 0;
  let price = 0;
  if (hours <= pricing.firstHours) {
    price = pricing.firstHoursPrice;
  } else {
    const additionalHours = hours - pricing.firstHours;
    price =
      pricing.firstHoursPrice + additionalHours * pricing.additionalHourPrice;
  }
  return Math.min(price, dailyPrice);
}

/**
 * Calculate price based on check-in and check-out times
 * Rules:
 * - First 2 hours: firstHoursPrice (e.g., 120,000 VND)
 * - Next hours: +additionalHourPrice per hour (e.g., +20,000 VND/hour) until reaching dailyPrice (e.g., 200,000 VND)
 * - If staying from morning to 12:00 PM next day = one day price (capped)
 * - After 12:00 PM of the next day, calculate hourly first, then daily
 */
export async function calculatePrice(
  category: "vip" | "regular",
  bedType: number | string,
  checkIn: Date,
  checkOut: Date,
  dailyPriceOverride?: number
): Promise<PriceCalculationResult> {
  await connectDB();

  // Ensure bedType is a number for the query
  const bedTypeNum = typeof bedType === "string" ? parseInt(bedType) : bedType;

  // Get hourly pricing rules
  const hourlyPricing = await HourlyPricing.findOne({
    category,
    bedType: bedTypeNum,
  });

  if (!hourlyPricing) {
    throw new Error(
      `Hourly pricing not found for ${category} bed type ${bedTypeNum}`
    );
  }

  const dailyPriceToUse = dailyPriceOverride || hourlyPricing.dailyPrice;
  const checkoutHour = parseInt(hourlyPricing.checkoutTime.split(":")[0]);
  const checkoutMinute = parseInt(hourlyPricing.checkoutTime.split(":")[1]);

  const checkInHour = checkIn.getHours();
  const checkInMinute = checkIn.getMinutes();
  const isMorningCheckIn =
    checkInHour < checkoutHour ||
    (checkInHour === checkoutHour && checkInMinute < checkoutMinute);

  let totalPrice = 0;
  let days = 0;
  let hours = 0;
  let dailyPriceTotal = 0;
  let hourlyPriceTotal = 0;
  let description = "";

  if (isMorningCheckIn) {
    const nextDayCheckout = new Date(checkIn);
    nextDayCheckout.setDate(nextDayCheckout.getDate() + 1);
    nextDayCheckout.setHours(checkoutHour, checkoutMinute, 0, 0);

    if (checkOut <= nextDayCheckout) {
      // Entire stay within the first "morning-to-next-day-12pm" block
      const totalHours = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      );
      const price = calculateHourlyPrice(
        totalHours,
        hourlyPricing,
        dailyPriceToUse
      );

      if (price >= dailyPriceToUse) {
        days = 1;
        hours = 0;
        dailyPriceTotal = dailyPriceToUse;
        hourlyPriceTotal = 0;
      } else {
        days = 0;
        hours = totalHours;
        dailyPriceTotal = 0;
        hourlyPriceTotal = price;
      }
      totalPrice = price;
    } else {
      // Stay exceeds the first 12:00 PM next day
      days = 1;
      dailyPriceTotal = dailyPriceToUse;

      const extraTime = checkOut.getTime() - nextDayCheckout.getTime();
      const extraHoursTotal = Math.ceil(extraTime / (1000 * 60 * 60));

      const extraFullDays = Math.floor(extraHoursTotal / 24);
      const remainingHours = extraHoursTotal % 24;

      const remainingHourlyPrice = calculateHourlyPrice(
        remainingHours,
        hourlyPricing,
        dailyPriceToUse
      );

      // If remaining hours cost as much as a day, convert to a full day
      if (remainingHourlyPrice >= dailyPriceToUse) {
        days += extraFullDays + 1;
        hours = 0;
        dailyPriceTotal = days * dailyPriceToUse;
        hourlyPriceTotal = 0;
      } else {
        days += extraFullDays;
        hours = remainingHours;
        dailyPriceTotal = days * dailyPriceToUse;
        hourlyPriceTotal = remainingHourlyPrice;
      }

      totalPrice = dailyPriceTotal + hourlyPriceTotal;
    }
  } else {
    // Check-in after checkout time (e.g. after 12:00 PM)
    const totalTime = checkOut.getTime() - checkIn.getTime();
    const totalHours = Math.ceil(totalTime / (1000 * 60 * 60));

    const fullDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    const remainingHourlyPrice = calculateHourlyPrice(
      remainingHours,
      hourlyPricing,
      dailyPriceToUse
    );

    if (remainingHourlyPrice >= dailyPriceToUse) {
      days = fullDays + 1;
      hours = 0;
      dailyPriceTotal = days * dailyPriceToUse;
      hourlyPriceTotal = 0;
    } else {
      days = fullDays;
      hours = remainingHours;
      dailyPriceTotal = days * dailyPriceToUse;
      hourlyPriceTotal = remainingHourlyPrice;
    }

    totalPrice = dailyPriceTotal + hourlyPriceTotal;
  }

  // Construct description
  if (days > 0 && hours > 0) {
    description = `${days} day(s) + ${hours} hour(s)`;
  } else if (days > 0) {
    description = `${days} day(s)`;
  } else if (hours > 0) {
    description = `${hours} hour(s)`;
  } else {
    description = "0 hours";
  }

  return {
    totalPrice,
    breakdown: {
      days,
      hours,
      dailyPrice: dailyPriceTotal,
      hourlyPrice: hourlyPriceTotal,
      description,
    },
  };
}
