import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { NextResponse } from "next/server";

import { getApexDomainFromHost, parse } from "./utils";

export interface UserMiddlewareInfo {
    id: string;
    accountantId: string | undefined;
    clientIds: string[] | undefined;
    isOnboardingComplete: boolean;
    email: string;
}

const isPublicRoute = createRouteMatcher([
    "/login(.*)",
    "/sso-callback(.*)",
    "/api(.*)",
]);


export default clerkMiddleware(
    async (auth, request) => {
        if (isPublicRoute(request)) return;

        if (/\/clerk_\d{13,20}/.test(request.url)) {
            return NextResponse.next();
        }

        await auth.protect({
            unauthenticatedUrl: new URL("/login", `https://`.concat(process.env.NEXT_PUBLIC_ROOT_DOMAIN as string)).toString()
        });

        const { userId, redirectToSignIn, sessionClaims} = await auth();

        if (!userId) return redirectToSignIn();

        const { path, domain, fullPath, searchParams } = parse(request);

        const prefix = (sessionClaims?.subdomain && sessionClaims?.subdomain !== '') ? sessionClaims?.subdomain : null
        const rootDomain = (sessionClaims?.root && sessionClaims?.root !== '') ? sessionClaims?.root : null

        const userCustomDomain = prefix ? (prefix as string).concat(".",(rootDomain as string) || (process.env.NEXT_PUBLIC_SATELLITE_ROOT_DOMAIN as string)) : null

        const nextDomain = `${
            process.env.NODE_ENV === "development" ||
                domain.includes("localhost")
                ? "http://"
                : "https://"
        }${userCustomDomain ?? domain}`;

        // if user is on wrong domain, redirect to correct domain
        if (userCustomDomain && userCustomDomain !== domain) {
            return NextResponse.redirect(`${nextDomain}${fullPath}`);
        }

        // redirect from root to dashboard
        if (path === "/") {
            return NextResponse.redirect(
                `${nextDomain}/dashboard?${searchParams}`,
            );
        }

        return NextResponse.rewrite(
            new URL(`/${userCustomDomain ?? domain}${fullPath}`, request.url),
        );
    },
    (req) => {
        const host = req.nextUrl.host;
        const isSatellite = !process.env.NEXT_PUBLIC_ROOT_DOMAIN!.includes(
            host,
        );
        const domain = getApexDomainFromHost(host);

        console.log("clerk middleware", {
            host,
            domain,
            rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
            isSatellite,
        });

        return {
            isSatellite: isSatellite ?? undefined,
            domain: isSatellite
                ? `https://${domain}`
                : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`,
        };
    },
);

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}