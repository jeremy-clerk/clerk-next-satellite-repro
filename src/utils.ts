import type { NextRequest } from "next/server";
import { ccTLDs, SECOND_LEVEL_DOMAINS } from "./constants";

export const getApexDomainFromHost = (host: string) => {
    const parts = host.split(".");
    if (parts.length > 2) {
        if (
            // if this is a second-level TLD (e.g. co.uk, .com.ua, .org.tt), we need to return the last 3 parts
            SECOND_LEVEL_DOMAINS.has(parts[parts.length - 2] ?? "") &&
            ccTLDs.has(parts[parts.length - 1] ?? "")
        ) {
            return parts.slice(-3).join(".");
        }
        // otherwise, it's a subdomain (e.g. dub.vercel.app), so we return the last 2 parts
        return parts.slice(-2).join(".");
    }
    // if it's a normal domain (e.g. dub.co), we return the domain
    return host;
};

export const parse = (req: NextRequest) => {
    let domain = req.headers.get("host")!;
    domain = domain.replace("www.", ""); // remove www. from domain
    // if (domain === "dub.localhost:8888") domain = "dub.sh"; // for local development

    // path is the path of the URL (e.g. dub.co/stats/github -> /stats/github)
    const path = req.nextUrl.pathname;

    // fullPath is the full URL path (along with search params)
    const searchParams = req.nextUrl.searchParams.toString();
    const fullPath = `${req.nextUrl.pathname}${
        searchParams.length > 0 ? `?${searchParams}` : ""
    }`;

    // Here, we are using decodeURIComponent to handle foreign languages like Hebrew
    const key = decodeURIComponent(path.split("/")[1] ?? ""); // key is the first part of the path (e.g. dub.co/stats/github -> stats)
    const fullKey = decodeURIComponent(path.slice(1)); // fullKey is the full path without the first slash (to account for multi-level subpaths, e.g. dub.sh/github/repo -> github/repo)

    return { domain, path, fullPath, key, fullKey, searchParams };
};
