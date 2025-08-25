import "./globals.css";
import TopBar from "@/components/TopBar";

export const metadata = {
  title: "Clientum",
  description: "Gestión de nóminas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-slate-900">
        <TopBar />
        {children}
      </body>
    </html>
  );
}
