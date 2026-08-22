export interface CountryOption {
  code: string;
  name: string;
}

// Complete list of ISO world countries
export const ALL_COUNTRIES: CountryOption[] = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'PL', name: 'Poland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IL', name: 'Israel' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RO', name: 'Romania' },
  { code: 'HU', name: 'Hungary' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'OM', name: 'Oman' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
  { code: 'MA', name: 'Morocco' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panama' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'IS', name: 'Iceland' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'HR', name: 'Croatia' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'MT', name: 'Malta' }
];

export interface TimezoneOption {
  value: string;
  label: string;
  group: string;
}

export const ALL_TIMEZONES: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', group: 'Universal' },
  
  // Asia & Middle East
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India Standard Time - IST, UTC+5:30)', group: 'Asia & Middle East' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (Gulf Standard Time - GST, UTC+4)', group: 'Asia & Middle East' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (Saudi Arabia, UTC+3)', group: 'Asia & Middle East' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (Singapore Time - SGT, UTC+8)', group: 'Asia & Middle East' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (Hong Kong Time - HKT, UTC+8)', group: 'Asia & Middle East' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan Standard Time - JST, UTC+9)', group: 'Asia & Middle East' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (Korea Standard Time - KST, UTC+9)', group: 'Asia & Middle East' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (Indochina Time - ICT, UTC+7)', group: 'Asia & Middle East' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (Western Indonesia - WIB, UTC+7)', group: 'Asia & Middle East' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (Pakistan Standard Time - PKT, UTC+5)', group: 'Asia & Middle East' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (Bangladesh Time - BST, UTC+6)', group: 'Asia & Middle East' },
  { value: 'Asia/Manila', label: 'Asia/Manila (Philippines, UTC+8)', group: 'Asia & Middle East' },
  { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (Malaysia, UTC+8)', group: 'Asia & Middle East' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (China Standard Time - CST, UTC+8)', group: 'Asia & Middle East' },
  { value: 'Asia/Taipei', label: 'Asia/Taipei (Taiwan, UTC+8)', group: 'Asia & Middle East' },
  { value: 'Asia/Jerusalem', label: 'Asia/Jerusalem (Israel Standard Time, UTC+2)', group: 'Asia & Middle East' },
  { value: 'Asia/Qatar', label: 'Asia/Qatar (Qatar, UTC+3)', group: 'Asia & Middle East' },
  { value: 'Asia/Kuwait', label: 'Asia/Kuwait (Kuwait, UTC+3)', group: 'Asia & Middle East' },

  // Americas
  { value: 'America/New_York', label: 'America/New_York (US Eastern - EST/EDT, UTC-5)', group: 'North & South America' },
  { value: 'America/Chicago', label: 'America/Chicago (US Central - CST/CDT, UTC-6)', group: 'North & South America' },
  { value: 'America/Denver', label: 'America/Denver (US Mountain - MST/MDT, UTC-7)', group: 'North & South America' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific - PST/PDT, UTC-8)', group: 'North & South America' },
  { value: 'America/Anchorage', label: 'America/Anchorage (US Alaska, UTC-9)', group: 'North & South America' },
  { value: 'America/Honolulu', label: 'America/Honolulu (US Hawaii, UTC-10)', group: 'North & South America' },
  { value: 'America/Toronto', label: 'America/Toronto (Canada Eastern, UTC-5)', group: 'North & South America' },
  { value: 'America/Vancouver', label: 'America/Vancouver (Canada Pacific, UTC-8)', group: 'North & South America' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (Mexico Central, UTC-6)', group: 'North & South America' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (Brazil, UTC-3)', group: 'North & South America' },
  { value: 'America/Buenos_Aires', label: 'America/Buenos_Aires (Argentina, UTC-3)', group: 'North & South America' },
  { value: 'America/Bogota', label: 'America/Bogota (Colombia, UTC-5)', group: 'North & South America' },
  { value: 'America/Santiago', label: 'America/Santiago (Chile, UTC-4)', group: 'North & South America' },
  { value: 'America/Lima', label: 'America/Lima (Peru, UTC-5)', group: 'North & South America' },

  // Europe & Africa
  { value: 'Europe/London', label: 'Europe/London (UK - GMT/BST, UTC+0)', group: 'Europe & Africa' },
  { value: 'Europe/Dublin', label: 'Europe/Dublin (Ireland, UTC+0)', group: 'Europe & Africa' },
  { value: 'Europe/Paris', label: 'Europe/Paris (France - CET/CEST, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (Germany - CET/CEST, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (Netherlands - CET, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (Spain - CET, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Rome', label: 'Europe/Rome (Italy - CET, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich (Switzerland - CET, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Stockholm', label: 'Europe/Stockholm (Sweden - CET, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Warsaw', label: 'Europe/Warsaw (Poland - CET, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Athens', label: 'Europe/Athens (Greece - EET/EEST, UTC+2)', group: 'Europe & Africa' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul (Turkey - TRT, UTC+3)', group: 'Europe & Africa' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow (Russia - MSK, UTC+3)', group: 'Europe & Africa' },
  { value: 'Europe/Vienna', label: 'Europe/Vienna (Austria, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Brussels', label: 'Europe/Brussels (Belgium, UTC+1)', group: 'Europe & Africa' },
  { value: 'Europe/Lisbon', label: 'Europe/Lisbon (Portugal, UTC+0)', group: 'Europe & Africa' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (Egypt - EET, UTC+2)', group: 'Europe & Africa' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (South Africa - SAST, UTC+2)', group: 'Europe & Africa' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos (Nigeria - WAT, UTC+1)', group: 'Europe & Africa' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (Kenya - EAT, UTC+3)', group: 'Europe & Africa' },

  // Australia & Oceania
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT, UTC+10)', group: 'Australia & Oceania' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEST/AEDT, UTC+10)', group: 'Australia & Oceania' },
  { value: 'Australia/Brisbane', label: 'Australia/Brisbane (AEST, UTC+10)', group: 'Australia & Oceania' },
  { value: 'Australia/Adelaide', label: 'Australia/Adelaide (ACST/ACDT, UTC+9:30)', group: 'Australia & Oceania' },
  { value: 'Australia/Perth', label: 'Australia/Perth (AWST, UTC+8)', group: 'Australia & Oceania' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (New Zealand - NZST/NZDT, UTC+12)', group: 'Australia & Oceania' },
  { value: 'Pacific/Fiji', label: 'Pacific/Fiji (Fiji, UTC+12)', group: 'Australia & Oceania' }
];

/**
 * Resolve effective timezone following strict priority:
 * 1. Project-based timezone (website.timezone)
 * 2. Global system timezone (settings.timezone)
 * Fallback: UTC
 */
export function getEffectiveTimezone(projectTimezone?: string, globalTimezone?: string): string {
  if (projectTimezone && projectTimezone.trim() !== '') {
    return projectTimezone.trim();
  }
  if (globalTimezone && globalTimezone.trim() !== '') {
    return globalTimezone.trim();
  }
  return 'UTC';
}

/**
 * Checks if a query matches any brand term using Phrase Match.
 * Phrase Match: the brand keyword appears as a contiguous phrase / substring (case-insensitive) in the query.
 */
export function isPhraseMatchBrand(query: string, brandTerms: string[]): boolean {
  if (!query || !brandTerms || brandTerms.length === 0) return false;
  const cleanQuery = query.toLowerCase().trim();
  return brandTerms.some(term => {
    const cleanTerm = term.toLowerCase().trim();
    if (!cleanTerm) return false;
    return cleanQuery.includes(cleanTerm);
  });
}
