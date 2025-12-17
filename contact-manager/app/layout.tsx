import './globals.css'

export const metadata = {
  title: 'Contact Manager',
  description: 'Simple CRUD app for contacts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  )
}
