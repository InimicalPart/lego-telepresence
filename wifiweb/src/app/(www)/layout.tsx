
import "@/styles/globals.css"
import { Providers } from "@/components/providers";
import { Viewport } from "next";
import HeaderAlert from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { WarnMobileUnstableWebsite } from "@/components/warnMobile";

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
        <html lang="en" suppressHydrationWarning className="light">
            <head/>
            <body className="overflow-hidden wifiweb-bg">
                <Providers themeProps={{ attribute: "class", defaultTheme: "dark", children }}>
                    <WarnMobileUnstableWebsite />
                    <Toaster richColors={true} expand position="top-right"/>
                    <HeaderAlert />
                    {children}
                </Providers>
            </body>
        </html>
  );
}