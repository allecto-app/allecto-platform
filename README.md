# allecto-platform

Monorepo com **backend Convex** + **aplicações web** (Landing e Admin) e **packages** compartilhados.

## Deploys na Vercel

Cada projeto Vercel (Admin e Landing) aponta para este mesmo repositório, então usamos o script `scripts/should-deploy.cjs` como *Ignored Build Step* para evitar builds desnecessários. Ele verifica se houve mudanças nos diretórios observados e:

- retorna `0` quando **não** houve alterações → a Vercel ignora o deploy;
- retorna `1` quando encontrou alterações → o build segue normalmente.

### Como configurar

1. Confirme que o repositório está acessível via Git dentro da Vercel (nenhuma configuração adicional é necessária no código).
2. Em cada projeto Vercel, abra **Settings → Git → Ignored Build Step** e use uma das opções abaixo:
   - **Admin**  
     ```
     node scripts/should-deploy.cjs apps/admin packages/branding packages/config packages/contracts packages/shared packages/ui
     ```
   - **Landing**  
     ```
     node scripts/should-deploy.cjs apps/landing packages/branding packages/config packages/contracts packages/shared packages/ui
     ```
3. Ajuste a lista de diretórios caso novas dependências compartilhadas passem a influenciar um dos apps.

Com isso, merges no `master` só disparam builds no projeto correspondente aos arquivos modificados (mudanças em packages compartilhados acionam ambos, como esperado).
