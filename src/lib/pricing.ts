/**
 * Versatile pricing rules — the single source of truth.
 *
 *  - Prices shown are the final selling price (MRP strikethrough is cosmetic only).
 *  - Shipping: FREE on every order.
 *  - GST: 5%, INCLUSIVE in the selling price (nothing is added at checkout).
 *  - No handling fee. Returns: 7 days, no return charge.
 *
 * The server charges exactly the sum of (price × quantity); the figures below are only
 * for displaying "includes GST" to the customer.
 */
export const GST_PERCENT = 5;
export const RETURN_WINDOW_DAYS = 7;

/** GST already contained inside a GST-inclusive amount, rounded to paise. */
export const gstIncluded = (inclusiveAmount: number) =>
  Math.round(((inclusiveAmount * GST_PERCENT) / (100 + GST_PERCENT)) * 100) / 100;
