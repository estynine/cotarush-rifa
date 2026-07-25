<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CotaRush permanent rules

- Publico, participante e administrador sao areas distintas.
- Componentes administrativos nunca podem aparecer fora de `/admin`.
- Toda rota administrativa exige funcao administrativa no servidor.
- Nao alterar integracoes financeiras sem testes.
- Nao apagar migrations existentes.
- Executar lint, testes, TypeScript e build antes de concluir.
- Nao trabalhar diretamente na branch principal.
- Nao criar botoes sem implementacao.
- Nao substituir dados reais por mocks definitivos.
