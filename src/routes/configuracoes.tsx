import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Star, Upload } from "lucide-react";
import { ErpShell } from "@/components/ErpShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONFIG_ERP_PADRAO,
  getConfig,
  MODELOS_IA,
  saveConfig,
  type ConfigERP,
} from "@/lib/config";
import { GEMINI_KEY_STORAGE, obterChaveGemini, salvarChaveGemini } from "@/lib/gemini";
import { gerarTextoIA, mensagemErroIA } from "@/lib/ai";
import {
  adicionarResponsavel,
  atualizarResponsavel,
  definirResponsavelPadrao,
  listarResponsaveis,
  removerResponsavel,
  type ResponsavelTecnico,
} from "@/lib/responsaveis";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Dados do responsável técnico, integração de IA, identidade visual dos documentos e responsáveis técnicos do ERP TEMPLAR.",
      },
      { property: "og:title", content: "Configurações — TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Centralize dados profissionais, IA e identidade visual dos documentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfiguracoesPage,
});

function Campo({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ConfiguracoesPage() {
  const [cfg, setCfg] = useState<ConfigERP>(CONFIG_ERP_PADRAO);
  const [chave, setChave] = useState("");
  const [testando, setTestando] = useState(false);
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [novoCrea, setNovoCrea] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCrea, setEditCrea] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCfg(getConfig());
    setChave(obterChaveGemini());
    setResponsaveis(listarResponsaveis());
  }, []);

  const set = <K extends keyof ConfigERP>(chaveCfg: K, valor: ConfigERP[K]) =>
    setCfg((c) => ({ ...c, [chaveCfg]: valor }));

  const salvarTudo = () => {
    const final = saveConfig(cfg);
    setCfg(final);
    const k = chave.trim();
    if (k) salvarChaveGemini(k);
    else window.localStorage.removeItem(GEMINI_KEY_STORAGE);
    setResponsaveis(listarResponsaveis());
    toast.success("Configurações salvas! Todo o sistema já usa estes dados.");
  };

  const testarIA = async () => {
    const k = chave.trim();
    if (!k) {
      toast.error("Informe a chave da API do Google antes de testar.");
      return;
    }
    salvarChaveGemini(k);
    saveConfig(cfg);
    setTestando(true);
    try {
      await gerarTextoIA("Olá", "Responda apenas: OK");
      toast.success("✓ Conexão com a IA funcionando!");
    } catch (erro) {
      toast.error(mensagemErroIA(erro instanceof Error ? erro.message : ""), { duration: 6000 });
    } finally {
      setTestando(false);
    }
  };

  const enviarLogo = (file?: File | null) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      toast.error("Escolha uma imagem de até 1,5 MB.");
      return;
    }
    const fr = new FileReader();
    fr.onload = () => set("logoDataUrl", String(fr.result));
    fr.onerror = () => toast.error("Não foi possível ler a imagem.");
    fr.readAsDataURL(file);
  };

  return (
    <ErpShell>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Dados usados automaticamente nas vistorias, propostas, laudos e documentos gerados.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do profissional / empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Campo
              id="c-nome"
              label="Nome do responsável técnico"
              value={cfg.nome}
              onChange={(v) => set("nome", v)}
            />
            <Campo
              id="c-crea"
              label="CREA / Registro"
              value={cfg.crea}
              onChange={(v) => set("crea", v)}
            />
            <Campo
              id="c-cpf"
              label="CPF (opcional)"
              value={cfg.cpf}
              onChange={(v) => set("cpf", v)}
            />
            <Campo
              id="c-tel"
              label="Telefone / WhatsApp"
              value={cfg.telefone}
              onChange={(v) => set("telefone", v)}
            />
            <Campo
              id="c-email"
              label="E-mail"
              value={cfg.email}
              onChange={(v) => set("email", v)}
            />
            <Campo id="c-site" label="Site" value={cfg.site} onChange={(v) => set("site", v)} />
            <Campo
              id="c-cargo"
              label="Cargo / Formação (opcional)"
              value={cfg.cargo}
              onChange={(v) => set("cargo", v)}
            />
            <Campo
              id="c-end"
              label="Endereço do escritório (opcional)"
              value={cfg.endereco}
              onChange={(v) => set("endereco", v)}
            />
            <div className="sm:col-span-2">
              <Campo
                id="c-tagline"
                label="Tagline para documentos"
                value={cfg.tagline}
                onChange={(v) => set("tagline", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integração de IA (Google Gemini)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-chave">Chave da API Google (Gemini)</Label>
                <Input
                  id="c-chave"
                  type="password"
                  autoComplete="off"
                  placeholder="AIza..."
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Modelo</Label>
                <Select value={cfg.iaModelo} onValueChange={(v) => set("iaModelo", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS_IA.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-instr">Instrução do sistema</Label>
              <Textarea
                id="c-instr"
                rows={4}
                value={cfg.iaInstrucao}
                onChange={(e) => set("iaInstrucao", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Temperatura: {cfg.iaTemperatura.toFixed(2)}</Label>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[cfg.iaTemperatura]}
                onValueChange={(v) => set("iaTemperatura", v[0] ?? 0.3)}
              />
            </div>
            <Button variant="outline" onClick={testarIA} disabled={testando} className="min-h-11">
              {testando ? "Testando..." : "Testar conexão"}
            </Button>
            <p className="text-xs text-muted-foreground">
              A chave fica salva apenas neste navegador. Obtenha em{" "}
              <a
                className="font-medium text-primary underline"
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                aistudio.google.com/apikey
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidade visual / documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo horizontal dos documentos</Label>
              <div className="flex flex-wrap items-center gap-3">
                {cfg.logoDataUrl ? (
                  <img
                    src={cfg.logoDataUrl}
                    alt="Logo configurada para os documentos"
                    className="h-12 w-auto rounded border border-border bg-white object-contain p-1"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Usando a logo padrão.</span>
                )}
                <Button variant="outline" onClick={() => logoRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar imagem
                </Button>
                {cfg.logoDataUrl && (
                  <Button variant="ghost" onClick={() => set("logoDataUrl", "")}>
                    Voltar à padrão
                  </Button>
                )}
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  hidden
                  onChange={(e) => enviarLogo(e.target.files?.[0])}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-navy">Cor principal (navy)</Label>
                <div className="flex gap-2">
                  <Input
                    id="c-navy"
                    value={cfg.corNavy}
                    onChange={(e) => set("corNavy", e.target.value)}
                  />
                  <input
                    type="color"
                    aria-label="Selecionar cor principal"
                    className="h-10 w-12 rounded border border-border"
                    value={cfg.corNavy}
                    onChange={(e) => set("corNavy", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-gold">Cor de destaque (dourado)</Label>
                <div className="flex gap-2">
                  <Input
                    id="c-gold"
                    value={cfg.corGold}
                    onChange={(e) => set("corGold", e.target.value)}
                  />
                  <input
                    type="color"
                    aria-label="Selecionar cor de destaque"
                    className="h-10 w-12 rounded border border-border"
                    value={cfg.corGold}
                    onChange={(e) => set("corGold", e.target.value)}
                  />
                </div>
              </div>
              <Campo
                id="c-pprop"
                label="Prefixo de propostas"
                value={cfg.prefixoProposta}
                onChange={(v) => set("prefixoProposta", v.toUpperCase())}
              />
              <Campo
                id="c-pvist"
                label="Prefixo de vistorias"
                value={cfg.prefixoVistoria}
                onChange={(v) => set("prefixoVistoria", v.toUpperCase())}
              />
              <Campo
                id="c-plau"
                label="Prefixo de laudos"
                value={cfg.prefixoLaudo}
                onChange={(v) => set("prefixoLaudo", v.toUpperCase())}
              />
              <div className="space-y-1.5">
                <Label>Formato de data nos documentos</Label>
                <Select
                  value={cfg.formatoData}
                  onValueChange={(v) => set("formatoData", v as ConfigERP["formatoData"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/AAAA">DD/MM/AAAA</SelectItem>
                    <SelectItem value="MM/DD/AAAA">MM/DD/AAAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Campo
                  id="c-drive"
                  label="Pasta padrão no Google Drive"
                  value={cfg.pastaDrive}
                  onChange={(v) => set("pastaDrive", v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Responsáveis técnicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {responsaveis.map((r) =>
                editandoId === r.id ? (
                  <li key={r.id} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                      <Input value={editCrea} onChange={(e) => setEditCrea(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!editNome.trim() || !editCrea.trim()) {
                            toast.error("Informe nome e CREA.");
                            return;
                          }
                          setResponsaveis(
                            atualizarResponsavel(r.id, { nome: editNome, crea: editCrea }),
                          );
                          setEditandoId(null);
                          toast.success("Responsável atualizado.");
                        }}
                      >
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      {r.padrao && <Star className="h-4 w-4 fill-erp-gold text-erp-gold" />}
                      {r.nome} — {r.crea}
                    </span>
                    <span className="flex gap-1">
                      {!r.padrao && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResponsaveis(definirResponsavelPadrao(r.id));
                            toast.success("Responsável padrão definido.");
                          }}
                        >
                          Tornar padrão
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditandoId(r.id);
                          setEditNome(r.nome);
                          setEditCrea(r.crea);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setResponsaveis(removerResponsavel(r.id))}
                      >
                        Excluir
                      </Button>
                    </span>
                  </li>
                ),
              )}
            </ul>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
              <Input
                placeholder="CREA"
                value={novoCrea}
                onChange={(e) => setNovoCrea(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => {
                if (!novoNome.trim() || !novoCrea.trim()) {
                  toast.error("Informe nome e CREA.");
                  return;
                }
                setResponsaveis(adicionarResponsavel(novoNome, novoCrea));
                setNovoNome("");
                setNovoCrea("");
                toast.success("Responsável cadastrado.");
              }}
            >
              Adicionar responsável
            </Button>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button className="min-h-11 shadow-lg" onClick={salvarTudo}>
            Salvar configurações
          </Button>
        </div>
      </div>
    </ErpShell>
  );
}
