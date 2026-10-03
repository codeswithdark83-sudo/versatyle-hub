// Customers may cancel only until the order is shipped.
export const CANCELLABLE_STAGES = ["pending", "confirmed", "packed"] as const;

export function canCancelOrder(order: {
  status: string;
  fulfillment_status?: string | null;
  payment_method?: string | null;
}): boolean {
  const stage = order.fulfillment_status ?? "pending";
  if (!(CANCELLABLE_STAGES as readonly string[]).includes(stage)) return false;
  // Cash on delivery: any order not yet shipped. Online: only once payment is captured.
  if (order.payment_method === "cod") return order.status !== "failed" && order.status !== "refunded";
  return order.status === "paid";
}
