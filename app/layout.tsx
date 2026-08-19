import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "แบบประเมินความพึงพอใจ — พยาบาลวิสัญญี",
  description: "Student satisfaction survey for anesthesia nursing program",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans bg-gray-50 text-gray-800`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: { fontFamily: "var(--font-sarabun)", fontSize: "15px" },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
