
import "@/styles/globals.css"
import { Providers } from "@/components/providers";
import { Viewport } from "next";

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="en" suppressHydrationWarning>
            <head/>
            <body>
                <Providers themeProps={{ attribute: "class", defaultTheme: "light", children }}>
                    {children}
                </Providers>
            </body>
        </html>
  );
}
