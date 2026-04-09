import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Loader2, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { useAuth, getHomeRouteForRole } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCompany } from "@/hooks/useCompany";
import { useChannel } from "@/hooks/useChannel";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, signIn, signUp, isLoading: authLoading } = useAuth();
  const { company } = useCompany();
  const brandName = company?.brand_name || company?.name || "Injediesel";
  const isPromax = company?.slug === "promax-tuner";
  const equipmentName = company?.settings?.proprietary_equipment_name;
  const contacts = company?.contacts;
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [telefone, setTelefone] = useState("");
  const [tipoRepresentante, setTipoRepresentante] = useState<"existente" | "novo">("existente");

  const { channel } = useChannel();

  // Determine if we're in channel mode (hostname-based routing)
  const hasExplicitChannel = new URLSearchParams(window.location.search).has("channel");
  const hasHostnameChannel = !!(company as any)?.channel_type;
  const isChannelMode = hasExplicitChannel || hasHostnameChannel;

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading && userRole) {
      if (isChannelMode) {
        navigate("/");
      } else {
        navigate(getHomeRouteForRole(userRole));
      }
    }
  }, [user, userRole, authLoading, navigate, isChannelMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setIsLoading(false);
      toast({
        title: "Erro ao fazer login",
        description: error.message === "Invalid login credentials" 
          ? "E-mail ou senha incorretos." 
          : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login realizado com sucesso!",
      description: "Redirecionando...",
    });
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setIsLoading(false);
      toast({
        title: "Erro ao criar conta",
        description: error.message === "User already registered"
          ? "Este e-mail já está cadastrado."
          : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada com sucesso!",
      description: "Você já pode fazer login.",
    });
    setIsLoading(false);
    setActiveTab("login");
    setPassword("");
    setConfirmPassword("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card p-8 rounded-2xl"
        >
          <Link
            to={company?.slug && company.slug !== "injediesel" ? `/?brand=${company.slug}` : "/"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>

          {equipmentName && (
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                Equipamento {equipmentName}
              </span>
            </div>
          )}

          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <h1 className="text-2xl font-bold mb-2 text-center">
                {isPromax ? "Painel PROMAX TUNER" : "Bem-vindo de volta"}
              </h1>
              <p className="text-muted-foreground mb-6 text-center">
                {isPromax
                  ? "Acesse sua plataforma de reprogramação ECU."
                  : "Entre com suas credenciais para acessar o sistema."}
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link
                      to="/esqueci-senha"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <h1 className="text-2xl font-bold mb-2 text-center">Criar conta</h1>
              <p className="text-muted-foreground mb-6 text-center">
                Preencha os dados para criar sua conta.
              </p>

              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      required
                      className="h-12 pl-12"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tipo de representante</Label>
                  <RadioGroup
                    value={tipoRepresentante}
                    onValueChange={(value) => setTipoRepresentante(value as "existente" | "novo")}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer">
                      <RadioGroupItem value="existente" id="existente" />
                      <Label htmlFor="existente" className="cursor-pointer flex-1 font-normal">
                        Já sou representante {brandName}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer">
                      <RadioGroupItem value="novo" id="novo" />
                      <Label htmlFor="novo" className="cursor-pointer flex-1 font-normal">
                        Quero me tornar um representante {brandName}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-center text-sm text-muted-foreground mb-3">
              Precisa de ajuda? Entre em contato:
            </p>
            <div className="flex items-center justify-center gap-4">
              {(contacts?.phone || !contacts) && (
                <a
                  href={`tel:${contacts?.phone || "+5500000000000"}`}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {contacts?.phone || "(00) 0000-0000"}
                </a>
              )}
              {(contacts?.whatsapp || !contacts) && (
                <a
                  href={`https://wa.me/${(contacts?.whatsapp || "5500000000000").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-500 hover:text-green-400 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
