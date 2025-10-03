<div align="center">
  <img src="src/assets/pokeroullet-logo.png" alt="PokeRoullet Logo" width="200"/>
  
  ### Capture Pokémon girando a roleta!
</div>

## Sobre o Projeto

PokeRoullet é um jogo interativo de coleção de Pokémon onde você gira uma roleta para capturar diferentes criaturas. Complete sua Pokédex, evolua seus Pokémon, complete missões e desbloqueie conquistas enquanto se torna um mestre Pokémon!

### ✨ Funcionalidades Principais

-  **Sistema de Roleta**: Gire para capturar Pokémon com diferentes raridades
-  **Pokédex Completa**: Organize e visualize sua coleção por região
-  **Inventário**: Gerencie seus Pokémon capturados
-  **Loja**: Compre itens especiais com PokéCoins
-  **Sistema de Evolução**: Evolua seus Pokémon usando PokéShards
-  **Missões Diárias**: Complete desafios para ganhar recompensas
-  **Conquistas**: Desbloqueie troféus especiais
-  **Sistema de Amigos**: Adicione e visualize amigos
-  **Sistema de XP e Níveis**: Suba de nível como treinador
-  **Recompensas da Pokédex**: Ganhe prêmios ao completar seções

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset tipado de JavaScript
- **Vite** - Build tool moderna e rápida
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de UI reutilizáveis

### Backend & Infraestrutura
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Edge Functions
  - Storage
  
### Bibliotecas Principais
- **React Router DOM** - Roteamento
- **TanStack Query** - Gerenciamento de estado assíncrono
- **Lucide React** - Ícones
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **date-fns** - Manipulação de datas
- **Sonner** - Notificações toast

## 🎯 Como Jogar

1. **Cadastro/Login**: Crie uma conta ou faça login
2. **Escolha seu Starter**: Selecione seu primeiro Pokémon (Pikachu, Squirtle ou Charmander)
3. **Gire a Roleta**: Use suas rotações diárias para capturar Pokémon
4. **Complete Missões**: Ganhe PokéCoins e XP completando desafios
5. **Evolua Pokémon**: Use PokéShards para evoluir suas criaturas
6. **Complete a Pokédex**: Coloque seus Pokémon únicos na Pokédex
7. **Desbloqueie Conquistas**: Complete objetivos especiais

### 💎 Recursos do Jogo

- **PokéCoins**: Moeda principal do jogo (ganhe em missões)
- **PokéShards**: Use para evoluir Pokémon
- **Giros**: Recarregam a cada 2 horas (máximo de 5)
- **Missões**: Resetam diariamente às 00:00
- **XP**: Suba de nível completando ações no jogo

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>

# Entre na pasta do projeto
cd pokeroullet

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env com as credenciais do Supabase

# Inicie o servidor de desenvolvimento
npm run dev
