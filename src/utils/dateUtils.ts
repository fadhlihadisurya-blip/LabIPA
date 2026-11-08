/**
 * Utility functions for date formatting in SIMLAB IPA
 * Standard display format: dd-mm-yyyy (e.g., 21-10-2026)
 */

/**
 * Format any date string (ISO, YYYY-MM-DD, DD-MM-YYYY, etc.) into standard dd-mm-yyyy
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') {
    return '-';
  }

  const str = dateStr.trim();

  // If already in dd-mm-yyyy or dd/mm/yyyy
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${day}-${month}-${year}`;
  }

  // If in yyyy-mm-dd or yyyy/mm/dd (optionally with time)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  // Attempt JavaScript Date object parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return str;
}

/**
 * Convert any date string to YYYY-MM-DD for native HTML5 <input type="date" />
 */
export function toInputDate(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') {
    return '';
  }

  const str = dateStr.trim();

  // If already YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // If DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${year}-${month}-${day}`;
  }

  return '';
}

/**
 * Get today's date formatted as dd-mm-yyyy
 */
export function getTodayDDMMYYYY(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Get today's date formatted as yyyy-mm-dd
 */
export function getTodayYYYYMMDD(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse any date string (dd-mm-yyyy, yyyy-mm-dd, ISO, etc.) into epoch timestamp milliseconds for accurate chronological sorting.
 */
export function parseDateToTimestamp(dateStr?: string | null): number {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') {
    return 0;
  }

  const str = dateStr.trim();

  // If in dd-mm-yyyy or dd/mm/yyyy
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  // If in yyyy-mm-dd or yyyy/mm/dd
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.getTime();
  }

  return 0;
}

/**
 * Extract { day, month, year } integers from any date string
 * Month is 1-indexed (1 = Januari, 12 = Desember)
 */
export function getDateParts(dateStr?: string | null): { day: number; month: number; year: number } | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return null;
  const str = dateStr.trim();

  // dd-mm-yyyy or dd/mm/yyyy
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    return {
      day: parseInt(dmy[1], 10),
      month: parseInt(dmy[2], 10),
      year: parseInt(dmy[3], 10),
    };
  }

  // yyyy-mm-dd or yyyy/mm/dd
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    return {
      day: parseInt(ymd[3], 10),
      month: parseInt(ymd[2], 10),
      year: parseInt(ymd[1], 10),
    };
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  }

  return null;
}


