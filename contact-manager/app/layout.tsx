import './globals.css'
import Providers from './providers'
import AuthButton from '../components/AuthButton'

export const metadata = {
  title: 'Contact Manager',
  description: 'Simple CRUD app for contacts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          <header className="max-w-4xl mx-auto p-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Contact Manager</h1>
            <AuthButton />
          </header>
          <main className="max-w-4xl mx-auto p-6">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
