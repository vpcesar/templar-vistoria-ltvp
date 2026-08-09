import { useRef, useState } from "react";
import { ArrowLeft, Camera, Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addOpcaoCustom, comprimirDataUrl, opcoesCustom, uid } from "@/lib/storage";
import type { Foto } from "@/lib/types";
import { cn } from "@/lib/utils";

const OUTRO_OPCAO = "✚ Outro (adicionar)";

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  campo,
  allowAdd = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  campo?: string;
  allowAdd?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState<string[]>(() => (campo ? opcoesCustom(campo) : []));
  const all = [...options, ...custom.filter((c) => !options.includes(c))];

  const adicionar = () => {
    const v = query.trim();
    if (!v) return;
    if (campo) addOpcaoCustom(campo, v);
    setCustom((c) => (c.includes(v) ? c : [...c, v]));
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-auto min-h-12 w-full justify-between gap-2 whitespace-normal bg-background py-2 text-left font-normal"
        >
          <span className={cn("min-w-0 flex-1 leading-snug", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty className="p-2 text-sm text-muted-foreground">
              Nenhum resultado.
            </CommandEmpty>
            <CommandGroup>
              {all.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="min-h-11"
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")}
                  />
                  {opt}
                </CommandItem>
              ))}
              {allowAdd && query.trim() && !all.includes(query.trim()) && (
                <CommandItem value={`__add_${query}`} onSelect={adicionar} className="min-h-11">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar “{query.trim()}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ChipMulti({
  values,
  onChange,
  options,
  campo,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
  campo?: string;
}) {
  const [custom, setCustom] = useState<string[]>(() => (campo ? opcoesCustom(campo) : []));
  const [novo, setNovo] = useState("");
  const all = [...options, ...custom.filter((c) => !options.includes(c))];

  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {all.map((opt) => {
          const active = values.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                "min-h-9 max-w-full whitespace-normal break-words rounded-2xl border px-3 py-1.5 text-left text-xs font-medium leading-snug transition",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="Nova manifestação"
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() => {
            const v = novo.trim();
            if (!v) return;
            if (campo) addOpcaoCustom(campo, v);
            setCustom((c) => (c.includes(v) ? c : [...c, v]));
            onChange([...values, v]);
            setNovo("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TripleToggle({
  value,
  onChange,
}: {
  value?: string | undefined;
  onChange: (v: "SIM" | "NAO" | "NAO SABE") => void;
}) {
  const opts: ("SIM" | "NAO" | "NAO SABE")[] = ["SIM", "NAO", "NAO SABE"];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "min-h-10 rounded-md px-2 text-xs font-semibold transition",
            value === o
              ? o === "SIM"
                ? "bg-primary text-primary-foreground"
                : o === "NAO"
                  ? "bg-slate-brand text-primary-foreground"
                  : "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o === "NAO" ? "Não" : o === "NAO SABE" ? "Não sei" : "Sim"}
        </button>
      ))}
    </div>
  );
}

export function SegmentedOptions({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "min-h-12 whitespace-normal break-words rounded-lg border px-3 py-2 text-left text-xs font-semibold leading-snug transition",
            value === o
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** Menu suspenso pesquisável com opção "Outro (adicionar)" para texto livre. */
export function SelectOrText({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  campo,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  campo?: string;
}) {
  const [isCustom, setIsCustom] = useState(false);

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite livremente"
          className="h-12 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <Button
          type="button"
          variant="outline"
          className="h-12 shrink-0 text-xs"
          onClick={() => {
            setIsCustom(false);
            onChange("");
          }}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <SearchSelect
      value={value}
      onChange={(v) => {
        if (v === OUTRO_OPCAO) {
          onChange("");
          setIsCustom(true);
          return;
        }
        onChange(v);
      }}
      options={[...options, OUTRO_OPCAO]}
      placeholder={placeholder}
      {...(campo ? { campo } : {})}
    />
  );
}

/** Área de upload de fotos com thumbnails removíveis (mobile-first). */
export function FotoUploader({
  fotos,
  onChange,
  label = "Tirar foto ou enviar imagem",
}: {
  fotos: Foto[];
  onChange: (f: Foto[]) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const addFotos = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const comprimida = await comprimirDataUrl(String(reader.result), 1200, 0.7);
        onChange([...fotos, { id: uid(), dataUrl: comprimida }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/40 p-4 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        <Camera className="h-6 w-6" />
        {label}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => addFotos(e.target.files)}
      />
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {fotos.map((f) => (
            <div key={f.id} className="relative overflow-hidden rounded-lg border border-border">
              <img src={f.dataUrl} alt="Foto da edificação" className="h-20 w-full object-cover" />
              <button
                type="button"
                aria-label="Remover foto"
                onClick={() => onChange(fotos.filter((x) => x.id !== f.id))}
                className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
