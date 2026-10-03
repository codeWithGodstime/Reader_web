export function dollars(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value);
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function cents(value: string) {
  const [whole, fraction = "00"] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

export function fromCents(value: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}
