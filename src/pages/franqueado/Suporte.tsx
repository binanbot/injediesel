import { HeadphonesIcon, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import SupportChat from "@/components/franqueado/SupportChat";

// WhatsApp SVG Icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Suporte() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Ticket enviado!",
      description: "Nossa equipe entrará em contato em breve.",
    });
  };

  const handlePhoneClick = () => {
    window.location.href = "tel:+551130000000";
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/5511999999999?text=Olá! Preciso de suporte.", "_blank");
  };

  const handleEmailClick = () => {
    window.location.href = "mailto:suporte@injediesel.com.br?subject=Suporte Injediesel";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">Entre em contato com nossa equipe de suporte.</p>
      </div>

      {/* Support Form - Destaque Neon no Topo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="relative overflow-hidden border-[hsl(180,100%,40%)]/40 shadow-[0_0_40px_hsl(180,100%,40%,0.15)] bg-gradient-to-br from-[hsl(180,100%,40%)]/5 to-transparent">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(180,100%,40%)]/10 via-transparent to-[hsl(200,100%,50%)]/10 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[hsl(180,100%,40%)]/20 flex items-center justify-center">
                <HeadphonesIcon className="h-5 w-5 text-[hsl(180,100%,40%)] drop-shadow-[0_0_6px_hsl(180,100%,40%)]" />
              </div>
              <span className="text-[hsl(180,100%,50%)] drop-shadow-[0_0_8px_hsl(180,100%,40%,0.5)]">
                Abrir Ticket de Suporte
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Suporte Técnico</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="contrato">Contrato</SelectItem>
                      <SelectItem value="sistema">Sistema / Plataforma</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input placeholder="Descreva brevemente o problema" required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva detalhadamente o problema ou dúvida..."
                  rows={5}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-[hsl(180,100%,35%)] to-[hsl(200,100%,45%)] hover:from-[hsl(180,100%,40%)] hover:to-[hsl(200,100%,50%)] text-white shadow-[0_0_20px_hsl(180,100%,40%,0.4)] hover:shadow-[0_0_30px_hsl(180,100%,40%,0.6)] transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                  Enviar Ticket
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Channels - Compacto no Final */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Canais de contato direto</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {/* Telefone - Azul Neon */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card 
              className="cursor-pointer hover:border-[hsl(217,91%,60%)]/50 transition-all duration-300 hover:shadow-[0_0_20px_hsl(217,91%,60%,0.2)]"
              onClick={handlePhoneClick}
            >
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(217,91%,60%)]/15 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-[hsl(217,91%,60%)] drop-shadow-[0_0_4px_hsl(217,91%,60%)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm">Telefone</h4>
                  <p className="text-xs text-muted-foreground truncate">(11) 3000-0000</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  8h-18h
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* WhatsApp - Verde Neon */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card 
              className="cursor-pointer hover:border-[hsl(142,70%,45%)]/50 transition-all duration-300 hover:shadow-[0_0_20px_hsl(142,70%,45%,0.2)]"
              onClick={handleWhatsAppClick}
            >
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(142,70%,45%)]/15 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="h-5 w-5 text-[hsl(142,70%,45%)] drop-shadow-[0_0_4px_hsl(142,70%,45%)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm">WhatsApp</h4>
                  <p className="text-xs text-muted-foreground truncate">(11) 99999-9999</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  8h-18h
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* E-mail - Laranja Neon */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card 
              className="cursor-pointer hover:border-[hsl(25,95%,53%)]/50 transition-all duration-300 hover:shadow-[0_0_20px_hsl(25,95%,53%,0.2)]"
              onClick={handleEmailClick}
            >
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(25,95%,53%)]/15 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[hsl(25,95%,53%)] drop-shadow-[0_0_4px_hsl(25,95%,53%)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm">E-mail</h4>
                  <p className="text-xs text-muted-foreground truncate">suporte@injediesel.com.br</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  24h
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Live Chat Widget */}
      <SupportChat />
    </div>
  );
}
