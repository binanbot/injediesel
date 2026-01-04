import { differenceInHours, differenceInDays, differenceInMinutes } from "date-fns";

export type UrgencyLevel = "neutral" | "attention" | "critical";

export interface TempoDecorridoResult {
  label: string;
  level: UrgencyLevel;
}

/**
 * Calcula tempo decorrido desde uma data e retorna label formatado + nível de urgência
 * Regras:
 * - < 6h: neutro
 * - 6h–24h: atenção  
 * - > 24h: crítico
 */
export function calcularTempoDecorrido(dataStr: string): TempoDecorridoResult {
  // Parse da data no formato DD/MM/YYYY ou DD/MM/YYYY HH:mm
  const [dataPart, horaPart] = dataStr.split(" ");
  const [dia, mes, ano] = dataPart.split("/").map(Number);
  
  let hora = 0, minuto = 0;
  if (horaPart) {
    const [h, m] = horaPart.split(":").map(Number);
    hora = h;
    minuto = m;
  }
  
  const dataArquivo = new Date(ano, mes - 1, dia, hora, minuto);
  const agora = new Date();
  
  const horasDecorridas = differenceInHours(agora, dataArquivo);
  const diasDecorridos = differenceInDays(agora, dataArquivo);
  const minutosDecorridos = differenceInMinutes(agora, dataArquivo);
  
  // Formatar label
  let label: string;
  if (minutosDecorridos < 60) {
    label = `${minutosDecorridos}m`;
  } else if (horasDecorridas < 24) {
    label = `${horasDecorridas}h`;
  } else {
    label = `${diasDecorridos}d`;
  }
  
  // Determinar nível de urgência
  let level: UrgencyLevel;
  if (horasDecorridas < 6) {
    level = "neutral";
  } else if (horasDecorridas < 24) {
    level = "attention";
  } else {
    level = "critical";
  }
  
  return { label, level };
}

/**
 * Calcula tempo decorrido a partir de uma ISO date string
 * Retorna label amigável (ex: "há 2h", "há 3d") + nível de urgência
 */
export function calcularTempoDecorridoISO(isoDateStr: string): TempoDecorridoResult {
  const dataArquivo = new Date(isoDateStr);
  const agora = new Date();
  
  const horasDecorridas = differenceInHours(agora, dataArquivo);
  const diasDecorridos = differenceInDays(agora, dataArquivo);
  const minutosDecorridos = differenceInMinutes(agora, dataArquivo);
  
  // Formatar label amigável
  let label: string;
  if (minutosDecorridos < 1) {
    label = "agora";
  } else if (minutosDecorridos < 60) {
    label = `há ${minutosDecorridos}min`;
  } else if (horasDecorridas < 24) {
    label = `há ${horasDecorridas}h`;
  } else if (diasDecorridos < 7) {
    label = `há ${diasDecorridos}d`;
  } else {
    const semanas = Math.floor(diasDecorridos / 7);
    label = `há ${semanas}sem`;
  }
  
  // Determinar nível de urgência
  let level: UrgencyLevel;
  if (horasDecorridas < 6) {
    level = "neutral";
  } else if (horasDecorridas < 24) {
    level = "attention";
  } else {
    level = "critical";
  }
  
  return { label, level };
}

/**
 * Retorna classes CSS para o badge de tempo baseado no nível de urgência
 */
export function getTempoClasses(level: UrgencyLevel): string {
  switch (level) {
    case "neutral":
      return "bg-muted/50 text-muted-foreground border-muted";
    case "attention":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "critical":
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "bg-muted/50 text-muted-foreground border-muted";
  }
}
