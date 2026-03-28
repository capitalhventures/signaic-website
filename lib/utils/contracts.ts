/**
 * Clean a raw contract title by stripping PIID patterns and formatting.
 * PIID patterns look like: "200112!00010819700!ZD60 !BALLISTIC MISSILE DE..."
 */
export function cleanContractTitle(
  title: string | null,
  description: string | null
): string {
  // If we have a clean description, prefer it
  if (description && !isPiidString(description)) {
    return toTitleCase(description);
  }

  if (!title) {
    return "Untitled Contract";
  }

  // If the title doesn't look like a PIID, return as-is (possibly title-cased)
  if (!isPiidString(title)) {
    return isAllUpperCase(title) ? toTitleCase(title) : title;
  }

  // Try to extract readable text after PIID segments
  // Split on "!" and find segments that contain mostly letters/spaces
  const segments = title.split("!");
  const readableSegments = segments.filter((seg) => {
    const cleaned = seg.trim();
    if (!cleaned) return false;
    // Skip segments that are mostly numbers/codes (more than half digits)
    const digitCount = (cleaned.match(/\d/g) || []).length;
    return digitCount < cleaned.length / 2 && cleaned.length > 2;
  });

  if (readableSegments.length > 0) {
    const readable = readableSegments
      .map((s) => s.trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (readable.length > 3) {
      return toTitleCase(readable);
    }
  }

  // Fallback: "Contract [first 12 chars of PIID]"
  return `Contract ${title.slice(0, 12).replace(/!+$/, "")}`;
}

function isPiidString(str: string): boolean {
  // Starts with a digit and contains "!"
  return /^\d/.test(str) && str.includes("!");
}

function isAllUpperCase(str: string): boolean {
  const letters = str.replace(/[^a-zA-Z]/g, "");
  return letters.length > 0 && letters === letters.toUpperCase();
}

function toTitleCase(str: string): string {
  // Only title-case if the string is all uppercase
  if (!isAllUpperCase(str)) return str;
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(And|Or|The|In|Of|For|A|An|To|At|By|On|With)\b/g, (m) =>
      m.toLowerCase()
    )
    // Capitalize first word always
    .replace(/^./, (c) => c.toUpperCase());
}
