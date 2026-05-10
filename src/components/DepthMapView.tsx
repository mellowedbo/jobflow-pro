'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { Map, AlertCircle, Layers, TrendingUp } from 'lucide-react';

const SOIL_COLORS: Record<string, string> = {
  'Hard Rock': '#dc2626',
  'Clay': '#a16207',
  'Sand': '#eab308',
  'Clay & Sand': '#f59e0b',
  'Mixed Rock': '#7c3aed',
  'Loam': '#16a34a',
  'Gravel': '#6b7280',
  'Silt': '#0ea5e9',
};

const PIE_COLORS = ['#dc2626', '#a16207', '#eab308', '#7c3aed', '#16a34a', '#6b7280', '#0ea5e9', '#f59e0b'];

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function DepthMapView() {
  const jobs = useStore((s) => s.jobs);

  const completedJobs = useMemo(
    () => jobs.filter((j) => (j.status === 'completed' || j.status === 'billed' || j.status === 'closed') && j.depthDrilled),
    [jobs]
  );

  // Depth chart data — bar chart showing depth per location, color-coded by soil type
  const depthChartData = useMemo(
    () =>
      completedJobs.map((j) => ({
        location: j.location.split(',')[0], // Short name
        depth: j.depthDrilled ?? 0,
        soilType: j.soilType ?? 'Unknown',
        fill: SOIL_COLORS[j.soilType ?? ''] ?? '#6b7280',
      })),
    [completedJobs]
  );

  // Soil distribution data for pie chart
  const soilDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    completedJobs.forEach((j) => {
      const soil = j.soilType ?? 'Unknown';
      counts[soil] = (counts[soil] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [completedJobs]);

  // Profitability by Depth — scatter plot
  const profitabilityData = useMemo(
    () =>
      completedJobs
        .filter((j) => j.finalBillAmount && j.depthDrilled)
        .map((j) => {
          const totalCosts = j.internalCosts.reduce((s, c) => s + c.amount, 0) + (j.dieselCost ?? 0);
          const profit = (j.finalBillAmount ?? 0) - totalCosts;
          return {
            depth: j.depthDrilled ?? 0,
            profit,
            customer: j.customerName,
            soilType: j.soilType ?? 'Unknown',
          };
        }),
    [completedJobs]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10">
            <Map className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Depth Map
              <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2">
                PROTOTYPE
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">GIS-style depth visualization and soil analysis</p>
          </div>
        </div>
      </div>

      {/* GIS Integration Notice */}
      <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">GIS Integration</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Future versions will include interactive maps with location pinning and predictive modeling.
                Current view shows tabular depth data with chart-based visualization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Jobs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Drilling Locations & Depths
          </CardTitle>
          <CardDescription>Completed borewell jobs with location, depth, and soil type data</CardDescription>
        </CardHeader>
        <CardContent>
          {completedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No completed jobs with depth data available</p>
          ) : (
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Depth (ft)</TableHead>
                    <TableHead>Soil Type</TableHead>
                    <TableHead>Casing</TableHead>
                    <TableHead className="text-right">Bill Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.customerName}</TableCell>
                      <TableCell className="text-sm">{job.location}</TableCell>
                      <TableCell className="text-right font-mono">{job.depthDrilled}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium"
                          style={{
                            borderColor: SOIL_COLORS[job.soilType ?? ''] ?? '#6b7280',
                            color: SOIL_COLORS[job.soilType ?? ''] ?? '#6b7280',
                          }}
                        >
                          {job.soilType ?? 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{job.casingType}</TableCell>
                      <TableCell className="text-right font-mono">
                        {job.finalBillAmount ? formatCurrency(job.finalBillAmount) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depth Chart — Bar chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Depth by Location</CardTitle>
            <CardDescription>Bar chart showing drilling depth per location, color-coded by soil type</CardDescription>
          </CardHeader>
          <CardContent>
            {depthChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={depthChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="location"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: 'Depth (ft)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
                            <p className="font-semibold">{d.location}</p>
                            <p>Depth: <span className="font-mono">{d.depth} ft</span></p>
                            <p>Soil: <span style={{ color: d.fill }}>{d.soilType}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    content={() => {
                      const soilTypes = [...new Set(depthChartData.map((d) => d.soilType))];
                      return (
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                          {soilTypes.map((type) => (
                            <div key={type} className="flex items-center gap-1.5 text-xs">
                              <div
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: SOIL_COLORS[type] ?? '#6b7280' }}
                              />
                              <span>{type}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="depth" radius={[4, 4, 0, 0]}>
                    {depthChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Soil Distribution — Pie Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Soil Distribution</CardTitle>
            <CardDescription>Distribution of soil types across completed drilling jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {soilDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={soilDistribution}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    innerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {soilDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
                            <p className="font-semibold">{d.name}</p>
                            <p>Jobs: <span className="font-mono">{d.value}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profitability by Depth — Scatter Plot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Profitability by Depth
          </CardTitle>
          <CardDescription>
            Scatter plot showing the relationship between drilling depth and profit margin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profitabilityData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  type="number"
                  dataKey="depth"
                  name="Depth"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Depth (ft)', position: 'insideBottom', fontSize: 11, offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="profit"
                  name="Profit"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  label={{ value: 'Profit (₹)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <ZAxis range={[80, 200]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
                          <p className="font-semibold">{d.customer}</p>
                          <p>Depth: <span className="font-mono">{d.depth} ft</span></p>
                          <p>Profit: <span className="font-mono">{formatCurrency(d.profit)}</span></p>
                          <p>Soil: {d.soilType}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={profitabilityData} fill="#10b981">
                  {profitabilityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SOIL_COLORS[entry.soilType] ?? '#6b7280'}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
