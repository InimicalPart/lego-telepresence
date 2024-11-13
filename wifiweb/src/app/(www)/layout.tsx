
import "@/styles/globals.css"
import { Providers } from "@/components/providers";
import { Viewport } from "next";
import { AddIcon, XMarkIcon } from "@/components/icons";
import HeaderAlert from "@/components/header";
import { Toaster } from "@/components/ui/sonner";

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
            <body className="overflow-hidden wifiweb-bg">
                <Providers themeProps={{ attribute: "class", defaultTheme: "dark", children }}>
                    <Toaster richColors={true} expand position="top-right"/>
                    <HeaderAlert />
                    {children}
                </Providers>
            </body>
        </html>
  );
}