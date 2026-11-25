import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'School Management System',
  description: 'Role-Based Portal for Admin, Teachers, and Parents',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 antialiased"
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}