export type AddressFields = {
  address?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: number | string | null;
};

export function hasSavedAddress(fields: AddressFields) {
  return Boolean(
    fields.address?.trim() &&
      fields.city?.trim() &&
      fields.state?.trim() &&
      String(fields.zip ?? "").trim(),
  );
}

export function formatAddressLines(fields: AddressFields): string[] {
  const lines: string[] = [];
  if (fields.address?.trim()) lines.push(fields.address.trim());
  if (fields.landmark?.trim()) lines.push(fields.landmark.trim());

  const cityState = [fields.city?.trim(), fields.state?.trim()]
    .filter(Boolean)
    .join(", ");
  const pin = String(fields.zip ?? "").trim();
  const locality = [cityState, pin].filter(Boolean).join(" — ");
  if (locality) lines.push(locality);

  if (lines.length) lines.push("India");
  return lines;
}

export function formatAddressOneLine(fields: AddressFields) {
  return formatAddressLines(fields)
    .filter((line) => line !== "India")
    .join(", ");
}
