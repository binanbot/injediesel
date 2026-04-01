import type { CartItem } from "@/stores/useCartStore";
import type { DeliveryAddress } from "@/components/franqueado/DeliveryAddressForm";

export type PaymentMethod =
  | "pix"
  | "boleto"
  | "cartao_credito"
  | "cartao_debito"
  | "transferencia"
  | "a_prazo"
  | "na_entrega"
  | "nao_definido";

const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case "pix": return "PIX";
    case "boleto": return "Boleto";
    case "cartao_credito": return "Cartão de Crédito";
    case "cartao_debito": return "Cartão de Débito";
    case "transferencia": return "Transferência Bancária";
    case "a_prazo": return "A Prazo";
    case "na_entrega": return "Pagamento na Entrega";
    default: return "Não definido";
  }
};

export function buildWhatsAppMessage(
  address: DeliveryAddress,
  items: CartItem[],
  paymentMethod: PaymentMethod = "nao_definido",
  paymentNote?: string,
) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemsText = items
    .map((item, index) => {
      const subtotal = item.price * item.quantity;
      return [
        `${index + 1}. ${item.name}`,
        `Ref: ${item.sku || "-"}`,
        `Qtd: ${item.quantity}`,
        `Valor unitário: ${formatMoney(item.price)}`,
        `Subtotal: ${formatMoney(subtotal)}`,
      ].join("\n");
    })
    .join("\n\n");

  return `
*NOVO PEDIDO PROMAX*

*DADOS DO FRANQUEADO*
Responsável: ${address.recipient_name}
Razão Social: ${address.company_name}
CNPJ: ${address.cnpj}
Telefone: ${address.phone}
E-mail: ${address.email}

*ENDEREÇO DE ENTREGA*
${address.street}, ${address.number}
${address.complement ? `Complemento: ${address.complement}` : ""}
Bairro: ${address.district}
Cidade: ${address.city} - ${address.state}
CEP: ${address.zip_code}

*FORMA DE PAGAMENTO*
Método: ${getPaymentMethodLabel(paymentMethod)}
${paymentNote ? `Observação de pagamento: ${paymentNote}` : ""}

*ITENS DO PEDIDO*

${itemsText}

*TOTAL DO PEDIDO: ${formatMoney(total)}*
`.trim();
}

export function sendOrderToWhatsApp(
  address: DeliveryAddress,
  items: CartItem[],
  paymentMethod: PaymentMethod = "nao_definido",
  paymentNote?: string,
) {
  const phone = "5545998590384";
  if (!items.length) {
    alert("O carrinho está vazio.");
    return;
  }
  const message = buildWhatsAppMessage(address, items, paymentMethod, paymentNote);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
}
