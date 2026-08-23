"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/StatCard";
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  Zap, 
  FileText,
  Calendar,
  Image as ImageIcon,
  Wifi,
  ServerCrash
} from "lucide-react";
import { usePermissions } from "@/context/PermissionsContext";
import { fetchAdminApi } from "@/lib/admin-homepage-api";
import { useRouter } from "next/navigation";

interface AnalyticsData {
  homepage: { requests: number, errors: number, averageLatencyMs: number, slowRequests: number, fallbacks: number };
  publishing: { publishes: number, failures: number, averageDurationMs: number };
  scheduler: { executed: number, failures: number, averageDelayMs: number };
  campaigns: { activated: number, completed: number, failures: number, cancelled: number };
  media: { uploads: number, failures: number };
  socket: { emitted: number, refetches: number };
  errors: Record<string, number>;
}

export default function HomepageAnalyticsPage() {
  const { can, isLoading: isPermissionsLoading } = usePermissions();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState("24h");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPermissionsLoading && !can("homepage.analytics.view")) {
      router.replace("/admin");
    }
  }, [can, isPermissionsLoading, router]);

  useEffect(() => {
    if (isPermissionsLoading || !can("homepage.analytics.view")) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAdminApi(`/homepage/analytics?range=${range}`);
        if (!response.success) {
          throw new Error(response.error?.message || "Failed to fetch analytics");
        }
        setData(response.data);
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [range, can, isPermissionsLoading]);

  if (isPermissionsLoading || !can("homepage.analytics.view")) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e5e5e5] shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#161513]">Operational Health</h2>
              <p className="text-sm text-gray-500">Business-neutral performance metrics</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {["1h", "24h", "7d", "30d"].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    range === r ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#ff4b2b] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
              <ServerCrash className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-8">
              {/* Homepage API Health */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Homepage API Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="API Requests"
                    value={data.homepage.requests.toString()}
                    growth="Live"
                    growthText={`in past ${range}`}
                    icon={Activity}
                    iconColorClass="text-blue-600"
                    iconBgClass="bg-blue-100"
                    trendColorClass="text-blue-600"
                  />
                  <StatCard
                    title="Errors"
                    value={data.homepage.errors.toString()}
                    growth=""
                    growthText={data.homepage.errors > 0 ? "Needs attention" : "Healthy"}
                    icon={AlertTriangle}
                    iconColorClass="text-red-600"
                    iconBgClass="bg-red-100"
                    trendColorClass="text-red-600"
                  />
                  <StatCard
                    title="Avg Latency"
                    value={`${data.homepage.averageLatencyMs}ms`}
                    growth={`${data.homepage.slowRequests}`}
                    growthText="slow requests"
                    icon={Clock}
                    iconColorClass="text-orange-600"
                    iconBgClass="bg-orange-100"
                    trendColorClass="text-orange-600"
                  />
                  <StatCard
                    title="Fallbacks Activated"
                    value={data.homepage.fallbacks.toString()}
                    growth=""
                    growthText="Client-side recoveries"
                    icon={Zap}
                    iconColorClass="text-purple-600"
                    iconBgClass="bg-purple-100"
                    trendColorClass="text-purple-600"
                  />
                </div>
              </section>

              {/* Publishing & Scheduler */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Publishing Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      title="Total Publishes"
                      value={data.publishing.publishes.toString()}
                      growth={`${data.publishing.failures}`}
                      growthText="failures"
                      icon={FileText}
                      iconColorClass="text-green-600"
                      iconBgClass="bg-green-100"
                      trendColorClass="text-red-500"
                    />
                    <StatCard
                      title="Avg Duration"
                      value={`${data.publishing.averageDurationMs}ms`}
                      growth="Tx"
                      growthText="commit time"
                      icon={Clock}
                      iconColorClass="text-blue-600"
                      iconBgClass="bg-blue-100"
                      trendColorClass="text-blue-600"
                    />
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Scheduler Accuracy</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      title="Jobs Executed"
                      value={data.scheduler.executed.toString()}
                      growth={`${data.scheduler.failures}`}
                      growthText="failures"
                      icon={Calendar}
                      iconColorClass="text-indigo-600"
                      iconBgClass="bg-indigo-100"
                      trendColorClass="text-red-500"
                    />
                    <StatCard
                      title="Avg Delay"
                      value={`${data.scheduler.averageDelayMs}ms`}
                      growth="Lag"
                      growthText="from target time"
                      icon={Clock}
                      iconColorClass="text-orange-600"
                      iconBgClass="bg-orange-100"
                      trendColorClass="text-orange-600"
                    />
                  </div>
                </section>
              </div>

              {/* Campaigns & Media */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Campaigns & Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Campaigns Activated"
                    value={data.campaigns.activated.toString()}
                    growth={`${data.campaigns.completed}`}
                    growthText="completed"
                    icon={Activity}
                    iconColorClass="text-[#ff4b2b]"
                    iconBgClass="bg-[#ff4b2b]/10"
                    trendColorClass="text-green-600"
                  />
                  <StatCard
                    title="Campaign Failures"
                    value={data.campaigns.failures.toString()}
                    growth={`${data.campaigns.cancelled}`}
                    growthText="cancelled manually"
                    icon={AlertTriangle}
                    iconColorClass="text-red-600"
                    iconBgClass="bg-red-100"
                    trendColorClass="text-gray-500"
                  />
                  <StatCard
                    title="Media Uploads"
                    value={data.media.uploads.toString()}
                    growth={`${data.media.failures}`}
                    growthText="failures"
                    icon={ImageIcon}
                    iconColorClass="text-teal-600"
                    iconBgClass="bg-teal-100"
                    trendColorClass="text-red-500"
                  />
                  <StatCard
                    title="Socket Emits"
                    value={data.socket.emitted.toString()}
                    growth={`${data.socket.refetches}`}
                    growthText="refetches triggered"
                    icon={Wifi}
                    iconColorClass="text-cyan-600"
                    iconBgClass="bg-cyan-100"
                    trendColorClass="text-cyan-600"
                  />
                </div>
              </section>

              {/* Error Breakdown Table (Optional enhancement) */}
              {Object.keys(data.errors).length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Error Breakdown</h3>
                  <div className="bg-white border border-[#e5e5e5] rounded-[16px] overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-[#e5e5e5] text-gray-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Error Type</th>
                          <th className="px-6 py-3 font-semibold text-right">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.errors).map(([type, count]: [string, number]) => (
                          <tr key={type} className="border-b border-[#e5e5e5] last:border-0">
                            <td className="px-6 py-3 font-medium text-[#161513]">{type}</td>
                            <td className="px-6 py-3 text-right text-gray-500">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
