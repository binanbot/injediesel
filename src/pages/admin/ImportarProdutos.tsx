import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Download,
  Trash2,
  Package,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Product validation schema for raw input
const productRawSchema = z.object({
  sku: z.string().trim().min(1, "SKU obrigatório").max(50, "SKU muito longo"),
  ref: z.string().trim().max(50, "Referência muito longa").optional().nullable(),
  name: z.string().trim().min(1, "Nome obrigatório").max(255, "Nome muito longo"),
  brand: z.string().trim().max(100, "Marca muito longa").optional().nullable(),
  models: z.string().optional().nullable(),
  description_short: z.string().trim().max(500, "Descrição curta muito longa").optional().nullable(),
  description_full: z.string().trim().max(5000, "Descrição completa muito longa").optional().nullable(),
  specifications: z.string().optional().nullable(),
  price: z.string().transform((val) => {
    const num = parseFloat(val.replace(",", ".").replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  }),
  available: z.preprocess(
    (val) => (val === undefined || val === null || val === "") ? "sim" : val,
    z.string().transform((val) => {
      const lower = val.toLowerCase().trim();
      if (lower === "" || lower === undefined) return true;
      if (lower === "não" || lower === "nao" || lower === "false" || lower === "0" || lower === "n") return false;
      return true;
    })
  ),
  category: z.string().trim().max(100, "Categoria muito longa").optional().nullable(),
  weight_kg: z.string().optional().nullable().transform((val) => {
    if (!val) return null;
    const num = parseFloat(val.replace(",", "."));
    return isNaN(num) ? null : num;
  }),
  dimensions_mm: z.string().trim().max(100, "Dimensões muito longas").optional().nullable(),
  image_url: z.string().url("URL inválida").max(500, "URL muito longa").optional().nullable().or(z.literal("")),
});

// Schema for already parsed data (used for inline editing)
const productParsedSchema = z.object({
  sku: z.string().trim().min(1, "SKU obrigatório").max(50, "SKU muito longo"),
  ref: z.string().trim().max(50, "Referência muito longa").optional().nullable(),
  name: z.string().trim().min(1, "Nome obrigatório").max(255, "Nome muito longo"),
  brand: z.string().trim().max(100, "Marca muito longa").optional().nullable(),
  models: z.string().optional().nullable(),
  description_short: z.string().trim().max(500, "Descrição curta muito longa").optional().nullable(),
  description_full: z.string().trim().max(5000, "Descrição completa muito longa").optional().nullable(),
  specifications: z.string().optional().nullable(),
  price: z.number().min(0, "Preço inválido"),
  available: z.boolean(),
  category: z.string().trim().max(100, "Categoria muito longa").optional().nullable(),
  weight_kg: z.number().nullable().optional(),
  dimensions_mm: z.string().trim().max(100, "Dimensões muito longas").optional().nullable(),
  image_url: z.string().url("URL inválida").max(500, "URL muito longa").optional().nullable().or(z.literal("")),
});

type ProductRow = z.infer<typeof productParsedSchema>;

interface ParsedProduct {
  row: number;
  data: ProductRow;
  errors: string[];
  isValid: boolean;
}

interface ImportStats {
  total: number;
  valid: number;
  invalid: number;
  imported: number;
  skipped: number;
}

const CSV_HEADERS = [
  "sku",
  "ref",
  "name",
  "brand",
  "models",
  "description_short",
  "description_full",
  "specifications",
  "price",
  "available",
  "category",
  "weight_kg",
  "dimensions_mm",
  "image_url",
];

export default function ImportarProdutos() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Keep stats derived from current parsedProducts (avoid nested state updates)
  useEffect(() => {
    setStats((prev) => {
      if (!prev) return prev;
      const valid = parsedProducts.filter((p) => p.isValid).length;
      return { ...prev, valid, invalid: prev.total - valid };
    });
  }, [parsedProducts]);

  // Parse CSV file
  const parseCSV = useCallback((content: string): ParsedProduct[] => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Get headers from first line
    const headerLine = lines[0];
    const headers = headerLine.split(";").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

    // Map headers to expected fields
    const headerMap: Record<string, number> = {};
    headers.forEach((h, index) => {
      // Normalize common variations
      const normalized = h
        .replace("código", "sku")
        .replace("codigo", "sku")
        .replace("referência", "ref")
        .replace("referencia", "ref")
        .replace("nome", "name")
        .replace("marca", "brand")
        .replace("modelos", "models")
        .replace("descrição_curta", "description_short")
        .replace("descricao_curta", "description_short")
        .replace("descrição", "description_short")
        .replace("descricao", "description_short")
        .replace("descrição_completa", "description_full")
        .replace("descricao_completa", "description_full")
        .replace("especificações", "specifications")
        .replace("especificacoes", "specifications")
        .replace("preço", "price")
        .replace("preco", "price")
        .replace("valor", "price")
        .replace("disponível", "available")
        .replace("disponivel", "available")
        .replace("categoria", "category")
        .replace("peso", "weight_kg")
        .replace("peso_kg", "weight_kg")
        .replace("dimensões", "dimensions_mm")
        .replace("dimensoes", "dimensions_mm")
        .replace("imagem", "image_url")
        .replace("imagem_url", "image_url");
      
      if (CSV_HEADERS.includes(normalized)) {
        headerMap[normalized] = index;
      }
    });

    // Parse data rows
    const products: ParsedProduct[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Parse CSV line (handle quoted values with semicolons)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ";" && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ""));

      // Build product object
      const rawProduct: Record<string, string> = {};
      CSV_HEADERS.forEach((header) => {
        const index = headerMap[header];
        rawProduct[header] = index !== undefined ? (values[index] || "") : "";
      });

      // Validate
      const result = productRawSchema.safeParse(rawProduct);
      
      if (result.success) {
        products.push({
          row: i + 1,
          data: result.data,
          errors: [],
          isValid: true,
        });
      } else {
        const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        products.push({
          row: i + 1,
          data: rawProduct as any,
          errors,
          isValid: false,
        });
      }
    }

    return products;
  }, []);

  // Update a single product in the list
  const updateProduct = useCallback((row: number, field: keyof ProductRow, value: any) => {
    setParsedProducts((prev) => {
      const newProducts = [...prev];
      const index = newProducts.findIndex((p) => p.row === row);
      if (index === -1) return prev;

      const updatedData = { ...newProducts[index].data, [field]: value };

      // Revalidate
      const result = productParsedSchema.safeParse(updatedData);

      if (result.success) {
        newProducts[index] = {
          ...newProducts[index],
          data: result.data,
          errors: [],
          isValid: true,
        };
      } else {
        const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        newProducts[index] = {
          ...newProducts[index],
          data: updatedData,
          errors,
          isValid: false,
        };
      }

      return newProducts;
    });
  }, []);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setFile(selectedFile);
    setParsedProducts([]);
    setStats(null);

    try {
      const content = await selectedFile.text();
      const products = parseCSV(content);
      
      setParsedProducts(products);
      setStats({
        total: products.length,
        valid: products.filter((p) => p.isValid).length,
        invalid: products.filter((p) => !p.isValid).length,
        imported: 0,
        skipped: 0,
      });
    } catch (error) {
      toast.error("Erro ao ler arquivo CSV");
      console.error(error);
    }
  };

  // Import products
  const importProducts = useMutation({
    mutationFn: async () => {
      const validProducts = parsedProducts.filter((p) => p.isValid);
      if (validProducts.length === 0) {
        throw new Error("Nenhum produto válido para importar");
      }

      setImporting(true);
      setImportProgress(0);

      let imported = 0;
      let skipped = 0;
      const batchSize = 50;
      const batches = Math.ceil(validProducts.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batch = validProducts.slice(i * batchSize, (i + 1) * batchSize);
        
        const productsToInsert = batch.map((p) => ({
          sku: p.data.sku,
          ref: p.data.ref || null,
          name: p.data.name,
          brand: p.data.brand || "PROMAX",
          models: p.data.models ? p.data.models.split(",").map((m) => m.trim()) : [],
          description_short: p.data.description_short || null,
          description_full: p.data.description_full || null,
          specifications: p.data.specifications ? p.data.specifications.split("|").map((s) => s.trim()) : [],
          price: p.data.price,
          available: p.data.available,
          category: p.data.category || null,
          weight_kg: p.data.weight_kg,
          dimensions_mm: p.data.dimensions_mm || null,
          image_url: p.data.image_url || null,
        }));

        // Upsert products (update if SKU exists)
        const { data, error } = await supabase
          .from("products")
          .upsert(productsToInsert, { onConflict: "sku" })
          .select();

        if (error) {
          console.error("Batch error:", error);
          skipped += batch.length;
        } else {
          imported += data?.length || 0;
        }

        setImportProgress(Math.round(((i + 1) / batches) * 100));
      }

      return { imported, skipped };
    },
    onSuccess: (result) => {
      setStats((prev) => prev ? { ...prev, imported: result.imported, skipped: result.skipped } : null);
      toast.success(`${result.imported} produtos importados com sucesso!`);
      setImporting(false);
    },
    onError: (error) => {
      toast.error("Erro na importação: " + error.message);
      setImporting(false);
    },
  });

  // Download template
  const downloadTemplate = () => {
    const header = CSV_HEADERS.join(";");
    const example = [
      "PROMAX-001",
      "001",
      "Filtro Diesel Pro",
      "PROMAX",
      "A-11,A-12",
      "Filtro para abastecimento diesel",
      "Filtro completo para tanques de abastecimento",
      "Vazão: 1800 L/h|Autonomia: 200.000 L",
      "2950.00",
      "sim",
      "Filtros",
      "4.3",
      "695 x 113",
      "https://exemplo.com/imagem-produto.jpg",
    ].join(";");

    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_produtos.csv";
    link.click();
  };

  // Reset
  const resetImport = () => {
    setFile(null);
    setParsedProducts([]);
    setStats(null);
    setImportProgress(0);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Importar Produtos</h1>
        <p className="text-muted-foreground">
          Importe produtos em massa via arquivo CSV
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Instruções
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Formato do arquivo:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Arquivo CSV com separador ponto e vírgula (;)</li>
                <li>Primeira linha deve conter os cabeçalhos</li>
                <li>Codificação UTF-8</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Campos obrigatórios:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><code className="text-xs bg-muted px-1 rounded">sku</code> - Código único do produto</li>
                <li><code className="text-xs bg-muted px-1 rounded">name</code> - Nome do produto</li>
                <li><code className="text-xs bg-muted px-1 rounded">price</code> - Preço (ex: 1250.00)</li>
              </ul>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Campos opcionais:</p>
            <div className="flex flex-wrap gap-2">
              {["ref", "brand", "models", "description_short", "description_full", "specifications", "available", "category", "weight_kg", "dimensions_mm", "image_url"].map((field) => (
                <Badge key={field} variant="outline" className="font-mono text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Baixar modelo CSV
          </Button>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload do arquivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Clique para selecionar</span> ou arraste o arquivo
                </p>
                <p className="text-xs text-muted-foreground">Arquivo CSV (separador: ;)</p>
              </div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={resetImport}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total de linhas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{stats.valid}</div>
              <p className="text-sm text-muted-foreground">Válidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{stats.invalid}</div>
              <p className="text-sm text-muted-foreground">Com erros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{stats.imported}</div>
              <p className="text-sm text-muted-foreground">Importados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Errors */}
      {parsedProducts.some((p) => !p.isValid) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {parsedProducts.filter((p) => !p.isValid).length} produto(s) com erros de validação. Edite diretamente na tabela abaixo para corrigir.
          </AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {parsedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Preview dos produtos
            </CardTitle>
            <CardDescription>
              Clique nos campos para editar diretamente antes de importar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Linha</TableHead>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead className="min-w-[100px]">SKU</TableHead>
                    <TableHead className="min-w-[200px]">Nome</TableHead>
                    <TableHead className="min-w-[120px]">Categoria</TableHead>
                    <TableHead className="min-w-[100px] text-right">Preço</TableHead>
                    <TableHead className="min-w-[150px]">Imagem URL</TableHead>
                    <TableHead className="min-w-[80px]">Disponível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedProducts.slice(0, 100).map((product) => (
                    <EditableProductRow
                      key={product.row}
                      product={product}
                      onUpdate={updateProduct}
                      formatPrice={formatPrice}
                    />
                  ))}
                </TableBody>
              </Table>
              {parsedProducts.length > 100 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Mostrando 100 de {parsedProducts.length} produtos
                </p>
              )}
            </ScrollArea>

            {/* Import Progress */}
            {importing && (
              <div className="mt-4 space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Importando... {importProgress}%
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={resetImport} disabled={importing}>
                Cancelar
              </Button>
              <Button
                onClick={() => importProducts.mutate()}
                disabled={importing || stats?.valid === 0}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {stats?.valid || 0} produtos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Editable row component
interface EditableProductRowProps {
  product: ParsedProduct;
  onUpdate: (row: number, field: keyof ProductRow, value: any) => void;
  formatPrice: (value: number) => string;
}

type EditableField = Extract<keyof ProductRow, "sku" | "name" | "category" | "price" | "image_url">;

function EditableProductRow({ product, onUpdate, formatPrice }: EditableProductRowProps) {
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const skuRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);

  const getRef = (field: EditableField) => {
    switch (field) {
      case "sku":
        return skuRef;
      case "name":
        return nameRef;
      case "category":
        return categoryRef;
      case "price":
        return priceRef;
      case "image_url":
        return imageUrlRef;
      default:
        return skuRef;
    }
  };

  useEffect(() => {
    if (!editingField) return;
    const ref = getRef(editingField);
    // Wait a frame so the element is visible before focusing
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select?.();
    });
  }, [editingField]);

  const startEditing = (field: EditableField, currentValue: any) => {
    setEditingField(field);
    // Keep raw value while editing (especially for price)
    setTempValue(currentValue === null || currentValue === undefined ? "" : String(currentValue));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
  };

  const saveEdit = () => {
    if (!editingField) return;

    const fieldToUpdate = editingField;
    let value: any = tempValue;

    if (fieldToUpdate === "price") {
      value = parseFloat(tempValue.replace(",", ".").replace(/[^\d.]/g, "")) || 0;
    }

    cancelEditing();
    onUpdate(product.row, fieldToUpdate, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const renderEditableCell = (
    field: EditableField,
    value: any,
    displayValue: React.ReactNode,
    className?: string,
  ) => {
    const isEditing = editingField === field;

    return (
      <div className="min-h-[28px]">
        {/* Display (kept mounted to avoid DOM remove/insert race conditions) */}
        <div
          className={cn(
            "cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 group flex items-center gap-1",
            className,
            isEditing && "hidden",
          )}
          onClick={() => startEditing(field, value)}
        >
          {displayValue}
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Editor (also kept mounted) */}
        <div className={cn("flex items-center gap-1", className, !isEditing && "hidden")}>
          <Input
            ref={getRef(field)}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onMouseDown={(e) => e.preventDefault()}
            onClick={saveEdit}
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancelEditing}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <TableRow className={cn(!product.isValid && "bg-destructive/5")}>
      <TableCell className="font-mono text-xs">{product.row}</TableCell>
      <TableCell>
        {product.isValid ? (
          <CheckCircle className="h-4 w-4 text-success" />
        ) : (
          <div className="relative group">
            <XCircle className="h-4 w-4 text-destructive cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2 bg-popover border rounded-lg shadow-lg text-xs">
              {product.errors.map((e, i) => (
                <p key={i} className="text-destructive">
                  {e}
                </p>
              ))}
            </div>
          </div>
        )}
      </TableCell>

      <TableCell className="font-mono text-xs">
        {renderEditableCell("sku", product.data.sku, product.data.sku)}
      </TableCell>

      <TableCell className="max-w-[200px]">
        {renderEditableCell(
          "name",
          product.data.name,
          <span className="truncate block">{product.data.name}</span>,
        )}
      </TableCell>

      <TableCell>
        {renderEditableCell(
          "category",
          product.data.category,
          product.data.category ? (
            <Badge variant="secondary" className="text-xs">
              {product.data.category}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
        )}
      </TableCell>

      <TableCell className="text-right font-medium">
        {renderEditableCell(
          "price",
          product.data.price,
          typeof product.data.price === "number" ? formatPrice(product.data.price) : String(product.data.price),
          "justify-end",
        )}
      </TableCell>

      <TableCell>
        {renderEditableCell(
          "image_url",
          product.data.image_url,
          product.data.image_url ? (
            <a
              href={product.data.image_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs truncate max-w-[100px] inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Ver imagem
            </a>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
        )}
      </TableCell>

      <TableCell>
        <Switch checked={product.data.available as boolean} onCheckedChange={(checked) => onUpdate(product.row, "available", checked)} />
      </TableCell>
    </TableRow>
  );
}
