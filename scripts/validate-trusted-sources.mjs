import { isTrustedExternalUrl, normalizeHostname } from "../src/data/trustedSources.js";

if (!isTrustedExternalUrl("https://www.upsc.gov.in/examinations")) throw new Error("UPSC should be trusted.");
if (!isTrustedExternalUrl("https://www.pib.gov.in/PressReleasePage.aspx")) throw new Error("PIB should be trusted.");
if (!isTrustedExternalUrl("https://subdomain.rbi.org.in/page")) throw new Error("RBI subdomain should be trusted.");
if (isTrustedExternalUrl("https://example.com/article")) throw new Error("Unknown domain was incorrectly trusted.");
if (normalizeHostname("https://www.UPSC.gov.in/test") !== "upsc.gov.in") throw new Error("Hostname normalization failed.");

console.log("Trusted source validation passed.");
