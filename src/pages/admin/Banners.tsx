import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  Image,
  Video,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { BannerCarousel, Banner } from "@/components/BannerCarousel";

// Dados mockados - em produção viriam do banco de dados
const initialBanners: Banner[] = [
  {
    id: "1",
    tipo: "imagem",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop",
    link: "https://example.com/promocao",
    titulo: "Promoção de Fim de Ano",
    ativo: true,
  },
  {
    id: "2",
    tipo: "video",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    link: "https://example.com/evento",
    titulo: "Novo Treinamento Disponível",
    ativo: true,
  },
  {
    id: "3",
    tipo: "imagem",
    url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=400&fit=crop",
    link: "https://example.com/novidades",
    titulo: "Novidades no Sistema",
    ativo: false,
  },
];

export default function AdminBanners() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form state
  const [formTipo, setFormTipo] = useState<"imagem" | "video">("imagem");
  const [formUrl, setFormUrl] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formTitulo, setFormTitulo] = useState("");

  const resetForm = () => {
    setFormTipo("imagem");
    setFormUrl("");
    setFormLink("");
    setFormTitulo("");
    setEditingBanner(null);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setFormTipo(banner.tipo);
    setFormUrl(banner.url);
    setFormLink(banner.link);
    setFormTitulo(banner.titulo || "");
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formUrl || !formLink) {
      toast({
        title: "Campos obrigatórios",
        description: "URL e link de direcionamento são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (banners.filter(b => b.ativo).length >= 3 && !editingBanner) {
      toast({
        title: "Limite atingido",
        description: "Você pode ter no máximo 3 banners ativos.",
        variant: "destructive",
      });
      return;
    }

    if (editingBanner) {
      setBanners(prev =>
        prev.map(b =>
          b.id === editingBanner.id
            ? { ...b, tipo: formTipo, url: formUrl, link: formLink, titulo: formTitulo }
            : b
        )
      );
      toast({ title: "Banner atualizado com sucesso!" });
    } else {
      const newBanner: Banner = {
        id: Date.now().toString(),
        tipo: formTipo,
        url: formUrl,
        link: formLink,
        titulo: formTitulo,
        ativo: true,
      };
      setBanners(prev => [...prev, newBanner]);
      toast({ title: "Banner criado com sucesso!" });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    toast({ title: "Banner removido com sucesso!" });
  };

  const toggleAtivo = (id: string) => {
    const banner = banners.find(b => b.id === id);
    const activeBanners = banners.filter(b => b.ativo);

    if (!banner?.ativo && activeBanners.length >= 3) {
      toast({
        title: "Limite atingido",
        description: "Você pode ter no máximo 3 banners ativos. Desative outro primeiro.",
        variant: "destructive",
      });
      return;
    }

    setBanners(prev =>
      prev.map(b => (b.id === id ? { ...b, ativo: !b.ativo } : b))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Banners</h1>
          <p className="text-muted-foreground">
            Configure os banners exibidos na página inicial dos franqueados (máx. 3 ativos).
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={openNewDialog}>
              <Plus className="h-4 w-4" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Editar Banner" : "Novo Banner"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de mídia *</Label>
                <Select value={formTipo} onValueChange={(v: "imagem" | "video") => setFormTipo(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imagem">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Imagem
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Vídeo (YouTube)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {formTipo === "imagem" ? "URL da imagem *" : "Link do YouTube *"}
                </Label>
                <Input
                  placeholder={
                    formTipo === "imagem"
                      ? "https://exemplo.com/imagem.jpg"
                      : "https://www.youtube.com/watch?v=..."
                  }
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {formTipo === "imagem"
                    ? "Recomendado: 1200x400 pixels"
                    : "Cole o link completo do YouTube"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Link de direcionamento *</Label>
                <Input
                  placeholder="https://exemplo.com/campanha"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Abre em nova aba quando o usuário clicar no banner
                </p>
              </div>

              <div className="space-y-2">
                <Label>Título do banner (opcional)</Label>
                <Input
                  placeholder="Ex: Promoção de Fim de Ano"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button variant="hero" onClick={handleSave}>
                {editingBanner ? "Salvar Alterações" : "Criar Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pré-visualização</CardTitle>
        </CardHeader>
        <CardContent>
          <BannerCarousel banners={banners} />
          {banners.filter(b => b.ativo).length === 0 && (
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">Nenhum banner ativo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Banners */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Todos os Banners ({banners.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum banner cadastrado. Clique em "Novo Banner" para adicionar.
            </div>
          ) : (
            banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  banner.ativo
                    ? "bg-secondary/30 border-border"
                    : "bg-secondary/10 border-border/50 opacity-60"
                }`}
              >
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Thumbnail */}
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {banner.tipo === "imagem" ? (
                    <img
                      src={banner.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {banner.titulo || "Sem título"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {banner.tipo === "imagem" ? (
                      <Image className="h-3 w-3" />
                    ) : (
                      <Video className="h-3 w-3" />
                    )}
                    <span className="capitalize">{banner.tipo}</span>
                    <span>•</span>
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{banner.link}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {banner.ativo ? (
                      <Eye className="h-4 w-4 text-success" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={banner.ativo}
                      onCheckedChange={() => toggleAtivo(banner.id)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(banner)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(banner.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
