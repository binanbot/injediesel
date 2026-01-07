import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileIcon, Download, ExternalLink, Loader2 } from "lucide-react";
import { createSignedUrl } from "@/hooks/useSignedUrl";

interface SecureAttachmentProps {
  attachmentPath: string | null | undefined;
  attachmentName: string | null | undefined;
  bucket?: string;
  showPreview?: boolean;
  className?: string;
}

/**
 * Verifica se o path parece ser uma URL pública antiga (para retrocompatibilidade)
 */
function isLegacyPublicUrl(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

/**
 * Extrai o path de uma URL pública do Supabase Storage
 */
function extractPathFromUrl(url: string, bucket: string): string | null {
  try {
    const regex = new RegExp(`storage/v1/object/public/${bucket}/(.+)$`);
    const match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Verifica se é um arquivo de imagem
 */
function isImageFile(filename: string | null | undefined): boolean {
  if (!filename) return false;
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const lowerName = filename.toLowerCase();
  return imageExtensions.some((ext) => lowerName.endsWith(ext));
}

export function SecureAttachment({
  attachmentPath,
  attachmentName,
  bucket = "support-attachments",
  showPreview = true,
  className = "",
}: SecureAttachmentProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attachmentPath) {
      setSignedUrl(null);
      return;
    }

    const generateUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Verifica se é uma URL pública antiga (retrocompatibilidade)
        if (isLegacyPublicUrl(attachmentPath)) {
          const extractedPath = extractPathFromUrl(attachmentPath, bucket);
          if (extractedPath) {
            const url = await createSignedUrl(bucket, extractedPath);
            setSignedUrl(url);
          } else {
            // Fallback para URL antiga se não conseguir extrair o path
            setSignedUrl(attachmentPath);
          }
        } else {
          // Path direto - gerar signed URL
          const url = await createSignedUrl(bucket, attachmentPath);
          setSignedUrl(url);
        }
      } catch (err) {
        console.error("Erro ao gerar URL segura:", err);
        setError("Não foi possível carregar o anexo");
      } finally {
        setLoading(false);
      }
    };

    generateUrl();
  }, [attachmentPath, bucket]);

  if (!attachmentPath) return null;

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando anexo...</span>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`flex items-center gap-2 text-destructive ${className}`}>
        <FileIcon className="h-4 w-4" />
        <span className="text-sm">{error || "Anexo indisponível"}</span>
      </div>
    );
  }

  const isImage = isImageFile(attachmentName || attachmentPath);

  return (
    <div className={`rounded-lg bg-[hsl(180,100%,40%)]/10 border border-[hsl(180,100%,40%)]/30 p-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[hsl(180,100%,40%)]/20 flex items-center justify-center">
          <FileIcon className="h-5 w-5 text-[hsl(180,100%,40%)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Anexo do Ticket</p>
          <p className="text-xs text-muted-foreground truncate">
            {attachmentName || "Arquivo anexado"}
          </p>
        </div>
        <div className="flex gap-2">
          {isImage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(signedUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a
              href={signedUrl}
              download={attachmentName}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4 mr-1" />
              Baixar
            </a>
          </Button>
        </div>
      </div>
      {showPreview && isImage && (
        <div className="mt-3">
          <img
            src={signedUrl}
            alt="Anexo"
            className="max-h-48 rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
