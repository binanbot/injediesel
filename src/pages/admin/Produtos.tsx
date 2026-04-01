import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  ImageIcon,
  Tag,
  Percent,
  DollarSign,
  X,
  Check,
  Eye,
  EyeOff,
  Upload,
  Download,
  Loader2,
  Link as LinkIcon,
  FileSpreadsheet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  sku: string;
  ref: string | null;
  name: string;
  brand: string;
  description_short: string | null;
  description_full: string | null;
  price: number;
  promo_price: number | null;
  promo_type: "percent" | "fixed" | null;
  promo_value: number | null;
  available: boolean;
  category: string | null;
  image_url: string | null;
  models: string[] | null;
  specifications: string[] | null;
  weight_kg: number | null;
  dimensions_mm: string | null;
  created_at: string;
  updated_at: string;
}

type ProductFormData = Omit<Product, "id" | "created_at" | "updated_at">;

const emptyProduct: ProductFormData = {
  sku: "",
  ref: "",
  name: "",
  brand: "PROMAX",
  description_short: "",
  description_full: "",
  price: 0,
  promo_price: null,
  promo_type: null,
  promo_value: null,
  available: true,
  category: "",
  image_url: "",
  models: [],
  specifications: [],
  weight_kg: null,
  dimensions_mm: "",
};

