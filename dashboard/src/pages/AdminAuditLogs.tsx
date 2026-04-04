import { useEffect, useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";
import AdminOpsLayout from "@/components/AdminOpsLayout";
import { Button } from "@/components/ui/button";
import { fetchAdminAuditLogs, type AdminAuditLogItem } from "@/lib/api";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await fetchAdminAuditLogs(100);
      setLogs(result.logs);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) =>
      [log.actor, log.action, log.targetType, log.targetId, log.details].join(" ").toLowerCase().includes(q),
    );
  }, [logs, query]);

  function exportCsv() {
    const header = ["id", "actor", "action", "targetType", "targetId", "details", "createdAt"];
    const rows = filtered.map((l) => [l.id, l.actor, l.action, l.targetType, l.targetId, l.details, l.createdAt]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "rideguard-audit-logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <AdminOpsLayout title="Audit Logs" subtitle="Immutable system logs with filter and export.">
      <section className="bg-card rounded-2xl border border-border/60 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by actor, action, target..."
              className="h-10 w-full md:w-[360px] rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>Refresh</Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border/60 text-muted-foreground">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Target</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="py-3 text-muted-foreground" colSpan={5}>Loading logs...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td className="py-3 text-muted-foreground" colSpan={5}>No logs found for current filters.</td></tr>
              )}
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-border/40 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{log.createdAt}</td>
                  <td className="py-2 pr-3">{log.actor}</td>
                  <td className="py-2 pr-3">{log.action}</td>
                  <td className="py-2 pr-3">{log.targetType}:{log.targetId}</td>
                  <td className="py-2">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminOpsLayout>
  );
};

export default AdminAuditLogs;
