// supabase/functions/_shared/fk-helper.ts
//
// Normalização de campos FK. A API do Forteplus às vezes retorna FKs como
// integer (ex: ps_vendedor: 42) e às vezes como objeto aninhado
// (ex: ps_vendedor: { id: 42, ps_nome: "...", ... }).
//
// Para colunas tipadas como INTEGER no Postgres, sempre extrair só o id.

export function fkId(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v !== null && 'id' in v) {
    const id = (v as { id: unknown }).id;
    return typeof id === 'number' ? id : null;
  }
  return null;
}

/** Helper genérico de upsert via supabase-js com tratamento de erro padronizado. */
export function logIfErr(prefix: string, id: number | string, err: { message?: string } | null) {
  if (err) console.error(`[${prefix}] upsert falhou id=${id}: ${err.message}`);
}
