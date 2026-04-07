import { useState, useRef, useEffect } from 'react';
import {
  Package, Plus, Edit2, Trash2, Search, AlertTriangle,
  Loader2, Tag, TrendingDown, TrendingUp, ToggleLeft, ToggleRight,
  ChevronDown, FolderPlus, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTenant } from '@/context/TenantContext';
import { ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import type { ProductPayload } from '@/services/products.service';

// ─── Formulário ───────────────────────────────────────────────────────────────
interface FormData {
  name: string; description: string; price: string;
  stock: string; lowStockThreshold: string; category: string;
  imageUrl: string; isActive: boolean;
}

const EMPTY_FORM: FormData = {
  name: '', description: '', price: '', stock: '0',
  lowStockThreshold: '5', category: '', imageUrl: '', isActive: true,
};

function formFromProduct(p: Product): FormData {
  return {
    name: p.name, description: p.description ?? '', price: String(p.price),
    stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold),
    category: p.category ?? '', imageUrl: p.imageUrl ?? '', isActive: p.isActive,
  };
}

function toPayload(f: FormData): ProductPayload {
  return {
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    price: parseFloat(f.price),
    stock: parseInt(f.stock, 10),
    lowStockThreshold: parseInt(f.lowStockThreshold, 10),
    category: f.category.trim() || undefined,
    imageUrl: f.imageUrl.trim() || undefined,
    isActive: f.isActive,
  };
}

function validate(f: FormData): string {
  if (!f.name.trim()) return 'Nome é obrigatório.';
  if (!f.price || isNaN(parseFloat(f.price)) || parseFloat(f.price) <= 0) return 'Preço deve ser positivo.';
  if (isNaN(parseInt(f.stock, 10)) || parseInt(f.stock, 10) < 0) return 'Estoque não pode ser negativo.';
  if (isNaN(parseInt(f.lowStockThreshold, 10)) || parseInt(f.lowStockThreshold, 10) < 0) return 'Limite de alerta inválido.';
  return '';
}

