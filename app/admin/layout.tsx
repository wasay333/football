export const metadata = {
  title: {
    default: 'Admin — Foocaps',
    template: '%s | Admin',
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="dark min-h-screen bg-background text-foreground">{children}</div>
}
