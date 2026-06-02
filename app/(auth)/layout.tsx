import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #030b1a 0%, #0f2060 50%, #030b1a 100%)',
    }}>
      <div className="p-6">
        <Link href="/" className="w-fit block">
          <img
            src="/logo.png"
            alt="Logipilot AI"
            className="h-11 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
