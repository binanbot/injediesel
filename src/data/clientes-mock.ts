// Mock data para clientes
export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cidade?: string;
  unidadeId: string;
  unidadeNome: string;
  dataCadastro: string;
}

export interface ServicoCliente {
  id: string;
  clienteId: string;
  data: string;
  placa?: string;
  marca: string;
  modelo: string;
  categoriaVeiculo: string;
  categoriaServico: string;
  servico: string;
  status: 'pendente' | 'processando' | 'concluido' | 'cancelado';
  valor: number;
  arquivoOriginal?: string;
  arquivoModificado?: string;
}

// Mock de clientes
export const clientesMock: Cliente[] = [
  {
    id: "cli-001",
    nome: "José da Silva",
    telefone: "(11) 99999-1234",
    email: "jose.silva@email.com",
    cidade: "São Paulo",
    unidadeId: "uni-001",
    unidadeNome: "Injediesel São Paulo",
    dataCadastro: "2024-01-15",
  },
  {
    id: "cli-002",
    nome: "Maria Oliveira",
    telefone: "(21) 98888-5678",
    email: "maria.oliveira@email.com",
    cidade: "Rio de Janeiro",
    unidadeId: "uni-001",
    unidadeNome: "Injediesel São Paulo",
    dataCadastro: "2024-02-20",
  },
  {
    id: "cli-003",
    nome: "Carlos Santos",
    telefone: "(31) 97777-9012",
    cidade: "Belo Horizonte",
    unidadeId: "uni-001",
    unidadeNome: "Injediesel São Paulo",
    dataCadastro: "2024-03-10",
  },
  {
    id: "cli-004",
    nome: "Ana Pereira",
    telefone: "(41) 96666-3456",
    email: "ana.pereira@email.com",
    cidade: "Curitiba",
    unidadeId: "uni-001",
    unidadeNome: "Injediesel São Paulo",
    dataCadastro: "2024-04-05",
  },
];

// Mock de serviços por cliente
export const servicosClientesMock: ServicoCliente[] = [
  {
    id: "srv-001",
    clienteId: "cli-001",
    data: "2024-11-20",
    placa: "ABC-1234",
    marca: "Volvo",
    modelo: "FH 540",
    categoriaVeiculo: "Truck",
    categoriaServico: "Performance",
    servico: "Stage 1",
    status: "concluido",
    valor: 1500,
    arquivoOriginal: "original_fh540.bin",
    arquivoModificado: "mod_fh540.bin",
  },
  {
    id: "srv-002",
    clienteId: "cli-001",
    data: "2024-12-01",
    placa: "DEF-5678",
    marca: "Scania",
    modelo: "R450",
    categoriaVeiculo: "Truck",
    categoriaServico: "Emissões",
    servico: "EGR Off",
    status: "processando",
    valor: 800,
    arquivoOriginal: "original_r450.bin",
  },
  {
    id: "srv-003",
    clienteId: "cli-002",
    data: "2024-12-10",
    placa: "GHI-9012",
    marca: "Volkswagen",
    modelo: "Golf GTI",
    categoriaVeiculo: "Veículo de Passeio",
    categoriaServico: "Performance",
    servico: "Stage 2",
    status: "concluido",
    valor: 2000,
    arquivoOriginal: "original_golf.bin",
    arquivoModificado: "mod_golf.bin",
  },
  {
    id: "srv-004",
    clienteId: "cli-003",
    data: "2024-12-15",
    marca: "John Deere",
    modelo: "8R 410",
    categoriaVeiculo: "Máquina Agrícola",
    categoriaServico: "Diagnóstico",
    servico: "DTC Off (Todos)",
    status: "pendente",
    valor: 600,
    arquivoOriginal: "original_8r410.bin",
  },
];
