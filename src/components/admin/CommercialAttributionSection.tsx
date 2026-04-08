import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Phone, Store, Users, User, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { fetchActiveSellers, type SellerRow } from "@/services/employeeService";

const channelOptions = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "telefone", label: "Telefone", icon: Phone },
  { value: "balcao", label: "Balcão", icon: Store },
] as const;

export interface CommercialAttributionData {
  seller_profile_id: string;
  sale_channel: string;
  /** Auto-set to current user */
  operator_user_id: string;
}

interface CommercialAttributionSectionProps {
  /** Current customer's primary_seller_id for wallet suggestion */
  primarySellerId?: string | null;
  /** Callback when attribution data changes */
  onChange: (data: Partial<CommercialAttributionData>) => void;
  /** Current values */
  sellerProfileId?: string;
  saleChannel?: string;
  /** Filter sellers: only those who can sell ECU files */
  filterCanSellEcu?: boolean;
  /** Filter sellers: only those who can sell services */
  filterCanSellServices?: boolean;
  /** Whether user can assign to another seller */
  canAssignSeller?: boolean;
}

/**
 * Reusable commercial attribution section for forms.
 * Shows seller selector, sale channel, operator info, and wallet badges.
 */
export function CommercialAttributionSection({
  primarySellerId,
  onChange,
  sellerProfileId = "",
  saleChannel = "",
  filterCanSellEcu,
  filterCanSellServices,
  canAssignSeller = true,
}: CommercialAttributionSectionProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  const companyId = company?.id;

  const [autoSuggested, setAutoSuggested] = useState(false);

  // Fetch eligible sellers
  const { data: sellers = [] } = useQuery({
    queryKey: ["active-sellers-attribution", companyId, filterCanSellEcu, filterCanSellServices],
    queryFn: () =>
      fetchActiveSellers(companyId!, {
        canSellServices: filterCanSellServices,
        canSellProducts: filterCanSellEcu,
      }),
    enabled: !!companyId,
  });

  // Auto-suggest wallet seller when primarySellerId changes
  useEffect(() => {
    if (primarySellerId && !sellerProfileId && sellers.length > 0) {
      const walletSeller = sellers.find((s) => s.seller_profile?.id === primarySellerId);
      if (walletSeller) {
        onChange({ seller_profile_id: walletSeller.seller_profile.id });
        setAutoSuggested(true);
      }
    }
  }, [primarySellerId, sellers, sellerProfileId, onChange]);

  // Wallet status
  const isInWallet = !!primarySellerId && sellerProfileId === primarySellerId;
  const isOutOfWallet = !!primarySellerId && !!sellerProfileId && sellerProfileId !== primarySellerId;
  const hasNoWallet = !primarySellerId;

  const selectedSellerName = useMemo(() => {
    const s = sellers.find((s) => s.seller_profile?.id === sellerProfileId);
    return s?.display_name || "";
  }, [sellers, sellerProfileId]);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Atribuição Comercial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operator (auto) */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Operador: </span>
          <span className="font-medium text-foreground">{user?.email || "—"}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs">auto</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>O operador é registrado automaticamente como quem realizou o lançamento.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Seller */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Vendedor responsável
            {isInWallet && (
              <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Carteira
              </Badge>
            )}
            {isOutOfWallet && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Fora da carteira
              </Badge>
            )}
            {autoSuggested && isInWallet && (
              <span className="text-xs text-muted-foreground">(sugerido)</span>
            )}
          </Label>
          <Select
            value={sellerProfileId}
            onValueChange={(v) => {
              onChange({ seller_profile_id: v });
              setAutoSuggested(false);
            }}
            disabled={!canAssignSeller}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o vendedor" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((s) => (
                <SelectItem key={s.seller_profile.id} value={s.seller_profile.id}>
                  <span className="flex items-center gap-2">
                    {s.display_name || "Sem nome"}
                    {s.seller_profile.id === primarySellerId && (
                      <Badge variant="outline" className="text-[10px] ml-1">carteira</Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasNoWallet && sellerProfileId && (
            <p className="text-xs text-muted-foreground">Cliente sem vendedor na carteira</p>
          )}
        </div>

        {/* Channel */}
        <div className="space-y-2">
          <Label>Canal da venda/atendimento</Label>
          <Select
            value={saleChannel}
            onValueChange={(v) => onChange({ sale_channel: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o canal" />
            </SelectTrigger>
            <SelectContent>
              {channelOptions.map((ch) => (
                <SelectItem key={ch.value} value={ch.value}>
                  <span className="flex items-center gap-2">
                    <ch.icon className="h-4 w-4" />
                    {ch.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
