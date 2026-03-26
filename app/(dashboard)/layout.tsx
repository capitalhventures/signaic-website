import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-light">
      <main className="mr-[280px]">
        <div className="p-8">{children}</div>
      </main>
      <Sidebar />
    </div>
  );
}
