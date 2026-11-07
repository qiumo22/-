export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-card/85 border-border/70 mx-auto flex w-full max-w-md flex-col gap-6 rounded-[2rem] border p-6 shadow-[0_30px_70px_-45px_rgba(232,106,146,0.55)] backdrop-blur-sm sm:p-8">
      {children}
    </div>
  );
}
