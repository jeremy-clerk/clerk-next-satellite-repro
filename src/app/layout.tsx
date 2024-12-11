import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import "./globals.css";
import { satelliteDomain } from "@/middleware";
import { headers } from "next/headers";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const headersList = await headers();
	const host =
		headersList.get("x-forwarded-host") ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
	const isSatellite = !host.includes(process.env.NEXT_PUBLIC_ROOT_DOMAIN!);

	console.log("root layout", {
		host,
		isSatellite,
		rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
	});

	//Clerk was trying to load js from clerk.https//<host>.app/npm which was failing. Changed to just host to resolve this.
	return (
		<ClerkProvider
			allowedRedirectOrigins={[satelliteDomain]}
			domain={host}
			isSatellite={isSatellite}
			dynamic
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
