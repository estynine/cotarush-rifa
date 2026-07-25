export function LegalPage({ title }: Readonly<{ title: string }>) {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="panel p-6">
          <h1 className="text-3xl font-black text-white">{title}</h1>
          <div className="mt-6 space-y-4 leading-7 text-zinc-300">
            <p>
              Documento modelo para producao. Configure responsavel, documento, autorizacao aplicavel,
              criterios de participacao, politica de cancelamento, apuracao, restricoes de idade e limites geograficos.
            </p>
            <p>
              Campanhas incompletas nao devem ser publicadas. O painel administrativo inclui checklist de compliance
              antes da mudanca para o estado ativo.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
