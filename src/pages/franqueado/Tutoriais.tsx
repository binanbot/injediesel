import { Play, Clock, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const tutoriais = [
  {
    id: 1,
    titulo: "Como enviar arquivos corretamente",
    descricao: "Aprenda o passo a passo para enviar seus arquivos de ECU sem erros.",
    duracao: "8 min",
    categoria: "Básico",
    imagem: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop",
  },
  {
    id: 2,
    titulo: "Entendendo os status dos arquivos",
    descricao: "Saiba o que significa cada status e como acompanhar seus pedidos.",
    duracao: "5 min",
    categoria: "Básico",
    imagem: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
  },
  {
    id: 3,
    titulo: "Leitura de ECU - Boas práticas",
    descricao: "Dicas importantes para realizar leituras seguras e completas.",
    duracao: "12 min",
    categoria: "Avançado",
    imagem: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop",
  },
  {
    id: 4,
    titulo: "Utilizando o KESSv2",
    descricao: "Tutorial completo sobre o uso do AlienTech KESSv2.",
    duracao: "20 min",
    categoria: "Ferramentas",
    imagem: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=250&fit=crop",
  },
  {
    id: 5,
    titulo: "Identificação de ECUs",
    descricao: "Como identificar corretamente o tipo de ECU do veículo.",
    duracao: "15 min",
    categoria: "Avançado",
    imagem: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=250&fit=crop",
  },
  {
    id: 6,
    titulo: "Resolução de problemas comuns",
    descricao: "Soluções para os erros mais frequentes durante a leitura.",
    duracao: "10 min",
    categoria: "Suporte",
    imagem: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop",
  },
];

const getCategoriaColor = (categoria: string) => {
  switch (categoria) {
    case "Básico":
      return "bg-success/20 text-success border-success/30";
    case "Avançado":
      return "bg-warning/20 text-warning border-warning/30";
    case "Ferramentas":
      return "bg-primary/20 text-primary border-primary/30";
    case "Suporte":
      return "bg-info/20 text-info border-info/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Tutoriais() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tutoriais</h1>
        <p className="text-muted-foreground">Aprenda a utilizar o sistema e as ferramentas disponíveis.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutoriais.map((tutorial) => (
          <Card key={tutorial.id} className="overflow-hidden group hover:border-primary/50 transition-all">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={tutorial.imagem}
                alt={tutorial.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary-foreground ml-1" />
                </div>
              </div>
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoriaColor(tutorial.categoria)}`}>
                  {tutorial.categoria}
                </span>
              </div>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                {tutorial.titulo}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{tutorial.descricao}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {tutorial.duracao}
                </div>
                <Button variant="ghost" size="sm">
                  Saiba mais
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
