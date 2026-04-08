import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PRESET_COLORS = [
  '#1e1b4b', '#7c3aed', '#db2777', '#dc2626',
  '#d97706', '#16a34a', '#0ea5e9', '#0f172a',
  '#78350f', '#14532d', '#0369a1', '#9f1239',
];

const STORAGE_KEY = 'super_primary_color';

export function getSuperColor(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '#1e1b4b';
}

function saveSuperColor(color: string) {
  localStorage.setItem(STORAGE_KEY, color);
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-11 w-11 rounded-lg border cursor-pointer p-0.5 bg-transparent shrink-0"
        />
        <div>
          <p className="font-mono font-medium text-sm">{value}</p>
          <p className="text-xs text-muted-foreground">Clique na paleta ou escolha um preset</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            type="button"
            title={c}
            className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
              value === c ? 'border-foreground scale-110 ring-2 ring-offset-1 ring-foreground/30' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

export default function SuperSettingsView() {
  const [color, setColor] = useState(getSuperColor);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveSuperColor(color);
    // Dispara evento para o SuperLayout reagir sem reload
    window.dispatchEvent(new CustomEvent('super-color-change', { detail: color }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações da Plataforma</h2>
        <p className="text-muted-foreground text-sm mt-1">Personalize a aparência do painel super admin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cor principal</CardTitle>
          <CardDescription>
            Define a cor de destaque do painel — botões, links ativos e indicadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ColorPicker value={color} onChange={setColor} />

          {/* Preview */}
          <div className="rounded-lg border overflow-hidden text-xs">
            <div className="px-3 py-2 flex items-center gap-2 text-white font-semibold" style={{ backgroundColor: color }}>
              <div className="h-4 w-4 rounded bg-white/20 flex items-center justify-center text-[9px]">S</div>
              Super Admin
            </div>
            <div className="p-3 bg-muted/20 space-y-1.5">
              {['Dashboard', 'Tenants', 'Métricas', 'Configurações'].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-medium"
                  style={i === 3 ? { backgroundColor: color, color: '#fff' } : { color: 'var(--muted-foreground)' }}
                >
                  <div className="h-2.5 w-2.5 rounded-sm bg-current opacity-70" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="gap-2" style={{ backgroundColor: color }}>
            {saved
              ? <><CheckCircle className="h-4 w-4" /> Salvo!</>
              : 'Salvar cor'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