export default function Produtos() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);
  const [modelsInput, setModelsInput] = useState("");
  const [specsInput, setSpecsInput] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
  });

  // Get unique categories from products
  const existingCategories = Array.from(
    new Set(
      products
        ?.map((p) => p.category)
        .filter((c): c is string => !!c && c.trim() !== "")
    )
  ).sort();

  // Create/Update product
  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData & { id?: string }) => {
      // Calculate promo_price if promo is set
      let promo_price: number | null = null;
      if (data.promo_type && data.promo_value) {
        if (data.promo_type === "percent") {
          promo_price = data.price * (1 - data.promo_value / 100);
        } else {
          promo_price = data.price - data.promo_value;
        }
        promo_price = Math.max(0, promo_price);
      }

      const productData = {
        ...data,
        promo_price,
        ref: data.ref || null,
        description_short: data.description_short || null,
        description_full: data.description_full || null,
        category: data.category || null,
        image_url: data.image_url || null,
        dimensions_mm: data.dimensions_mm || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { id, ...insertData } = productData as any;
        const { error } = await supabase.from("products").insert(insertData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
      closeDialog();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto excluído!");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  // Toggle availability
  const toggleAvailability = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ available })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setModelsInput("");
    setSpecsInput("");
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      ref: product.ref || "",
      name: product.name,
      brand: product.brand,
      description_short: product.description_short || "",
      description_full: product.description_full || "",
      price: product.price,
      promo_price: product.promo_price,
      promo_type: product.promo_type,
      promo_value: product.promo_value,
      available: product.available,
      category: product.category || "",
      image_url: product.image_url || "",
      models: product.models || [],
      specifications: product.specifications || [],
      weight_kg: product.weight_kg,
      dimensions_mm: product.dimensions_mm || "",
    });
    setModelsInput((product.models || []).join(", "));
    setSpecsInput((product.specifications || []).join("\n"));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
    setModelsInput("");
    setSpecsInput("");
    setImageInputMode("url");
    setIsUploading(false);
    setShowNewCategory(false);
    setNewCategoryInput("");
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.sku || !formData.name) {
      toast.error("SKU e Nome são obrigatórios");
      return;
    }

    const models = modelsInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const specifications = specsInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    saveMutation.mutate({
      ...formData,
      models,
      specifications,
      id: editingProduct?.id,
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada"); return; }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/export-products`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || 'Erro ao exportar');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produtos_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Arquivo exportado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao exportar produtos");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada"); return; }

      const fd = new FormData();
      fd.append("file", file);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/import-products`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: fd,
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || 'Erro ao importar');
      }

      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setImportDialogOpen(false);

      if (result.errors?.length > 0) {
        toast.warning(`${result.updated} atualizados, ${result.errors.length} erros`);
      } else {
        toast.success(`${result.updated} produtos atualizados com sucesso!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao importar produtos");
    } finally {
      setIsImporting(false);
    }
  };
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const filteredProducts = products?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "uncategorized" && !p.category) ||
      p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Produtos
          </h1>
          <p className="text-muted-foreground">
            Gerencie os produtos da loja
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Exportar
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="uncategorized">Sem categoria</SelectItem>
                {existingCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Produtos ({filteredProducts?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Imagem</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Promoção</TableHead>
                    <TableHead className="text-center">Disponível</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-12 w-12 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category && (
                          <Badge variant="outline">{product.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.promo_price ? (
                          <div>
                            <span className="line-through text-muted-foreground text-sm">
                              {formatPrice(product.price)}
                            </span>
                            <br />
                            <span className="text-green-600 font-medium">
                              {formatPrice(product.promo_price)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.promo_type && product.promo_value && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                            {product.promo_type === "percent" ? (
                              <>{product.promo_value}% OFF</>
                            ) : (
                              <>-{formatPrice(product.promo_value)}</>
                            )}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={product.available}
                          onCheckedChange={(checked) =>
                            toggleAvailability.mutate({
                              id: product.id,
                              available: checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          Nenhum produto encontrado
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do produto abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="PROMAX-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">Referência</Label>
                <Input
                  id="ref"
                  value={formData.ref || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, ref: e.target.value })
                  }
                  placeholder="001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do produto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  placeholder="PROMAX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                {showNewCategory ? (
                  <div className="flex gap-2">
                    <Input
                      id="category"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder="Nova categoria..."
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => {
                        if (newCategoryInput.trim()) {
                          setFormData({ ...formData, category: newCategoryInput.trim() });
                        }
                        setShowNewCategory(false);
                        setNewCategoryInput("");
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategoryInput("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={formData.category || ""}
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setShowNewCategory(true);
                      } else {
                        setFormData({ ...formData, category: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__" className="text-primary font-medium">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Criar nova categoria
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-2">
              <Label htmlFor="description_short">Descrição Curta</Label>
              <Textarea
                id="description_short"
                value={formData.description_short || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description_short: e.target.value })
                }
                placeholder="Descrição breve do produto"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_full">Descrição Completa</Label>
              <Textarea
                id="description_full"
                value={formData.description_full || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description_full: e.target.value })
                }
                placeholder="Descrição detalhada do produto"
                rows={4}
              />
            </div>

            {/* Pricing */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Preços
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Final</Label>
                  <div className="h-9 px-3 py-2 rounded-md border bg-muted text-sm font-medium">
                    {formData.promo_type && formData.promo_value
                      ? formatPrice(
                          formData.promo_type === "percent"
                            ? formData.price * (1 - formData.promo_value / 100)
                            : formData.price - formData.promo_value
                        )
                      : formatPrice(formData.price)}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Preço Promocional
                  </Label>
                  <Switch
                    checked={!!formData.promo_type}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          promo_type: "percent",
                          promo_value: 10,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          promo_type: null,
                          promo_value: null,
                          promo_price: null,
                        });
                      }
                    }}
                  />
                </div>

                {formData.promo_type && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Desconto</Label>
                      <Select
                        value={formData.promo_type}
                        onValueChange={(value: "percent" | "fixed") =>
                          setFormData({ ...formData, promo_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">
                            <span className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Porcentagem
                            </span>
                          </SelectItem>
                          <SelectItem value="fixed">
                            <span className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Valor Fixo
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Valor do Desconto{" "}
                        {formData.promo_type === "percent" ? "(%)" : "(R$)"}
                      </Label>
                      <Input
                        type="number"
                        step={formData.promo_type === "percent" ? "1" : "0.01"}
                        min="0"
                        max={formData.promo_type === "percent" ? "100" : undefined}
                        value={formData.promo_value || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            promo_value: parseFloat(e.target.value) || null,
                          })
                        }
                        placeholder={
                          formData.promo_type === "percent" ? "10" : "50.00"
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image & Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Imagem do Produto</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={imageInputMode === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImageInputMode("url")}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={imageInputMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImageInputMode("upload")}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>

              {imageInputMode === "url" ? (
                <Input
                  id="image_url"
                  value={formData.image_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              ) : (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Clique para selecionar uma imagem
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Máx. 5MB
                        </span>
                      </div>
                    )}
                  </Button>
                </div>
              )}

              {formData.image_url && (
                <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-md"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      {formData.image_url}
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Peso (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight_kg || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weight_kg: parseFloat(e.target.value) || null,
                    })
                  }
                  placeholder="4.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions_mm">Dimensões (mm)</Label>
                <Input
                  id="dimensions_mm"
                  value={formData.dimensions_mm || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dimensions_mm: e.target.value })
                  }
                  placeholder="695 x 113"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="models">Modelos Compatíveis (separar por vírgula)</Label>
              <Input
                id="models"
                value={modelsInput}
                onChange={(e) => setModelsInput(e.target.value)}
                placeholder="A-11, A-12, B-15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specs">Especificações (uma por linha)</Label>
              <Textarea
                id="specs"
                value={specsInput}
                onChange={(e) => setSpecsInput(e.target.value)}
                placeholder="Vazão: 1800 L/h&#10;Autonomia: 200.000 L"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-center gap-2">
                {formData.available ? (
                  <Eye className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="available" className="cursor-pointer">
                    Disponível para venda
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Produtos indisponíveis não aparecem na loja
                  </p>
                </div>
              </div>
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, available: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                "Salvando..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{productToDelete?.name}"? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                productToDelete && deleteMutation.mutate(productToDelete.id)
              }
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Produtos
            </DialogTitle>
            <DialogDescription>
              Envie o arquivo Excel (.xlsx) exportado com as alterações desejadas.
              O sistema atualizará os produtos com base no ID de cada linha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border/40 bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Como usar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique em <strong>Exportar</strong> para baixar a planilha atual</li>
                <li>Edite os campos desejados (preço, nome, SKU, descrição, etc.)</li>
                <li>Não altere a coluna <strong>id</strong></li>
                <li>Salve e envie o arquivo aqui</li>
              </ol>
            </div>
            <input
              ref={importFileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={() => importFileRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Selecionar arquivo .xlsx</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
