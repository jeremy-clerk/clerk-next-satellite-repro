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

// INSERT YOUR CLERK USER ID HERE
// Normally we would get this info from the database.
// For this example, we'll just mock it and say we only have one satellite domain.
// In our real implementation, there are dozens of users with custom domains and we can only tell as soon as the user is signed in.
const mockUsersWithCustomDomains = [
    "user_2q4fC1shj1XId8oiGGDilx2xg2Z",
    "user_2q4f8eJwLkaRCpNcCJAnijd1ZnL",
];
// const mockUsersWithCustomDomains = [""];

export const satelliteDomain = "satellite.stbrd.com";

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
                ? `https://${host}`
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