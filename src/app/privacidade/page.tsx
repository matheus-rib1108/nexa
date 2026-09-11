import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 md:p-10">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">🔒 Privacidade e Segurança</h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Quais dados guardamos</h2>
        <p className="text-sm text-muted">
          O NEXA guarda os dados que você cria para organizar sua rotina: tarefas, subtarefas, hábitos, notas,
          matérias, provas, sessões de foco e suas preferências. Cada registro pertence exclusivamente à sua conta —
          nenhum outro usuário consegue visualizá-lo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Senhas</h2>
        <p className="text-sm text-muted">
          A senha da sua conta nunca é armazenada em texto puro: usamos um hash bcrypt com custo adequado. A senha
          mestra do Cofre usa um hash Argon2id, o algoritmo recomendado atualmente para esse tipo de proteção.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Como funciona o Cofre</h2>
        <p className="text-sm text-muted">
          Os itens do Cofre são cifrados com AES-256-GCM usando uma chave derivada da sua senha mestra (via scrypt)
          combinada com um salt exclusivo da sua conta. Essa chave nunca é salva no banco de dados — ela só existe
          em memória durante o tempo necessário para cifrar ou decifrar um item, a pedido seu.
        </p>
        <p className="text-sm text-muted">
          Isso significa que, sem a sua senha mestra, o conteúdo do Cofre não pode ser lido — nem pela equipe do
          NEXA. Também significa que, se você esquecer a senha mestra, não existe como recuperar o conteúdo
          cifrado: não há uma senha mestra universal guardada pela equipe.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Sessões</h2>
        <p className="text-sm text-muted">
          O login usa tokens de sessão assinados, com validade de até 30 dias. Você pode encerrar todas as sessões
          ativas a qualquer momento em Configurações → Segurança.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Exclusão de conta</h2>
        <p className="text-sm text-muted">
          Você pode excluir sua conta a qualquer momento em Configurações. A exclusão remove permanentemente seus
          dados — tarefas, notas, hábitos, itens do Cofre e demais registros — e não pode ser desfeita.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Limites</h2>
        <p className="text-sm text-muted">
          O NEXA utiliza múltiplas camadas de segurança para reduzir o risco de acesso não autorizado — hashing
          forte de senhas, criptografia dos dados sensíveis do Cofre, limitação de tentativas de login e validação
          de entrada em todas as rotas. Nenhum sistema é impossível de comprometer; recomendamos usar uma senha
          única e forte, e tratar sua senha mestra do Cofre com o mesmo cuidado que uma chave física.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Sobre o propósito do NEXA</h2>
        <p className="text-sm text-muted">
          O NEXA é uma ferramenta de apoio à organização. Ele não realiza diagnósticos, não trata TDAH e não
          substitui acompanhamento profissional de saúde.
        </p>
      </section>
    </div>
  );
}
