export type HostInfo = {
  rawHost: string;
  hostname: string;
  subdomain: string | null;
  baseDomain: string | null;
  isPortal: boolean;
  isCondoSubdomain: boolean;
  isLocal: boolean;
  isPreview: boolean;
};

const DEFAULT_HOST: HostInfo = {
  rawHost: "__DEFAULT__",
  hostname: "localhost",
  subdomain: null,
  baseDomain: "localhost",
  isPortal: true,
  isCondoSubdomain: false,
  isLocal: true,
  isPreview: false,
};

const PRIMARY_DOMAIN = "allecto.app";
const PORTAL_SUBDOMAIN = "portal";

function stripPort(host: string): string {
  const value = host.split(",")[0]?.trim() ?? "";
  const index = value.indexOf(":");
  return index === -1 ? value : value.slice(0, index);
}

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.startsWith("127.") ||
    hostname === ""
  );
}

function buildHostInfo(
  rawHost: string,
  hostname: string,
  subdomain: string | null,
  baseDomain: string | null,
  isPortal: boolean,
  isLocal: boolean,
  isPreview: boolean,
): HostInfo {
  return {
    rawHost,
    hostname,
    subdomain,
    baseDomain,
    isPortal,
    isCondoSubdomain: Boolean(subdomain) && !isPortal,
    isLocal,
    isPreview,
  };
}

export function parseHostFromHeader(hostHeader: string | null | undefined): HostInfo {
  if (!hostHeader) {
    return DEFAULT_HOST;
  }

  const hostname = stripPort(hostHeader.toLowerCase());
  const isLocal = isLocalhost(hostname);

  if (isLocal) {
    return buildHostInfo(hostHeader, hostname, null, hostname, true, true, false);
  }

  const isPreview = hostname.endsWith(".vercel.app");

  if (hostname === PRIMARY_DOMAIN) {
    return buildHostInfo(hostHeader, hostname, null, PRIMARY_DOMAIN, true, false, isPreview);
  }

  if (hostname === `${PORTAL_SUBDOMAIN}.${PRIMARY_DOMAIN}`) {
    return buildHostInfo(hostHeader, hostname, null, PRIMARY_DOMAIN, true, false, isPreview);
  }

  if (hostname.endsWith(`.${PRIMARY_DOMAIN}`)) {
    const prefix = hostname.slice(0, -(`.${PRIMARY_DOMAIN}`.length));
    if (!prefix) {
      return buildHostInfo(hostHeader, hostname, null, PRIMARY_DOMAIN, true, false, isPreview);
    }

    if (prefix === PORTAL_SUBDOMAIN) {
      return buildHostInfo(hostHeader, hostname, null, PRIMARY_DOMAIN, true, false, isPreview);
    }

    return buildHostInfo(hostHeader, hostname, prefix, PRIMARY_DOMAIN, false, false, isPreview);
  }

  // Unknown host (custom domain or preview). Treat as portal by default.
  const parts = hostname.split(".");
  const derivedBase =
    parts.length >= 2 ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}` : hostname;

  return buildHostInfo(
    hostHeader,
    hostname,
    null,
    derivedBase,
    true,
    false,
    isPreview,
  );
}

export function detectClientHost(): HostInfo {
  if (typeof window === "undefined") {
    return DEFAULT_HOST;
  }
  const host = window.location.host ?? "";
  return parseHostFromHeader(host);
}

export const DEFAULT_HOST_INFO = DEFAULT_HOST;