// ─── Dropdown de categorias ───────────────────────────────────────────────────
function CategoryDropdown() {
  const { productCategories, addProductCategory, deleteProductCategory } = useTenant();

  const [open, setOpen]         = useState(false);
  const [newName, setNewName]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [catError, setCatError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) { setCatError('Nome obrigatório.'); return; }
    setSaving(true); setCatError('');
    try {
      await addProductCategory(name);
      setNewName('');
    } catch (e) {
      setCatError(e instanceof ApiError ? e.message : 'Erro ao criar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await deleteProductCategory(id); }
    catch { /* silencioso */ }
    finally { setDeletingId(null); }
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 whitespace-nowrap"
        onClick={() => setOpen(v => !v)}
      >
        <Tag className="h-3.5 w-3.5" />
        Categorias
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border bg-card shadow-lg p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gerenciar Categorias</p>

          {/* Lista de categorias */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {productCategories.length === 0 && (
              <p className="text-xs text-muted-foreground py-2 text-center">Nenhuma categoria criada.</p>
            )}
            {productCategories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 group">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{cat.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-destructive"
                  title="Excluir categoria"
                >
                  {deletingId === cat.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <X className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>

          {/* Criar nova */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nova categoria..."
                value={newName}
                onChange={e => { setNewName(e.target.value); setCatError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8 px-2.5 shrink-0" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {catError && <p className="text-xs text-destructive">{catError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ProductsView() {
  const { products, productCategories, lowStockProducts, addProduct, updateProduct, deleteProduct, adjustStock } = useTenant();

  const [search, setSearch]           = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  // Dialogs
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState<FormData>(EMPTY_FORM);
  const [editTarget, setEditTarget]   = useState<Product | null>(null);
  const [editForm, setEditForm]       = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockDelta, setStockDelta]   = useState('');

  // Categorias para filtro (union de categorias do banco + categorias em produtos)
  const dbCatNames = productCategories.map(c => c.name);
  const prodCatNames = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  const allCatNames = Array.from(new Set([...dbCatNames, ...prodCatNames])).sort();

  const [filterCat, setFilterCat] = useState('');

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q) ||
      (p.category ?? '').toLowerCase().includes(q);
    const matchCat    = !filterCat || p.category === filterCat;
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? p.isActive : !p.isActive);
    return matchSearch && matchCat && matchActive;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const err = validate(createForm);
    if (err) { setError(err); return; }
    setSaving(true); setError('');
    try {
      await addProduct(toPayload(createForm));
      setCreateOpen(false); setCreateForm(EMPTY_FORM);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Erro ao criar produto.'); }
    finally { setSaving(false); }
  };

  const openEdit = (p: Product) => { setEditTarget(p); setEditForm(formFromProduct(p)); setError(''); };

  const handleEdit = async () => {
    if (!editTarget) return;
    const err = validate(editForm);
    if (err) { setError(err); return; }
    setSaving(true); setError('');
    try {
      await updateProduct(editTarget.id, toPayload(editForm));
      setEditTarget(null);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Erro ao salvar produto.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try { await deleteProduct(deleteTarget.id); setDeleteTarget(null); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Erro ao excluir produto.'); }
    finally { setSaving(false); }
  };

  const handleStock = async (dir: 1 | -1) => {
    if (!stockTarget) return;
    const delta = parseInt(stockDelta, 10);
    if (!delta || delta <= 0) { setError('Informe uma quantidade válida.'); return; }
    setSaving(true); setError('');
    try {
      await adjustStock(stockTarget.id, dir * delta);
      setStockTarget(null); setStockDelta('');
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Erro ao ajustar estoque.'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (p: Product) => {
    try { await updateProduct(p.id, { isActive: !p.isActive }); }
    catch { /* silencioso */ }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground text-sm">{products.length} produtos cadastrados</p>
        </div>
        <Button onClick={() => { setCreateForm(EMPTY_FORM); setError(''); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
      </div>

      {/* Alertas de estoque baixo */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {lowStockProducts.length} produto{lowStockProducts.length > 1 ? 's' : ''} com estoque baixo
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map(p => (
              <button
                key={p.id}
                onClick={() => { setStockTarget(p); setStockDelta(''); setError(''); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-medium hover:bg-amber-200 transition-colors"
              >
                <Package className="h-3 w-3" />
                {p.name}
                <span className="font-bold">({p.stock} restantes)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca + dropdown de categorias */}
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <CategoryDropdown />
        </div>

        {/* Filtro ativo/inativo */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <Button key={f} size="sm" variant={filterActive === f ? 'default' : 'outline'} onClick={() => setFilterActive(f)}>
              {{ all: 'Todos', active: 'Ativos', inactive: 'Inativos' }[f]}
            </Button>
          ))}
        </div>
      </div>

      {/* Filtro por categoria */}
      {allCatNames.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={!filterCat ? 'default' : 'outline'} onClick={() => setFilterCat('')}>Todas</Button>
          {allCatNames.map(c => (
            <Button key={c} size="sm" variant={filterCat === c ? 'default' : 'outline'} onClick={() => setFilterCat(c === filterCat ? '' : c)}>
              <Tag className="h-3 w-3 mr-1" />{c}
            </Button>
          ))}
        </div>
      )}

      {/* Grade */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => {
          const isLow = p.isActive && p.stock <= p.lowStockThreshold;
          return (
            <Card key={p.id} className={`group overflow-hidden transition-shadow hover:shadow-md ${!p.isActive ? 'opacity-60' : ''}`}>
              {/* Barra de estoque */}
              <div className={`h-1 ${isLow ? 'bg-amber-400' : p.stock === 0 ? 'bg-destructive' : 'bg-emerald-500'}`} />
              <CardContent className="pt-4 pb-4 px-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    {p.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        <Tag className="h-2.5 w-2.5 mr-1" />{p.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title={p.isActive ? 'Desativar' : 'Ativar'} onClick={() => toggleActive(p)}>
                      {p.isActive ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-bold text-base">{formatCurrency(p.price)}</span>
                  <button
                    onClick={() => { setStockTarget(p); setStockDelta(''); setError(''); }}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors
                      ${p.stock === 0 ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-800' :
                        isLow ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800' :
                        'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800'
                      } hover:opacity-80`}
                  >
                    <Package className="h-3 w-3" />
                    {p.stock} em estoque
                    {isLow && <AlertTriangle className="h-3 w-3" />}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-16">
            {products.length === 0 ? 'Nenhum produto cadastrado ainda.' : 'Nenhum produto encontrado.'}
          </div>
        )}
      </div>

      {/* ── Dialog: Criar ───────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={o => { if (!saving) { setCreateOpen(o); setError(''); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <ProductForm form={createForm} onChange={setCreateForm} error={error} categories={allCatNames} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar ──────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={o => { if (!saving && !o) { setEditTarget(null); setError(''); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar — {editTarget?.name}</DialogTitle></DialogHeader>
          <ProductForm form={editForm} onChange={setEditForm} error={error} categories={allCatNames} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Ajuste de estoque ────────────────────────────────────────── */}
      <Dialog open={!!stockTarget} onOpenChange={o => { if (!o) { setStockTarget(null); setStockDelta(''); setError(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Ajustar Estoque — {stockTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <span className="text-sm text-muted-foreground">Estoque atual</span>
              <span className="font-bold text-lg">{stockTarget?.stock} unidades</span>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input
                type="number" min="1" step="1" placeholder="Ex: 10"
                value={stockDelta}
                onChange={e => setStockDelta(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setStockTarget(null); setStockDelta(''); }} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleStock(-1)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              Dar baixa
            </Button>
            <Button onClick={() => handleStock(1)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-1" />}
              Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Excluir ─────────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir Produto</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong className="text-foreground">{deleteTarget?.name}</strong>?
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Formulário de produto ────────────────────────────────────────────────────
function ProductForm({
  form, onChange, error, categories,
}: {
  form: FormData;
  onChange: React.Dispatch<React.SetStateAction<FormData>>;
  error: string;
  categories: string[];
}) {
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome *</Label>
        <Input placeholder="Ex: Pomada modeladora" value={form.name} onChange={set('name')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Preço (R$) *</Label>
          <Input type="number" min="0" step="0.01" placeholder="29.90" value={form.price} onChange={set('price')} />
        </div>
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          {categories.length > 0 ? (
            <select
              value={form.category}
              onChange={e => onChange(f => ({ ...f, category: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Sem categoria</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <Input placeholder="Ex: Finalizadores" value={form.category} onChange={set('category')} />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Estoque inicial</Label>
          <Input type="number" min="0" step="1" placeholder="0" value={form.stock} onChange={set('stock')} />
        </div>
        <div className="space-y-1.5">
          <Label>Alertar quando abaixo de</Label>
          <Input type="number" min="0" step="1" placeholder="5" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea placeholder="Descrição opcional..." rows={2} value={form.description} onChange={set('description')} />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(f => ({ ...f, isActive: !f.isActive }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <Label className="cursor-pointer" onClick={() => onChange(f => ({ ...f, isActive: !f.isActive }))}>
          {form.isActive ? 'Produto ativo (visível para clientes)' : 'Produto inativo (oculto para clientes)'}
        </Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
