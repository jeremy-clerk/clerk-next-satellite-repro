import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import "../globals.css";
import { headers } from "next/headers";
import {getApexDomainFromHost} from "@/utils";

export default async function RootLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const headersList = await headers();
    const host =
        headersList.get("x-forwarded-host") ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
    const isSatellite = !host.includes(process.env.NEXT_PUBLIC_ROOT_DOMAIN!);

    console.log("subdomain root layout", {
        host,
        isSatellite,
        rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    });

    const domain = getApexDomainFromHost(host);

    return (
        <ClerkProvider
            domain={isSatellite ? domain : process.env.NEXT_PUBLIC_ROOT_DOMAIN as string}
            isSatellite={isSatellite}
            afterSignOutUrl={(process.env.NEXT_PUBLIC_ROOT_DOMAIN as string).concat("/login")}
        >
            <html lang="en">
            <body>
            <SignedIn>
                <UserButton />
            </SignedIn>
            {children}
            </body>
            </html>
        </ClerkProvider>
    );
}
