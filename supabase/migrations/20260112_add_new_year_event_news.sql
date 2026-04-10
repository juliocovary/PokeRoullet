-- Add New Year Event news article
INSERT INTO public.news_articles (title, title_en, content, content_en, category, is_pinned, published_at, is_active)
VALUES (
  'Celebração do Novo Ano já está disponível!',
  'New Year Celebration now available!',
  '🎉 **Celebração do Novo Ano chegou!**

Um novo evento épico está aqui para começar seu 2026 com muito estilo!

**Destaques do Evento:**
- **7 Missões Exclusivas** para completar
- **Pokémon Lendário Garantido** ao final do evento
- **Recompensas Incríveis** incluindo Pokécoins, Pokéshards, Giros e itens especiais
- **Countdown Ao Vivo** mostrando quanto tempo falta
- **Experiência Imersiva** com design festivo e animações especiais

**Como Participar:**
Clique no botão "EVENTO" na barra lateral para acessar o modal de evento e comece suas missões agora mesmo!

Cada missão concluída o aproxima de ganhar um Pokémon Lendário exclusivo. Boa sorte, treinador! 🚀',
  '🎉 **New Year Celebration has arrived!**

An epic new event is here to start your 2026 in style!

**Event Highlights:**
- **7 Exclusive Missions** to complete
- **Guaranteed Legendary Pokémon** at the end of the event
- **Amazing Rewards** including Pokécoins, Pokéshards, Spins, and special items
- **Live Countdown** showing how much time is left
- **Immersive Experience** with festive design and special animations

**How to Participate:**
Click the "EVENT" button on the sidebar to access the event modal and start your missions right now!

Each mission completed brings you closer to earning an exclusive Legendary Pokémon. Good luck, trainer! 🚀',
  'event',
  true,
  now(),
  true
);
