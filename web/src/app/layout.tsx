import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
    title: "Sam: Your AI Household Assistant",
    description: "Smart grocery list, pantry manager, and household organizer powered by AI.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AuthProvider>
                    <main>
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
