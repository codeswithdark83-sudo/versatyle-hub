const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

/** 1234.5 -> "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only" (Indian grouping). */
export function rupeesInWords(amount: number): string {
  const total = Math.round(amount * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  const groups: [number, string][] = [
    [Math.floor(rupees / 10000000), "Crore"],
    [Math.floor((rupees % 10000000) / 100000), "Lakh"],
    [Math.floor((rupees % 100000) / 1000), "Thousand"],
  ];
  const parts = groups.filter(([n]) => n > 0).map(([n, label]) => `${below1000(n)} ${label}`);
  const rest = rupees % 1000;
  if (rest > 0) parts.push(below1000(rest));
  let words = parts.join(" ") || "Zero";
  words = `Rupees ${words}`;
  if (paise > 0) words += ` and ${below1000(paise)} Paise`;
  return `${words} Only`;
}
