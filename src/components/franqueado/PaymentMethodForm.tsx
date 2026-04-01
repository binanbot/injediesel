import type { PaymentMethod } from "@/utils/whatsappOrder";
import { getPaymentMethodLabel } from "@/utils/whatsappOrder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard } from "lucide-react";

const paymentOptions: PaymentMethod[] = [
  "pix",
  "boleto",
  "cartao_credito",
  "cartao_debito",
  "transferencia",
  "a_prazo",
  "na_entrega",
];

type Props = {
  value: PaymentMethod;
  note: string;
  onChange: (paymentMethod: PaymentMethod) => void;
  onNoteChange: (note: string) => void;
};

export function PaymentMethodForm({ value, note, onChange, onNoteChange }: Props) {
  return (
    <Card className="border border-amber-600/40 bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Forma de Pagamento
        </CardTitle>
        <CardDescription>
          Essa informação será enviada no pedido para o WhatsApp e salva no histórico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={value} onValueChange={(v) => onChange(v as PaymentMethod)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            {paymentOptions.map((pm) => (
              <SelectItem key={pm} value={pm}>
                {getPaymentMethodLabel(pm)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Observação opcional, ex: faturar em 28 dias"
          className="resize-none"
          rows={2}
        />
      </CardContent>
    </Card>
  );
}
