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

	return (
		<ClerkProvider
			allowedRedirectOrigins={[satelliteDomain]}
			// does not work: Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server"
			// domain={(url) => url.host}
			domain={`https://${host}`}
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
