import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #030b1a 0%, #0f2060 50%, #030b1a 100%)',
    }}>
      <div className="p-6">
        <Link href="/" className="w-fit block">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <img src="/logo.png" alt="Logipilot AI" className="h-7 w-auto" />
          </div>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
