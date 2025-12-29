import { Download, FileImage, FileText, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const materiais = [
  {
    id: 1,
    nome: "Logo Injediesel - Versão Principal",
    tipo: "Logo",
    formatos: ["PNG", "SVG", "AI"],
    descricao: "Logo principal para uso em materiais institucionais.",
  },
  {
    id: 2,
    nome: "Logo Injediesel - Versão Monocromática",
    tipo: "Logo",
    formatos: ["PNG", "SVG"],
    descricao: "Versão monocromática para fundos coloridos.",
  },
  {
    id: 3,
    nome: "Banner para Fachada",
    tipo: "Banner",
    formatos: ["PSD", "PDF"],
    descricao: "Arte para confecção de banner de fachada padrão.",
  },
  {
    id: 4,
    nome: "Cartão de Visita",
    tipo: "Papelaria",
    formatos: ["PSD", "PDF"],
    descricao: "Modelo de cartão de visita com dados personalizáveis.",
  },
  {
    id: 5,
    nome: "Folder Institucional",
    tipo: "Impresso",
    formatos: ["PDF", "PSD"],
    descricao: "Folder com informações sobre serviços.",
  },
  {
    id: 6,
    nome: "Posts para Redes Sociais",
    tipo: "Digital",
    formatos: ["PSD", "PNG"],
    descricao: "Pack com 10 modelos de posts para Instagram/Facebook.",
  },
  {
    id: 7,
    nome: "Manual de Identidade Visual",
    tipo: "Manual",
    formatos: ["PDF"],
    descricao: "Guia completo de uso da marca Injediesel.",
  },
  {
    id: 8,
    nome: "Adesivos para Veículos",
    tipo: "Adesivo",
    formatos: ["AI", "PDF"],
    descricao: "Modelos de adesivos para aplicação em veículos.",
  },
];

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case "Logo":
    case "Banner":
    case "Adesivo":
      return FileImage;
    case "Digital":
      return Palette;
    default:
      return FileText;
  }
};

const getFormatoColor = (formato: string) => {
  switch (formato) {
    case "PDF":
      return "bg-destructive/20 text-destructive border-destructive/30";
    case "PNG":
      return "bg-success/20 text-success border-success/30";
    case "PSD":
      return "bg-primary/20 text-primary border-primary/30";
    case "AI":
      return "bg-warning/20 text-warning border-warning/30";
    case "SVG":
      return "bg-info/20 text-info border-info/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Materiais() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materiais de Marketing</h1>
        <p className="text-muted-foreground">Baixe os materiais de marketing aprovados para sua unidade.</p>
      </div>

      <div className="grid gap-4">
        {materiais.map((material) => {
          const IconComponent = getTipoIcon(material.tipo);
          return (
            <Card key={material.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-xl bg-secondary">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{material.nome}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{material.descricao}</p>
                      <div className="flex flex-wrap gap-2">
                        {material.formatos.map((formato) => (
                          <span
                            key={formato}
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${getFormatoColor(formato)}`}
                          >
                            {formato}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
