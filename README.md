<div align="center">
  <img src="src/assets/pokeroullet-logo.png" alt="PokeRoullet Logo" width="200"/>
  
  # PokeRoullet
  ### Capture Pokémon girando a roleta | Battle Mode Disponível
  
  **[Jogar Agora: pokeroullet.fun](https://pokeroullet.fun)**
  
  [![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646cff)](https://vitejs.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com)
  [![Supabase](https://img.shields.io/badge/Supabase-v2-3ECF8E)](https://supabase.com)
</div>

---

## Sobre o Projeto

**PokeRoullet** é um jogo web interativo de coleção e batalha de Pokémon desenvolvido com foco em experiência de usuário responsiva, gerenciamento de estado robusto e arquitetura escalável.

### Modos de Jogo

#### 1. **Modo Clássico (Roulette)**
- Gire a roleta para capturar Pokémon com diferentes raridades
- Sistema de recarregamento de giros (5 giros/2h)
- Coleta baseada em regiões: Kanto, Johto, Hoenn, Sinnoh e Alola
- Pokédex detalhada com análise de raridade

#### 2. **Modo Treinador (Battle Arena)** 🔥
Um sistema completo de **progressão por fases contra inimigos IA**, totalmente funcional com mecânicas estratégicas:

- **Team Building**: Selecione até 3 Pokémon para sua equipe de batalha (+ 1 Pet slot adicional)

- **Battle System**:
  - Combate por **turnos em tempo real** contra múltiplas ondas de inimigos
  - Sistema de tipos com **vantagens/desvantagens** (Super Efetivo, Não é Muito Efetivo)
  - Cálculo dinâmico de dano baseado em **stats** (Poder, Velocidade, Efeito)
  - Sistema de **status effects** (paralisia, queimadura, congelamento, etc.)
  - **CRIT system**: 5% de chance base de golpe crítico (2x dano)
  - Efeitos aplicáveis apenas por Pokémon **3★+** (3 estrelas ou mais)

- **Progression & Stages**:
  - **100 estágios** progressivos com dificuldade crescente
  - Cada estágio contém **6 ondas** de inimigos
  - Miniboss e Boss em pontos estratégicos
  - **5 minutos de tempo real** para completar o máximo de estágios
  - Recompensas por cada estágio: **PokéGems**, **XP**, **itens**, **packs especiais**
  - Sistema de **Auto Battle** (compra com PokéGems para farming automático)

- **Ranking Global**:
  - Ranking por **Maior Estágio Alcançado**
  - Ranking por **Total de Pokémon Derrotados**
  - Atualizações automáticas após cada corrida
  - Sem ELO matching — ranking puramente posicional

- **Mecânicas Avançadas**:
  - Classes de inimigos: Normais, Miniboss, Boss, Challenger
  - Status effect stacking
  - Pet damage multipliers baseado em raridade
  - Item drops aleatórios com tabelas de raridade
  - Drop de packs especiais (Brasa Comum, Aurora Incomum, etc.)

#### 3. **Outros Sistemas**
- **Missões Diárias**: Desafios com XP, moedas e shards
- **Clãs**: Sistema comunitário com temporadas
- **Marketplace**: Trading entre jogadores
- **Conquistas**: 50+ troféus desblocáveis
- **Amigos**: Sistema social integrado

---

## Arquitetura & Técnico

### Frontend Architecture
```
src/
├── components/        # Componentes React (50+ modal/card)
├── pages/            # Layouts de páginas
├── hooks/            # Custom hooks (useTrainerMode, useTrainerStats, etc)
├── contexts/         # Context API (DataRefreshContext, TrainerModeContext)
├── data/             # Dados estáticos (Pokémon pools, configs, evoluções)
├── lib/              # Utilitários (cálculos, conversores)
├── integrations/     # Supabase client e configurações
└── locales/          # i18n (suporte multilíngue)
```

### Padrões & Práticas

- **State Management**: React Context + TanStack Query para dados assíncronos
- **Form Handling**: React Hook Form + Zod para validação
- **Component Pattern**: Composição com shadcn/ui base + customizações Tailwind
- **Type Safety**: TypeScript strict mode em 100% do código
- **Real-time**: Supabase subscriptions para atualizações de ranking/batalla
- **Error Handling**: Try-catch com logging centralizado en Edge Functions
- **Code Organization**: Modular separación de concerns

### Backend & Infraestrutura

- **Database**: PostgreSQL via Supabase
  - Tabelas normalizadas (trainers, pokemon, battles, clans)
  - RLS (Row Level Security) para dados de usuário
  - Índices otimizados para queries frequentes

- **Authentication**: Supabase Auth (JWT-based)
  - Session management automático
  - Email verificação opcional

- **Edge Functions** (Deno):
  - `update-ranking`: Recalcula ELO rankings em real-time
  - `reset-spins`: Reset diário de giros de roleta
  - `reset-missions`: Reset diário de missões
  - `rotate-clan-season`: Rotação de temporada de clãs
  - `generate-banner`: Geração dinâmica de imagens de promoção
  - Autenticação por `x-admin-key` header

- **Storage**: Cloud Storage para avatares, emblemas e assets

---

## Features Técnicas Destaques

### Performance
- ✅ Code splitting automático com Vite
- ✅ Lazy loading de componentes modais
- ✅ Asset optimization (images, webp)
- ✅ Query caching com React Query

### Developer Experience
- ✅ Hot Module Replacement (HMR)
- ✅ ESLint + TypeScript strict
- ✅ Playwright E2E testing setup
- ✅ Tailwind CSS com JIT mode

### Security & Best Practices
- ✅ `.env` não versionado (.env.example fornecido)
- ✅ CORS configurado
- ✅ Rate limiting em Edge Functions
- ✅ Validação de input com Zod em backend
- ✅ JWT expiration: 1h

### Data Flow
```
Component → Hook (useTrainerMode) → Context → Supabase
                                        ↓
                                   Real-time subscription
```

---

## Tecnologias Utilizadas

### Frontend
| Tecnologia | Uso |
|-----------|-----|
| **React 18** | Biblioteca UI com Hooks |
| **TypeScript** | Type safety completo |
| **Vite 5.4** | Build tool (dev server <100ms) |
| **Tailwind CSS 3.4** | Styling utilitário |
| **shadcn/ui** | Componentes acessíveis base |
| **React Router** | Roteamento client-side |
| **TanStack Query** | Async state management |
| **React Hook Form** | Gerenciamento de forms |
| **Zod** | Schema validation |
| **Lucide React** | 400+ ícones |
| **Recharts** | Gráficos de stats |
| **Sonner** | Toast notifications |
| **i18next** | Internacionalização |
| **Embla Carousel** | Carrosséis otimizados |

### Backend
| Tecnologia | Uso |
|-----------|-----|
| **Supabase** | Backend as a Service |
| **PostgreSQL** | Database relacional |
| **Edge Functions (Deno)** | Serverless compute |
| **PostgREST** | API REST auto-gerada |
| **Realtime** | WebSocket subscriptions |
| **Auth** | JWT authentication |

### DevTools
| Tecnologia | Uso |
|-----------|-----|
| **npm** | Package manager |
| **Playwright** | E2E testing |
| **ESLint** | Code linting |
| **PostCSS** | CSS transformations |

---

## Como Jogar

### 1️⃣ Setup Inicial
```
1. Cadastro com email/senha via Supabase Auth
2. Escolha seu starter: Pikachu, Squirtle ou Charmander
3. Aparência do treinador customizável
```

### 2️⃣ Modo Roulette
```
- Gire para capturar Pokémon (raridades: Common, Rare, Epic, Legendary)
- Complete regiões para desbloqueios
- Evolua seus Pokémon com PokéShards
- Envie para Pokédex para contabilizar (limite: 1 por Pokémon)
- Ganhe recompensas ao completar 10/25/50 únicos
```

### 3️⃣ Modo Treinador (Battle Arena)
```
1. Organize seu time (até 3 Pokémon + 1 Pet slot)
2. Inicie uma "Run" (corrida de 5 minutos)
3. Combata ondas de inimigos progressivos
4. Derrote o máximo de pokémon antes do timeout
5. Ganhe PokéGems, XP, itens e packs como recompensa
6. Suba no ranking global (por estágio máximo ou inimigos derrotados)
7. Acumule PokéGems para comprar "Auto Battle" (farming automático)
```

### 4️⃣ Atividades Diárias
```
- Complete missões para XP e PokéCoins
- Reset automático às 00:00 UTC
- Bônus de login consecutivo
- Atividades especiais em eventos
```

---

## Instalação & Desenvolvimento

### Pré-requisitos
- **Node.js** 18+ 
- **npm** 9+
- **Conta Supabase** (free tier é suficiente para dev)

### Setup Local
```bash
# 1. Clone e entre no diretório
git clone https://github.com/juliocovary/PokeRoullet.git
cd poke-roulette

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase:
# VITE_SUPABASE_URL=<sua_url>
# VITE_SUPABASE_ANON_KEY=<sua_anon_key>

# 4. Inicie dev server
npm run dev
# ✅ Acesse em http://localhost:8080
```

### Scripts Disponíveis
```bash
npm run dev        # Dev server com HMR
npm run build      # Build otimizado para produção
npm run preview    # Preview do build local
npm run lint       # Lint com ESLint
npm run type-check # TypeScript type checking
```

---

## Testing

```bash
npm run test       # Rodar testes Playwright
npm run test:ui    # Interface visual de testes
```

---

## Estatísticas do Projeto

- **900+** linhas TypeScript components
- **50+** componentes reutilizáveis
- **150+** Pokémon (Kanto até Alola)
- **5** Regiões jogáveis
- **3** Modos de jogo
- **Zero** dependências sensíveis não necessárias

---

## O que Aprendi com Este Projeto

- ✅ Full-stack development com React + TypeScript
- ✅ Real-time data sync com Supabase subscriptions
- ✅ Backend com serverless Edge Functions
- ✅ State management em aplicações complexas
- ✅ Otimização de performance em React
- ✅ Design responsivo mobile-first com Tailwind
- ✅ Arquitetura escalável sem frameworks pesados
- ✅ Testing e CI/CD fundamentals

---

## Contato & Support

**Desenvolvedor**: Júlio C. Covary  
**Email**: [juliocovary@alunos.utfpr.edu.br]  
**GitHub**: [@juliocovary](https://github.com/juliocovary)

---