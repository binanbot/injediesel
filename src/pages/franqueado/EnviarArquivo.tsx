import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  X,
  FileIcon,
  Search,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const servicos = [
  "Stage 1",
  "Stage 2",
  "DPF Off",
  "EGR Off",
  "AdBlue Off",
  "DTC Off",
  "Speed Limiter Off",
  "Hot Start Fix",
  "Outro",
];

const categorias = [
  "Caminhão",
  "Ônibus",
  "Máquina Agrícola",
  "Máquina de Construção",
  "Veículo de Passeio",
  "Outro",
];

const marcas = [
  "Volvo",
  "Scania",
  "Mercedes-Benz",
  "DAF",
  "MAN",
  "Iveco",
  "Ford",
  "Volkswagen",
  "John Deere",
  "Case",
  "New Holland",
  "Caterpillar",
  "Outro",
];

const transmissoes = ["Manual", "Automática", "Automatizada"];

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export default function EnviarArquivo() {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast({
        title: "Arquivo enviado com sucesso!",
        description: "Você receberá uma notificação quando o processamento for concluído.",
      });
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Arquivo Enviado!</h2>
          <p className="text-muted-foreground mb-6">
            Obrigado por enviar seu arquivo. Nossa equipe irá processá-lo e você receberá uma notificação assim que estiver pronto.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Enviar Outro
            </Button>
            <Button variant="hero" onClick={() => window.location.href = "/franqueado/arquivos"}>
              Ver Meus Arquivos
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enviar Arquivo</h1>
        <p className="text-muted-foreground">Preencha os dados abaixo para enviar seu arquivo de ECU.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Serviço e Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Serviço a ser executado *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Veículo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placa *</Label>
                <div className="relative">
                  <Input placeholder="ABC-1234" required />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Consulta automática disponível via API
                </p>
              </div>
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input placeholder="Ex: FH 540" required />
              </div>
              <div className="space-y-2">
                <Label>Motor / Cilindrada</Label>
                <Input placeholder="Ex: D13A 540" />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Transmissão</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {transmissoes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano / Modelo *</Label>
                <Input placeholder="Ex: 2020/2021" required />
              </div>
              <div className="space-y-2">
                <Label>Horas do veículo</Label>
                <Input placeholder="Ex: 15.000" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload de Arquivos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload de Arquivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                multiple
                accept=".bin,.ori,.kfg,.bck,.eprom,.zip,.rar"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">Arraste arquivos aqui ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: .bin, .ori, .kfg, .bck, .eprom, .zip, .rar
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Limite máximo: 256 MB
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione informações adicionais sobre o serviço..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit" variant="hero" disabled={isSubmitting || files.length === 0}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar Arquivo
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
