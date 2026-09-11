export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            N
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">NEXA</h1>
          <p className="mt-1 text-sm text-muted">Transforme o caos em pequenas ações.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
