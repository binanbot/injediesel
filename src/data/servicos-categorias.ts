// Categorias de serviços com filtro dinâmico
export interface ServicoItem {
  nome: string;
  avisoLegal?: boolean; // Exige aviso legal e checkbox
  apenasRevendaFull?: boolean; // Apenas para revendas Full
  areas?: ('leves' | 'pesados' | 'agro')[]; // Áreas compatíveis
}

export interface CategoriaServico {
  id: string;
  emoji: string;
  nome: string;
  servicos: ServicoItem[];
}

export const categoriasServicos: CategoriaServico[] = [
  {
    id: "performance",
    emoji: "🏁",
    nome: "Performance",
    servicos: [
      { nome: "Stage 1" },
      { nome: "Stage 2" },
      { nome: "Stage 3", apenasRevendaFull: true },
      { nome: "Custom Stage (Mapa personalizado)", apenasRevendaFull: true },
      { nome: "Economy Tune (Redução de consumo)" },
      { nome: "Torque Limiter Removal" },
      { nome: "Throttle Response Improvement" },
      { nome: "Boost Pressure Adjustment" },
      { nome: "Rail Pressure Optimization" },
      { nome: "Turbo Optimization" },
      { nome: "Launch Control", apenasRevendaFull: true },
      { nome: "Flat Shift", apenasRevendaFull: true },
      { nome: "Rev Limiter Adjustment" },
      { nome: "Popcorn / Hard Cut Rev Limiter", apenasRevendaFull: true },
      { nome: "Pops and Bangs (Crackle Map)", apenasRevendaFull: true },
      { nome: "Burble Tune", apenasRevendaFull: true },
    ],
  },
  {
    id: "emissoes",
    emoji: "🌱",
    nome: "Emissões",
    servicos: [
      { nome: "DPF Off", avisoLegal: true },
      { nome: "DPF Regeneration Fix" },
      { nome: "DPF Monitoring Adjustment" },
      { nome: "EGR Off", avisoLegal: true },
      { nome: "EGR Cooler Bypass", avisoLegal: true },
      { nome: "AdBlue Off", avisoLegal: true },
      { nome: "SCR Off", avisoLegal: true },
      { nome: "NOx Sensor Off", avisoLegal: true },
      { nome: "Lambda / O2 Sensor Off", avisoLegal: true },
      { nome: "Swirl Flaps Off" },
      { nome: "Secondary Air Pump Off" },
      { nome: "Cold Start Delete" },
      { nome: "Exhaust Flap Control" },
    ],
  },
  {
    id: "diagnostico",
    emoji: "⚠️",
    nome: "Diagnóstico",
    servicos: [
      { nome: "DTC Off (Todos)" },
      { nome: "Selective DTC Off (Códigos específicos)" },
      { nome: "MIL Light Off" },
      { nome: "Readiness Monitor Adjustment" },
      { nome: "OBD Readiness Reset" },
      { nome: "Fault Masking" },
    ],
  },
  {
    id: "codificacao",
    emoji: "🔑",
    nome: "Codificação",
    servicos: [
      { nome: "ECU Coding" },
      { nome: "Immobilizer Off (IMMO Off)", avisoLegal: true },
      { nome: "VIN Correction" },
      { nome: "ECU Virgin", apenasRevendaFull: true },
      { nome: "ECU Clone", apenasRevendaFull: true },
      { nome: "TCU Clone", apenasRevendaFull: true },
      { nome: "Component Protection Removal" },
      { nome: "Key Programming Enable" },
      { nome: "Start Enable" },
    ],
  },
  {
    id: "transmissao",
    emoji: "⚙️",
    nome: "Transmissão",
    servicos: [
      { nome: "TCU Stage 1" },
      { nome: "TCU Stage 2", apenasRevendaFull: true },
      { nome: "Clutch Pressure Increase" },
      { nome: "Shift Time Reduction" },
      { nome: "Launch RPM Adjustment" },
      { nome: "Torque Monitoring Adjustment" },
      { nome: "Gear Display Correction" },
      { nome: "Kickdown Disable" },
    ],
  },
  {
    id: "especial",
    emoji: "🧠",
    nome: "Especial",
    servicos: [
      { nome: "Hot Start Fix" },
      { nome: "Speed Limiter Off" },
      { nome: "Speed Limiter Adjustment" },
      { nome: "Auto Start-Stop Off" },
      { nome: "Idle RPM Adjustment" },
      { nome: "ECU Recovery", apenasRevendaFull: true },
      { nome: "Flash Error Recovery", apenasRevendaFull: true },
      { nome: "Boot Mode Repair", apenasRevendaFull: true },
      { nome: "Checksum Correction", apenasRevendaFull: true },
      { nome: "Read Protection Removal", apenasRevendaFull: true },
      { nome: "Write Protection Removal", apenasRevendaFull: true },
      { nome: "Original File Restore (Recall Original)" },
      { nome: "Arquivo Complexo (+48h)", apenasRevendaFull: true },
      { nome: "Análise Técnica" },
      { nome: "Arquivo Especial", apenasRevendaFull: true },
      { nome: "Outro" },
    ],
  },
];

