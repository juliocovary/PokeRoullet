# Diretrizes para Uso de Imagens

## ⚠️ IMPORTANTE: Como usar imagens corretamente

### ❌ FORMA INCORRETA (não funciona no build)
```tsx
// NÃO FAÇA ISSO - não funciona quando publicado
<img src="/src/assets/imagem.png" alt="Descrição" />
```

### ✅ FORMA CORRETA (funciona sempre)
```tsx
// SEMPRE faça assim - importar como módulo ES6
import minhaImagem from '@/assets/imagem.png';

function MeuComponente() {
  return <img src={minhaImagem} alt="Descrição" />;
}
```

## Por que isso é importante?

1. **Build Process**: O Vite precisa processar as imagens durante o build
2. **Otimização**: Imagens importadas são otimizadas automaticamente
3. **Cache Busting**: URLs são geradas com hash para evitar problemas de cache
4. **Tipo Safety**: TypeScript pode verificar se os arquivos existem

## Exemplos práticos

### Para avatares múltiplos
```tsx
import pikachuAvatar from '@/assets/avatars/pikachu.jpg';
import squirtleAvatar from '@/assets/avatars/squirtle.jpg';

export const AVATARS = [
  { id: 'pikachu', src: pikachuAvatar },
  { id: 'squirtle', src: squirtleAvatar },
];
```

### Para ícones
```tsx
import pokeballIcon from '@/assets/pokeball_icon.png';

<img src={pokeballIcon} alt="Pokeball" className="w-6 h-6" />
```

### Para backgrounds
```tsx
import backgroundImage from '@/assets/background.jpg';

<div style={{ backgroundImage: `url(${backgroundImage})` }} />
```

## Checklist antes de publicar

- [ ] Todas as imagens estão importadas como módulos ES6
- [ ] Não há referências diretas como `/src/assets/`
- [ ] Todas as imagens têm alt text descritivo
- [ ] Paths estão usando @ alias (`@/assets/`)

## Estrutura de pastas recomendada

```
src/
  assets/
    avatars/          # Avatares de usuários
    icons/            # Ícones pequenos
    backgrounds/      # Imagens de fundo
    pokemon/          # Sprites de Pokémon
    ui/              # Elementos de interface
```

---

**Lembre-se: SEMPRE importe imagens como módulos ES6!**