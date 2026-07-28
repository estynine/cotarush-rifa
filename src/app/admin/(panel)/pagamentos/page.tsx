import { AdminTitle, OrdersAdminRows } from "@/components/admin/admin";
import { demoOrders } from "@/lib/demo-data";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";

export default async function AdminPaymentsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ status?: string; error?: string }> }>) {
  const admin = await requireAdmin();
  const { status, error } = await searchParams;
  const orders = demoOrders.filter((order) => order.ownerAdminId === admin.ownerAdminId);
  const approved = orders.filter((order) => order.status === "approved");
  const totalPaidCents = approved.reduce((sum, order) => sum + order.totalCents, 0);
  const platformFeeCents = approved.reduce((sum, order) => sum + order.platformFeeCents, 0);
  const adminNetCents = approved.reduce((sum, order) => sum + order.adminNetCents, 0);

  return (
    <>
      <AdminTitle title="Pagamentos" description="Recebimento do ADM, split da plataforma e pedidos pagos." />
      {status === "payment-account-saved" ? <p className="alert-line mt-6 border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100">Conta de recebimento salva.</p> : null}
      {error === "payment-account" ? <p className="alert-line mt-6 border-red-300/20 bg-red-300/[0.06] text-red-100">Nao foi possivel salvar a conta de recebimento.</p> : null}

      <section className="panel mt-6 p-4">
        <h2 className="text-lg font-black text-white">Configurar recebimento</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Cadastre a conta em que o ADM vai receber a parte dele quando um pagamento for confirmado.
        </p>
        <form className="mt-5 grid gap-3 md:grid-cols-2" action="/api/admin/settings/payment-account" method="post">
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Provedor
            <select className="form-input" name="provider" defaultValue="mercado_pago">
              <option value="mercado_pago">Mercado Pago</option>
              <option value="pix_manual">Pix manual</option>
              <option value="banco">Banco</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Referencia da conta
            <input className="form-input" name="accountReference" placeholder="E-mail, ID da conta ou referencia interna" required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Nome do titular
            <input className="form-input" name="holderName" placeholder="Nome do titular da conta" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Documento
            <select className="form-input" name="documentType" defaultValue="cpf">
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="passaporte">Passaporte</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Numero do documento
            <input className="form-input" name="documentNumber" placeholder="CPF, CNPJ ou passaporte" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Tipo da chave Pix
            <select className="form-input" name="pixKeyType" defaultValue="email">
              <option value="email">E-mail</option>
              <option value="cpf">CPF/CNPJ</option>
              <option value="phone">Telefone</option>
              <option value="random">Aleatoria</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Chave Pix
            <input className="form-input" name="pixKey" placeholder="Chave Pix de recebimento" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Banco
            <input className="form-input" name="bankName" placeholder="Nome do banco" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Agencia
            <input className="form-input" name="branchNumber" placeholder="0001" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Conta
            <input className="form-input" name="accountNumber" placeholder="Numero da conta" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Tipo de conta
            <select className="form-input" name="accountType" defaultValue="pagamento">
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupanca</option>
              <option value="pagamento">Pagamento</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-zinc-300">
            <input name="active" type="checkbox" defaultChecked />
            Conta ativa
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-300 md:col-span-2">
            Nome da conta no painel
            <input className="form-input" name="label" placeholder="Conta principal do ADM" />
          </label>
          <button className="btn-primary md:col-span-2" type="submit">
            Salvar conta de recebimento
          </button>
        </form>
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="text-lg font-black text-white">Taxa da plataforma</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <PaymentMetric label="Pago" value={formatCurrency(totalPaidCents)} />
          <PaymentMetric label="Plataforma" value={formatCurrency(platformFeeCents)} />
          <PaymentMetric label="ADM" value={formatCurrency(adminNetCents)} />
        </div>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
          <p>
            A plataforma retém <strong className="text-white">50% de cada pagamento aprovado</strong>. O ADM recebe os outros 50% na conta configurada acima.
          </p>
          <p>
            Exemplo: se a cota custa R$ 0,10, R$ 0,05 ficam para o ADM e R$ 0,05 ficam para a plataforma. Se um participante paga R$ 150,00 em cotas, R$ 75,00 ficam para o ADM e R$ 75,00 ficam para a plataforma.
          </p>
          <p>
            Essa taxa cobre infraestrutura, banco de dados, manutencao, atualizacoes, suporte e operacao multi-ADM. Cada ADM usa seu proprio link, campanha e participantes, mas todos dependem da mesma plataforma funcionando.
          </p>
          <p className="rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-3 text-amber-100">
            O ADM e responsavel por operar campanhas conforme as autorizacoes, leis e regras aplicaveis. Nao opere campanhas sem regularizacao.
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-black text-white">Pedidos pagos e pendentes</h2>
      </section>
      <OrdersAdminRows orders={orders} />
    </>
  );
}

function PaymentMetric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[0.68rem] font-black uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}
