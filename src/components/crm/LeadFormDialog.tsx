import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LEAD_ORIGENS,
  LEAD_STATUS,
  ORIGEM_LABEL,
  STATUS_LABEL,
  emailValido,
  mascaraDocumento,
  mascaraTelefone,
  type Lead,
  type LeadInput,
  type LeadOrigem,
  type LeadStatus,
} from "@/lib/crm";

const VAZIO: LeadInput = {
  nome: "",
  telefone: "",
  email: "",
  tipo_pessoa: "PF",
  documento: "",
  origem: "outro",
  status: "novo",
  observacoes: "",
};

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  onSubmit,
  salvando,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead?: Lead | null;
  onSubmit: (input: LeadInput) => Promise<void> | void;
  salvando?: boolean;
}) {
  const [form, setForm] = useState<LeadInput>(VAZIO);

  useEffect(() => {
    if (!open) return;
    setForm(
      lead
        ? {
            nome: lead.nome,
            telefone: lead.telefone ?? "",
            email: lead.email ?? "",
            tipo_pessoa: lead.tipo_pessoa,
            documento: lead.documento ?? "",
            origem: lead.origem,
            status: lead.status,
            observacoes: lead.observacoes ?? "",
          }
        : VAZIO,
    );
  }, [open, lead]);

  const set = <K extends keyof LeadInput>(campo: K, valor: LeadInput[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const salvar = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do lead.");
      return;
    }
    if (form.email && !emailValido(form.email)) {
      toast.error("E-mail inválido.");
      return;
    }
    await onSubmit({ ...form, nome: form.nome.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-nome">Nome *</Label>
            <Input
              id="lead-nome"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Nome do contato ou empresa"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de pessoa *</Label>
            <div className="flex gap-2">
              {(["PF", "PJ"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={form.tipo_pessoa === t ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      tipo_pessoa: t,
                      documento: mascaraDocumento(f.documento ?? "", t),
                    }));
                  }}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-doc">{form.tipo_pessoa === "PF" ? "CPF" : "CNPJ"}</Label>
              <Input
                id="lead-doc"
                inputMode="numeric"
                value={form.documento ?? ""}
                onChange={(e) => set("documento", mascaraDocumento(e.target.value, form.tipo_pessoa))}
                placeholder={form.tipo_pessoa === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-tel">Telefone</Label>
              <Input
                id="lead-tel"
                inputMode="tel"
                value={form.telefone ?? ""}
                onChange={(e) => set("telefone", mascaraTelefone(e.target.value))}
                placeholder="(21) 98180-8812"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-email">E-mail</Label>
            <Input
              id="lead-email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              placeholder="contato@empresa.com.br"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select
                value={form.origem}
                onValueChange={(v) => set("origem", v as LeadOrigem)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_ORIGENS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {ORIGEM_LABEL[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as LeadStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-obs">Observações</Label>
            <Textarea
              id="lead-obs"
              rows={4}
              value={form.observacoes ?? ""}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Contexto do contato, demanda, prazo..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
