export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/ytw-bg-portal.png')" }}
    >
      <div className="container flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
} 