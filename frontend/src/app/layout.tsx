import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project Tracker Aptavis',
  description: 'Fullstack Developer Study Case',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}