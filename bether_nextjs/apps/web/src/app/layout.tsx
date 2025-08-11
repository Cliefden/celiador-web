
export const metadata = { title: 'MVP Studio', description: 'Lovable-like MVP' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
