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

// jeremy+test2@clerk.dev
// jeremy+test3@clerk.dev
const mockUsersWithCustomDomains = [
    "user_2q4lxzh3QGkT9PLTgKHAjCZGfg7",
    "user_2q4lvzQflCS9ymoxwhriLa9wnH4",
];

// main domain configured in clerk: devsuccess.app
// satellite domain configured in clerk: devsuccess.dev
// added both devsuccess.dev and satellite.devsuccess.dev to Vercel for good measure

export const satelliteDomain = "satellite.devsuccess.dev";

const mockGetUserCustomDomain = (userId: string) => {
    if (mockUsersWithCustomDomains.includes(userId)) {
        return satelliteDomain;
    }
    return null;
};

export default clerkMiddleware(
    async (auth, request) => {
        if (isPublicRoute(request)) return;
        await auth.protect();

        const { userId, redirectToSignIn } = await auth();

        if (!userId) return redirectToSignIn();

        const { path, domain, fullPath, searchParams } = parse(request);

        console.log({
            domain,
            path,
            fullPath,
            searchParams,
        });

        const userCustomDomain = mockGetUserCustomDomain(userId);

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
                ? `https://${process.env.NEXT_PUBLIC_SATELLITE_ROOT_DOMAIN}`
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