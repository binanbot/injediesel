import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton para cards de estatísticas/KPI
 */
export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid de skeleton para estatísticas
 */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton para linhas de tabela
 */
export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-border/20">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton para tabelas completas
 */
export function TableSkeleton({ rows = 4, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="text-left py-3 px-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} columns={columns} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para gráficos de área/linha
 */
export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end justify-between gap-2 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t-md" 
              style={{ height: `${Math.random() * 60 + 40}%` }} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para gráfico de pizza
 */
export function PieChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center gap-8">
          <div className="flex-1 flex justify-center">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
          <div className="flex-1 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-8 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para gráfico de barras horizontal
 */
export function BarChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-52" />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] space-y-4 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-32 shrink-0" />
              <Skeleton 
                className="h-6 rounded-r-md" 
                style={{ width: `${Math.random() * 40 + 30}%` }} 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para alertas do dashboard
 */
export function AlertSkeleton() {
  return (
    <div className="rounded-xl border border-border/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-24 hidden sm:block" />
      </div>
    </div>
  );
}

/**
 * Skeleton para cards de ação rápida
 */
export function QuickActionSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para banner carousel
 */
export function BannerSkeleton() {
  return (
    <Skeleton className="h-[200px] w-full rounded-xl" />
  );
}
