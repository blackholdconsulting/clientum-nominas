import "./globals.css";
import ChunkReload from "@/components/ChunkReload";
// ...tus imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ChunkReload />
        {children}
      </body>
    </html>
  );
}
