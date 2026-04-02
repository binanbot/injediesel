import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, type LucideIcon } from "lucide-react";

interface PlannedBlock {
  title: string;
  description: string;
}

interface CeoPlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  plannedBlocks: PlannedBlock[];
}

export function CeoPlaceholderPage({ icon: Icon, title, subtitle, description, plannedBlocks }: CeoPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Icon className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-bold">{title}</h1>
          <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 text-xs gap-1">
            <Clock className="h-3 w-3" />
            Em breve
          </Badge>
        </div>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <Card className="border-emerald-400/10 bg-emerald-400/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Módulos planejados</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {plannedBlocks.map((block, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {block.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{block.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        Planejado para as próximas fases da plataforma executiva
      </p>
    </div>
  );
}
