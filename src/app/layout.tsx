import type { Metadata } from 'next'
import './globals.css'
import { TRPCProvider } from '@/components/providers/trpc-provider'

export const metadata: Metadata = {
  title: 'Lodestone Capital',
  description: 'Private Equity Investment Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
