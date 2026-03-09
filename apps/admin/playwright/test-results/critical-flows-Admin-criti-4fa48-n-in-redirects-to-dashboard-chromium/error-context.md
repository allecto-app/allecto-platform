# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "Allecto App" [ref=e6]
      - paragraph [ref=e7]: Acesse com credenciais da plataforma ou com o código enviado ao síndico/gestor
    - generic [ref=e9]:
      - tablist [ref=e10]:
        - tab "Plataforma" [selected] [ref=e11] [cursor=pointer]
        - tab "Síndico / Morador" [ref=e12] [cursor=pointer]
      - tabpanel "Plataforma" [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Email
            - textbox "Email" [ref=e17]:
              - /placeholder: admin@demo.com
              - text: admin@allecto.app
          - generic [ref=e18]:
            - generic [ref=e19]:
              - generic [ref=e20]: Senha
              - button "Esqueceu a senha?" [ref=e21] [cursor=pointer]
            - textbox "Senha" [ref=e22]:
              - /placeholder: ••••••••
              - text: Password123
          - paragraph [ref=e23]: Email ou senha inválidos
          - button "Entrar" [ref=e24] [cursor=pointer]
    - paragraph [ref=e26]:
      - text: Precisa de ajuda?
      - link "Contate o suporte" [ref=e27] [cursor=pointer]:
        - /url: mailto:suporte@allecto.app
  - region "Notifications alt+T"
  - region "Notifications alt+T"
  - alert [ref=e28]
```