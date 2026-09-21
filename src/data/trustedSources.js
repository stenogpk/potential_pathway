const TRUSTED_DOMAIN_RULES = [
  "upsc.gov.in",
  "uppsc.up.nic.in",
  "pib.gov.in",
  "indiacode.nic.in",
  "rbi.org.in",
  "ncert.nic.in",
  "ncte.gov.in",
];

export function normalizeHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isTrustedExternalUrl(url) {
  const hostname = normalizeHostname(url);
  if (!hostname) return false;
  return TRUSTED_DOMAIN_RULES.some((domain) => hostname === domain || hostname.endsWith("." + domain));
}

export function trustedDomainList() {
  return [...TRUSTED_DOMAIN_RULES];
}
