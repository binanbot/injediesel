import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para gerar signed URLs para arquivos em buckets privados
 * @param bucket Nome do bucket
 * @param path Caminho do arquivo no bucket
 * @param expiresIn Tempo de expiração em segundos (padrão: 1 hora)
 */
export function useSignedUrl(
  bucket: string | null,
  path: string | null,
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bucket || !path) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error("Erro ao gerar signed URL:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [bucket, path, expiresIn]);

  return { signedUrl, loading, error };
}

/**
 * Função utilitária para extrair o path do arquivo a partir de uma URL pública do Supabase Storage
 * @param publicUrl URL pública do arquivo
 * @param bucket Nome do bucket
 */
export function extractPathFromPublicUrl(
  publicUrl: string | null | undefined,
  bucket: string
): string | null {
  if (!publicUrl) return null;

  try {
    // Pattern: .../storage/v1/object/public/{bucket}/{path}
    const regex = new RegExp(
      `storage/v1/object/public/${bucket}/(.+)$`
    );
    const match = publicUrl.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Função utilitária para gerar signed URL de forma assíncrona
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Erro ao gerar signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Erro ao gerar signed URL:", err);
    return null;
  }
}
