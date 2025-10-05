import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: {
    default: 'Shiksha AI - AI-Powered Teaching Assistant',
    template: '%s | Shiksha AI'
  },
  description: 'Shiksha AI is an intelligent teaching assistant for educators in low-resource environments. Automate lesson planning, generate custom materials, and enhance teaching with AI-powered tools.',
  keywords: [
    'AI teaching assistant',
    'education technology',
    'lesson planning',
    'teaching tools',
    'AI for educators',
    'educational AI',
    'teaching assistant',
    'lesson planner',
    'educational content generation',
    'multilingual education'
  ],
  authors: [{ name: 'Shiksha AI Team' }],
  creator: 'Shiksha AI',
  publisher: 'Shiksha AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://shiksha-ai.vercel.app',
    title: 'Shiksha AI - AI-Powered Teaching Assistant',
    description: 'Empower educators with AI-driven lesson planning, content generation, and teaching tools designed for low-resource environments.',
    siteName: 'Shiksha AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shiksha AI - AI-Powered Teaching Assistant',
    description: 'Empower educators with AI-driven lesson planning, content generation, and teaching tools designed for low-resource environments.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#4682B4" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-body antialiased">
          <AuthProvider>
            {children}
          </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}