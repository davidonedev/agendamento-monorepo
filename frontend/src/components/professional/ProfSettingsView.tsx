import { useState } from 'react';
import { CheckCircle, Clock, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfessional } from '@/context/ProfessionalContext';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ProfSettingsView() {
  const { professional, tenant, updateMySchedule } = useProfessional();

  const accentColor = tenant.adminColor ?? tenant.primaryColor;

  const [workingDays, setWorkingDays] = useState<number[]>([...professional.workingDays]);
  const [hoursStart,  setHoursStart]  = useState(professional.workingHours.start);
  const [hoursEnd,    setHoursEnd]    = useState(professional.workingHours.end);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');

  const toggleDay = (day: number) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const handleSave = async () => {
    if (hoursStart >= hoursEnd) {
      setError('O horário de início deve ser anterior ao horário de fim.');
      return;
    }
    if (workingDays.length === 0) {
      setError('Selecione ao menos um dia de trabalho.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await updateMySchedule({
        workingDays,
        workingHoursStart: hoursStart,
        workingHoursEnd:   hoursEnd,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Minha Disponibilidade</h2>
        <p className="text-muted-foreground text-sm">
          Configure os dias e horários em que você estará disponível para agendamentos.
        </p>
      </div>

      {/* ── Dias da semana ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dias de Atendimento</CardTitle>
          <CardDescription>Selecione os dias em que você trabalha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAY_LABELS.map((label, day) => {
              const active = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex flex-col items-center py-3 rounded-xl text-xs font-semibold border-2 transition-all select-none ${
                    active
                      ? 'text-white border-transparent'
                      : 'text-muted-foreground border-muted hover:border-muted-foreground/40'
                  }`}
                  style={active ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {workingDays.length === 0 && (
            <p className="text-xs text-destructive mt-3">Selecione ao menos um dia.</p>
          )}

          <p className="text-xs text-muted-foreground mt-3">
            {workingDays.length > 0
              ? `Trabalhando ${workingDays.length} dia${workingDays.length > 1 ? 's' : ''} por semana: ${workingDays.map(d => DAY_LABELS[d]).join(', ')}`
              : 'Nenhum dia selecionado'}
          </p>
        </CardContent>
      </Card>

      {/* ── Horários ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Horário de Atendimento
          </CardTitle>
          <CardDescription>Início e fim do expediente nos dias marcados acima</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Início</Label>
              <Input
                type="time"
                value={hoursStart}
                onChange={e => setHoursStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Fim</Label>
              <Input
                type="time"
                value={hoursEnd}
                onChange={e => setHoursEnd(e.target.value)}
              />
            </div>
          </div>

          {hoursStart && hoursEnd && hoursStart < hoursEnd && (
            <p className="text-xs text-muted-foreground">
              Expediente de <strong>{hoursStart}</strong> às <strong>{hoursEnd}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Erro e botão ─────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        className="gap-2"
        style={{ backgroundColor: accentColor }}
      >
        {saved
          ? <><CheckCircle className="h-4 w-4" /> Salvo!</>
          : saving
          ? 'Salvando...'
          : <><Save className="h-4 w-4" /> Salvar disponibilidade</>}
      </Button>
    </div>
  );
}
