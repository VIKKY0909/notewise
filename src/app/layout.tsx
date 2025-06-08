
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/hooks/useTheme'; // Changed to ThemeProvider

const siteName = 'NoteWise';
const title = 'NoteWise - AI-Powered Study Tools for Notes, Summaries & Flashcards';
const description = 'Boost your learning with NoteWise! Upload lectures or PDFs and get AI-generated notes, summaries, Q&A, and flashcards. The ultimate AI study assistant for exam preparation.';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'; // Define a base URL

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  description: description,
  keywords: ['AI study tools', 'AI note generator', 'PDF to notes AI', 'document summarizer AI', 'AI flashcard maker', 'exam preparation AI', 'study assistant AI', 'automated study notes', 'NoteWise', 'AI learning'],
  authors: [{ name: 'Firebase Studio' }],
  creator: 'Firebase Studio',
  publisher: 'Firebase Studio',
  openGraph: {
    title: title,
    description: description,
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: `${siteUrl}/og-image.png`, // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'NoteWise AI Study Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: title,
    description: description,
    // siteId: 'yourTwitterSiteId', // Optional: Your Twitter site ID
    // creator: '@yourTwitterHandle', // Optional: Your Twitter handle
    // creatorId: 'yourTwitterCreatorId', // Optional: Your Twitter creator ID
    images: [`${siteUrl}/twitter-image.png`], // Replace with your actual Twitter image URL
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
  // If you have a manifest.json
  // manifest: `${siteUrl}/site.webmanifest`,
  // Icons (example, replace with your actual icons)
  // icons: {
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon-16x16.png',
  //   apple: '/apple-touch-icon.png',
  // },
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
