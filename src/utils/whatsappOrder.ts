import type { CartItem } from "@/stores/useCartStore";
import type { DeliveryAddress } from "@/components/franqueado/DeliveryAddressForm";

const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function buildWhatsAppMessage(address: DeliveryAddress, items: CartItem[]) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemsText = items
    .map((item, index) => {
      const subtotal = item.price * item.quantity;
      return (
        `${index + 1}. ${item.name}\n` +
        `Ref: ${item.sku || "-"}\n` +
        `Qtd: ${item.quantity}\n` +
        `Valor unitário: ${formatMoney(item.price)}\n` +
        `Subtotal: ${formatMoney(subtotal)}`
      );
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

*ITENS DO PEDIDO*

${itemsText}

*TOTAL DO PEDIDO: ${formatMoney(total)}*
`.trim();
}
