// layout raiz de la aplicacion SIC
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIC - Sistema de Intercambio de Comisiones",
  description: "Gestion de comisiones para estudiantes y profesores",
};

// script que aplica el tema antes del primer render para evitar el flash
// por defecto SIEMPRE claro - solo activa oscuro si el usuario lo eligio explicitamente
const scriptTema = `
(function(){
  try{
    var t=localStorage.getItem('tema-sic');
    if(t==='oscuro'){
      document.documentElement.classList.add('dark');
    } else {
      // garantiza que no quede clase dark de estados anteriores
      document.documentElement.classList.remove('dark');
    }
  }catch(e){
    document.documentElement.classList.remove('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* el script se ejecuta antes de que react hidrate - evita el flash de tema */}
      {/* bg y color van por CSS variables en globals.css - no por clases dark: de tailwind */}
      <body className="flex min-h-full flex-col">
        <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: scriptTema }} />
        {children}
      </body>
    </html>
  );
}
