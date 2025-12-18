import './globals.css'
import Providers from './providers'
import AuthButton from '../components/AuthButton'
import Link from 'next/link'

export const metadata = {
  title: 'Contact Manager',
  description: 'Simple CRUD app for contacts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
              <div className="container-app h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="font-extrabold tracking-tight uppercase text-slate-950"
                  >
                    CONTACT MANAGER
                  </Link>
                  <nav className="hidden items-center gap-2 sm:flex">
                    <Link href="/contacts" className="btn-ghost">
                      Contacts
                    </Link>
                    <Link href="/contacts/new" className="btn-ghost">
                      New
                    </Link>
                  </nav>
                </div>
                <AuthButton />
              </div>
            </header>

            <main className="container-app flex-1 py-8">{children}</main>

            <footer className="border-t border-slate-200 bg-white">
              <div className="container-app py-6 text-sm text-slate-600 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="leading-tight">
                  <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                    Yug Vachhani
                    <span className="font-normal text-slate-600"> — Fullstack webdeveloper</span>
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    className="hover:text-slate-900 transition-colors"
                    href="https://www.linkedin.com/in/yug-vachhani-bb4133251/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                  <a
                    className="hover:text-slate-900 transition-colors"
                    href="https://github.com/YUG3011"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                  
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
