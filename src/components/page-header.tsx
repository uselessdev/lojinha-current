export function PageHeader({ children }: React.PropsWithChildren<unknown>) {
  return (
    <header className="h-20 flex justify-between items-center pr-6">
      {children}
    </header>
  );
}
