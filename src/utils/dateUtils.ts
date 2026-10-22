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
