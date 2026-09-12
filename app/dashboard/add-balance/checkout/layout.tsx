export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--color-background)]">
      {children}
    </div>
  );
}
