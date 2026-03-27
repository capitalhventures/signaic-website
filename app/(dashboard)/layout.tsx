import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-light">
      <main className="md:ml-[280px]">
        <div className="p-4 pt-16 md:pt-8 md:p-8">{children}</div>
      </main>
      <Sidebar />
    </div>
  );
}
