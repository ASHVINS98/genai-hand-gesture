import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hand Gesture Emoji",
  description: "Show a hand gesture, get an emoji",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
