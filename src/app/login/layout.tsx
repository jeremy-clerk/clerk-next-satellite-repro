import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import "../globals.css";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {

	return (
		<ClerkProvider
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
