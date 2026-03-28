/**
 * Format a YYYY-MM-DD date string to human-readable format
 * e.g., "2026-02-01" → "February 1st, 2026"
 */
export function formatBriefDate(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  if (!yearStr || !monthStr || !dayStr) return dateStr;

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const monthName = monthNames[month - 1];
  if (!monthName) return dateStr;

  return `${monthName} ${day}${getOrdinalSuffix(day)}, ${year}`;
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