// Avisos legais por tipo de serviço
export const avisoLegalTexto = `⚠️ AVISO LEGAL: Este serviço pode impactar sistemas de controle de emissões do veículo. 
A desativação de componentes relacionados a emissões pode ser ilegal em vias públicas conforme legislação local. 
O uso deste serviço é de inteira responsabilidade do cliente e deve ser utilizado apenas em veículos de uso exclusivo em competição ou fora de estrada, 
ou em conformidade com as leis aplicáveis da sua região.`;

// Categorias de veículo (mantidas)
export const categoriasVeiculo = [
  "Truck",
  "Ônibus",
  "Veículo de Passeio",
  "Pick-up",
  "Moto",
  "Máquina Agrícola",
  "Máquinas Pesadas",
  "Moto Aquática",
  "Outro",
];

// Categorias que exigem placa
export const categoriasComPlaca = ["Truck", "Ônibus", "Veículo de Passeio", "Pick-up", "Moto"];

// Marcas por categoria disponíveis no Brasil
export const marcasPorCategoria: Record<string, string[]> = {
  "Truck": [
    "Volvo", "Scania", "Mercedes-Benz", "DAF", "MAN", "Iveco", "Ford", "Volkswagen", "Outro"
  ],
  "Ônibus": [
    "Marcopolo", "Mercedes-Benz", "Volvo", "Scania", "Volkswagen", "Iveco", "Agrale", "Outro"
  ],
  "Veículo de Passeio": [
    "Volkswagen", "Fiat", "Chevrolet", "Ford", "Toyota", "Honda", "Hyundai", "Jeep", 
    "Renault", "Nissan", "Peugeot", "Citroën", "BMW", "Mercedes-Benz", "Audi", 
    "Mitsubishi", "Kia", "Suzuki", "Caoa Chery", "BYD", "GWM", "Outro"
  ],
  "Pick-up": [
    "Toyota", "Ford", "Chevrolet", "Volkswagen", "Fiat", "Mitsubishi", "Nissan", 
    "Dodge", "Ram", "GWM", "Outro"
  ],
  "Moto": [
    "Honda", "Yamaha", "Suzuki", "Kawasaki", "BMW", "Harley-Davidson", "Triumph", 
    "Ducati", "Royal Enfield", "Shineray", "Dafra", "Outro"
  ],
  "Máquina Agrícola": [
    "John Deere", "Case IH", "New Holland", "Massey Ferguson", "Valtra", 
    "AGCO", "Jacto", "Stara", "Outro"
  ],
  "Máquinas Pesadas": [
    "Caterpillar", "Komatsu", "Volvo", "Liebherr", "JCB", "Case", "New Holland", 
    "Hyundai", "XCMG", "Sany", "Outro"
  ],
  "Moto Aquática": [
    "Yamaha", "Sea-Doo", "Kawasaki", "Honda", "Outro"
  ],
  "Outro": [
    "Outro"
  ],
};

export const transmissoes = ["Manual", "Automática", "Automatizada"];
