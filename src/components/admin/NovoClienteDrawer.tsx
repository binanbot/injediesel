import { useState, useEffect } from "react";
import { Loader2, User, FileText, MapPin, Phone, Mail, Building2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface NovoClienteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Unit {
  id: string;
  name: string;
}

// CPF validation
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
};

// CNPJ validation
const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;

  return true;
};

// Format CPF
const formatCPF = (value: string): string => {
  const clean = value.replace(/\D/g, "").slice(0, 11);
  return clean
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

// Format CNPJ
const formatCNPJ = (value: string): string => {
  const clean = value.replace(/\D/g, "").slice(0, 14);
  return clean
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

// Format phone
const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return clean
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

export function NovoClienteDrawer({ open, onOpenChange, onSuccess }: NovoClienteDrawerProps) {
  const { userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cpf");
  
  const [formData, setFormData] = useState({
    full_name: "",
    cpf: "",
    cnpj: "",
    email: "",
    phone: "",
    address_line: "",
    address_city: "",
    address_state: "",
    active_city: "",
    unit_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFranchisor = userRole === "admin" || userRole === "suporte";

  useEffect(() => {
    if (open && isFranchisor) {
      loadUnits();
    }
  }, [open, isFranchisor]);

  const loadUnits = async () => {
    const { data } = await supabase
      .from("units")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setUnits(data || []);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      cpf: "",
      cnpj: "",
      email: "",
      phone: "",
      address_line: "",
      address_city: "",
      address_state: "",
      active_city: "",
      unit_id: "",
    });
    setErrors({});
    setDocumentType("cpf");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Nome é obrigatório";
    }

    if (documentType === "cpf" && formData.cpf) {
      if (!validateCPF(formData.cpf)) {
        newErrors.cpf = "CPF inválido";
      }
    }

    if (documentType === "cnpj" && formData.cnpj) {
      if (!validateCNPJ(formData.cnpj)) {
        newErrors.cnpj = "CNPJ inválido";
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (isFranchisor && !formData.unit_id) {
      newErrors.unit_id = "Selecione uma unidade";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Get unit_id for franchisee
      let unitId = formData.unit_id;
      
      if (!isFranchisor) {
        // Get the user's unit
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: unitData } = await supabase
            .from("units")
            .select("id")
            .limit(1)
            .maybeSingle();
          
          if (unitData) {
            unitId = unitData.id;
          } else {
            toast.error("Unidade não encontrada. Contate o administrador.");
            return;
          }
        }
      }

      const { error } = await supabase.from("customers").insert({
        unit_id: unitId,
        full_name: formData.full_name.trim(),
        cpf: documentType === "cpf" ? formData.cpf.replace(/\D/g, "") || null : null,
        cnpj: documentType === "cnpj" ? formData.cnpj.replace(/\D/g, "") || null : null,
        email: formData.email.trim() || null,
        phone: formData.phone.replace(/\D/g, "") || null,
        address_line: formData.address_line.trim() || null,
        address_city: formData.address_city.trim() || null,
        address_state: formData.address_state.trim() || null,
        active_city: formData.active_city.trim() || formData.address_city.trim() || null,
      });

      if (error) throw error;

      toast.success("Cliente cadastrado com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Erro ao cadastrar cliente");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const brazilianStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Novo Cliente
          </DrawerTitle>
          <DrawerDescription>
            Preencha os dados do cliente. Campos com * são obrigatórios.
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-4">
            {/* Unit selection for franchisor */}
            {isFranchisor && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Unidade *
                </Label>
                <Select
                  value={formData.unit_id}
                  onValueChange={(value) => updateField("unit_id", value)}
                >
                  <SelectTrigger className={errors.unit_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit_id && (
                  <p className="text-sm text-destructive">{errors.unit_id}</p>
                )}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo *
              </Label>
              <Input
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="Nome do cliente"
                className={errors.full_name ? "border-destructive" : ""}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            {/* Document type selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tipo de Documento
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={documentType === "cpf" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDocumentType("cpf");
                    updateField("cnpj", "");
                  }}
                >
                  CPF (Pessoa Física)
                </Button>
                <Button
                  type="button"
                  variant={documentType === "cnpj" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDocumentType("cnpj");
                    updateField("cpf", "");
                  }}
                >
                  CNPJ (Pessoa Jurídica)
                </Button>
              </div>
            </div>

            {/* CPF or CNPJ */}
            {documentType === "cpf" ? (
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => updateField("cpf", formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className={errors.cpf ? "border-destructive" : ""}
                />
                {errors.cpf && (
                  <p className="text-sm text-destructive">{errors.cpf}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => updateField("cnpj", formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className={errors.cnpj ? "border-destructive" : ""}
                />
                {errors.cnpj && (
                  <p className="text-sm text-destructive">{errors.cnpj}</p>
                )}
              </div>
            )}

            {/* Contact */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="cliente@email.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField("phone", formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Input
                value={formData.address_line}
                onChange={(e) => updateField("address_line", e.target.value)}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.address_city}
                  onChange={(e) => updateField("address_city", e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.address_state}
                  onValueChange={(value) => updateField("address_state", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cidade Ativa (onde o cliente é atendido)</Label>
              <Input
                value={formData.active_city}
                onChange={(e) => updateField("active_city", e.target.value)}
                placeholder="Deixe em branco para usar a cidade do endereço"
              />
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Cliente"
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
