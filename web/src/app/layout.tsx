import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Pantry2List: Manage your Shopping list and Pantry",
    description: "Smart grocery list and pantry manager",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
