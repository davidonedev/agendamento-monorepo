import { useEffect, useState } from 'react';
import { CheckCircle, LifeBuoy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listAccessHelpApi, resolveAccessHelpApi, type AccessHelpRequest } from '@/services/account.service';
import { ApiError } from '@/lib/api';

const SCOPE_TEXT = {
  admin: {
    title: 'Pedidos de acesso',
    description: 'Funcionários que perderam acesso ao e-mail. Confirme a identidade pelo contato informado e ' +
      'atualize o e-mail/senha do funcionário em Profissionais.',
  },
  super: {
    title: 'Pedidos de acesso',
    description: 'Donos de barbearia que perderam acesso ao e-mail (e funcionários de barbearias não identificadas). ' +
      'Confirme a identidade e atualize as credenciais em Minha conta → usuários.',
  },
} as const;

/** Listagem dos pedidos "Não consigo acessar meu e-mail" para quem trata (tenant ou Superadmin). */
export default function AccessHelpList({ scope }: { scope: 'admin' | 'super' }) {
  const [items,     setItems]     = useState<AccessHelpRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [resolving, setResolving] = useState<string | null>(null);
  const [filter,    setFilter]    = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    listAccessHelpApi(scope)
      .then(setItems)
      .catch(err => setError(err instanceof ApiError ? err.message : 'Erro ao carregar pedidos.'))
      .finally(() => setLoading(false));
  }, [scope]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      const updated = await resolveAccessHelpApi(scope, id);
      setItems(list => list.map(i => (i.id === id ? updated : i)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar pedido.');
    } finally {
      setResolving(null);
    }
  };

  const visible = filter === 'pending' ? items.filter(i => i.status === 'pending') : items;
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const text = SCOPE_TEXT[scope];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <LifeBuoy className="h-6 w-6" /> {text.title}
        </h2>
        <p className="text-sm text-muted-foreground">{text.description}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Solicitações</CardTitle>
            <CardDescription>{pendingCount} pendente{pendingCount === 1 ? '' : 's'}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pendentes</Button>
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todas</Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {filter === 'pending' ? 'Nenhum pedido pendente.' : 'Nenhum pedido registrado.'}
            </p>
          ) : (
            <ul className="divide-y">
              {visible.map(item => (
                <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline">{item.requesterType === 'professional' ? 'Funcionário' : 'Dono'}</Badge>
                      {item.status === 'pending'
                        ? <Badge variant="secondary">Pendente</Badge>
                        : <Badge variant="outline" className="border-green-300 text-green-600">Resolvida</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contato: <span className="text-foreground">{item.contact}</span>
                      {' · '}Barbearia informada: <span className="text-foreground">{item.barbershop}</span>
                      {scope === 'super' && item.tenantName && <> ({item.tenantName})</>}
                    </p>
                    {item.message && <p className="whitespace-pre-line text-sm">{item.message}</p>}
                    <p className="text-xs text-muted-foreground">
                      Aberto em {new Date(item.createdAt).toLocaleString('pt-BR')}
                      {item.resolvedAt && <> · resolvido em {new Date(item.resolvedAt).toLocaleString('pt-BR')}</>}
                    </p>
                  </div>
                  {item.status === 'pending' && (
                    <Button size="sm" variant="outline" className="shrink-0 gap-2"
                      disabled={resolving === item.id} onClick={() => handleResolve(item.id)}>
                      {resolving === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Marcar como resolvida
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
