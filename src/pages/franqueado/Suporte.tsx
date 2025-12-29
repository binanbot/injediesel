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

      {/* Contact Channels */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Telefone - Azul Neon */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="cursor-pointer group hover:border-[hsl(217,91%,60%)]/70 transition-all duration-300 hover:shadow-[0_0_30px_hsl(217,91%,60%,0.3)]"
            onClick={handlePhoneClick}
          >
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-[hsl(217,91%,60%)]/20 flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-xl bg-[hsl(217,91%,60%)]/30 animate-pulse" />
                <Phone className="h-7 w-7 text-[hsl(217,91%,60%)] relative z-10 drop-shadow-[0_0_8px_hsl(217,91%,60%)]" />
              </div>
              <h3 className="font-semibold mb-1">Telefone</h3>
              <p className="text-sm text-muted-foreground mb-3">Ligue para nosso suporte</p>
              <Button 
                variant="outline" 
                className="w-full border-[hsl(217,91%,60%)]/50 text-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,60%)]/20 hover:border-[hsl(217,91%,60%)] hover:shadow-[0_0_20px_hsl(217,91%,60%,0.4)] transition-all duration-300 font-semibold"
              >
                <Phone className="h-4 w-4 mr-2" />
                (11) 3000-0000
              </Button>
              <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Seg a Sex, 8h às 18h
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* WhatsApp - Verde Neon */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="cursor-pointer group hover:border-[hsl(142,70%,45%)]/70 transition-all duration-300 hover:shadow-[0_0_30px_hsl(142,70%,45%,0.3)]"
            onClick={handleWhatsAppClick}
          >
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-[hsl(142,70%,45%)]/20 flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-xl bg-[hsl(142,70%,45%)]/30 animate-pulse" />
                <WhatsAppIcon className="h-7 w-7 text-[hsl(142,70%,45%)] relative z-10 drop-shadow-[0_0_8px_hsl(142,70%,45%)]" />
              </div>
              <h3 className="font-semibold mb-1">WhatsApp</h3>
              <p className="text-sm text-muted-foreground mb-3">Atendimento rápido</p>
              <Button 
                variant="outline" 
                className="w-full border-[hsl(142,70%,45%)]/50 text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/20 hover:border-[hsl(142,70%,45%)] hover:shadow-[0_0_20px_hsl(142,70%,45%,0.4)] transition-all duration-300 font-semibold"
              >
                <WhatsAppIcon className="h-4 w-4 mr-2" />
                (11) 99999-9999
              </Button>
              <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Seg a Sex, 8h às 18h
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* E-mail - Laranja Neon */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="cursor-pointer group hover:border-[hsl(25,95%,53%)]/70 transition-all duration-300 hover:shadow-[0_0_30px_hsl(25,95%,53%,0.3)]"
            onClick={handleEmailClick}
          >
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-[hsl(25,95%,53%)]/20 flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-xl bg-[hsl(25,95%,53%)]/30 animate-pulse" />
                <Mail className="h-7 w-7 text-[hsl(25,95%,53%)] relative z-10 drop-shadow-[0_0_8px_hsl(25,95%,53%)]" />
              </div>
              <h3 className="font-semibold mb-1">E-mail</h3>
              <p className="text-sm text-muted-foreground mb-3">Para assuntos detalhados</p>
              <Button 
                variant="outline" 
                className="w-full border-[hsl(25,95%,53%)]/50 text-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,53%)]/20 hover:border-[hsl(25,95%,53%)] hover:shadow-[0_0_20px_hsl(25,95%,53%,0.4)] transition-all duration-300 font-semibold text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                suporte@injediesel.com.br
              </Button>
              <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Resposta em até 24h
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Support Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5 text-primary" />
            Abrir Ticket de Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                rows={6}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button variant="hero" type="submit">
                <Send className="h-4 w-4" />
                Enviar Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Live Chat Widget */}
      <SupportChat />
    </div>
  );
}
