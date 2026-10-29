import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Context — Chat with your documents",
  description:
    "Upload research, reports, and notes, then get clear answers grounded in your sources.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
