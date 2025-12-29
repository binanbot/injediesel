import { useState } from "react";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const atualizacoes = [
  {
    id: 1,
    nome: "AlienTech KESSv2",
    versao: "3.2.1",
    data: "28/12/2024",
    tamanho: "156 MB",
    descricao: "Atualização com suporte a novos veículos Volvo e Scania 2024.",
    new: true,
  },
  {
    id: 2,
    nome: "AlienTech K-Tag",
    versao: "2.8.0",
    data: "25/12/2024",
    tamanho: "98 MB",
    descricao: "Correções de bugs e melhorias de performance.",
    new: true,
  },
  {
    id: 3,
    nome: "CMD Flash",
    versao: "1.5.4",
    data: "20/12/2024",
    tamanho: "245 MB",
    descricao: "Nova interface e suporte a protocolos adicionais.",
    new: false,
  },
  {
    id: 4,
    nome: "WinOLS",
    versao: "5.0.2",
    data: "15/12/2024",
    tamanho: "320 MB",
    descricao: "Atualização de mapas e melhorias no editor.",
    new: false,
  },
];

export default function Atualizacoes() {
  const { toast } = useToast();
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});

  const handleDownload = (id: number, nome: string) => {
    if (!accepted[id]) {
      toast({
        title: "Aceite os termos",
        description: "Você precisa aceitar a responsabilidade antes de baixar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Download iniciado",
      description: `${nome} está sendo baixado.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atualizações</h1>
        <p className="text-muted-foreground">Baixe as últimas versões dos softwares disponíveis.</p>
      </div>

      <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-warning">Atenção</p>
          <p className="text-sm text-muted-foreground">
            Ao baixar as atualizações, você assume total responsabilidade pelo uso correto das ferramentas.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {atualizacoes.map((atualizacao) => (
          <Card key={atualizacao.id} className="relative overflow-hidden">
            {atualizacao.new && (
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                  Novo
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {atualizacao.nome}
                <span className="text-sm font-normal text-muted-foreground">v{atualizacao.versao}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{atualizacao.descricao}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Data: {atualizacao.data}</span>
                <span>Tamanho: {atualizacao.tamanho}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`accept-${atualizacao.id}`}
                    checked={accepted[atualizacao.id] || false}
                    onCheckedChange={(checked) => 
                      setAccepted(prev => ({ ...prev, [atualizacao.id]: !!checked }))
                    }
                  />
                  <label
                    htmlFor={`accept-${atualizacao.id}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Aceito a responsabilidade pelo uso deste software
                  </label>
                </div>
                <Button
                  variant={accepted[atualizacao.id] ? "hero" : "outline"}
                  onClick={() => handleDownload(atualizacao.id, atualizacao.nome)}
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
