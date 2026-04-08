import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Scissors, MapPin, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePublicTenant } from '@/context/PublicTenantContext';
import { formatCurrency } from '@/lib/utils';

export default function ServicesPage() {
  const { data: { services, professionals, tenant } } = usePublicTenant();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const activeServices = services.filter(s => s.isActive);
  const categories = ['all', ...new Set(activeServices.map(s => s.category).filter(Boolean))];
  const filtered = activeCategory === 'all' ? activeServices : activeServices.filter(s => s.category === activeCategory);

  const getProfessionals = (serviceId: string) => professionals.filter(p => p.services.includes(serviceId));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden min-h-[220px] flex flex-col justify-center"
        style={!tenant.bannerUrl ? { background: `linear-gradient(135deg, ${tenant.primaryColor}22 0%, ${tenant.primaryColor}08 100%)`, border: `1px solid ${tenant.primaryColor}30` } : {}}
      >
        {/* Banner de fundo */}
        {tenant.bannerUrl && (
          <img src={tenant.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Overlay gradiente (com ou sem banner) */}
        <div
          className="absolute inset-0"
          style={{
            background: tenant.bannerUrl
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.62) 100%)'
              : `linear-gradient(to bottom right, ${tenant.primaryColor}10, transparent)`,
          }}
        />



        {/* Conteúdo principal — logo esquerda + info direita */}
        <div
          className={`
              relative z-10 
              flex flex-col items-center text-center
              sm:flex-row sm:items-center sm:text-left
              gap-2 sm:gap-5 
              px-20 sm:px-6 py-6
              lg:px-12  
              ${tenant.bannerUrl ? 'text-white' : ''}
            `}
        >
          {/* Badge Aberto / Fechado — topo direito em destaque */}
          <div className="absolute top-4 right-4 z-20 lg:items-center lg:mr-6 ">
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm 
                ${tenant.isOpen
                ? 'bg-green-500 text-white shadow-green-500/40'
                : 'bg-red-500 text-white shadow-red-500/40'
              }`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${tenant.isOpen ? 'bg-white' : 'bg-white/80'}`} />
              {tenant.isOpen ? 'Aberto' : 'Fechado'}
            </span>
          </div>

          {/* Logo */}
          {tenant.logoUrl ? (
            <div className="shrink-0 h-36 w-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-white/10 backdrop-blur-sm">
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="shrink-0 h-20 w-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl border-2 border-white/20 xl:h-28 xl:w-28"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {tenant.name
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          {/* Informações */}
          <div className="flex-1 min-w-0 sm:text-left text-center">
            <h2
              className={`
                  text-2xl sm:text-3xl 
                  font-black tracking-tight leading-tight truncate 
                  ${tenant.bannerUrl ? 'text-white drop-shadow' : 'text-foreground'}
                  `}
            >
              {tenant.name}
            </h2>

            <div
              className={`
                    flex flex-col items-center
                    sm:flex-col sm:flex-wrap sm:items-start
                    gap-1 sm:gap-x-4 sm:gap-y-1 
                    mt-1.5 text-sm
                    ${tenant.bannerUrl ? 'text-white/80' : 'text-muted-foreground'}
                  `}
            >
              {tenant.address && (
                <span className="flex items-center gap-1.5 text-center sm:text-left">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {tenant.address}
                </span>
              )}
              {tenant.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {tenant.phone}
                </span>
              )}
            </div>

            {/* Botões */}
            <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-start gap-2 w-full sm:w-auto">

              {/* Botão Agendar */}
              {tenant.isOpen ? (
                <Button
                  size="sm"
                  className="w-full sm:w-auto shadow-lg font-semibold"
                  style={{ backgroundColor: tenant.primaryColor }}
                  onClick={() => navigate(`/${tenant.slug}/booking`)}
                >
                  Agendar
                </Button>
              ) : (
                <div className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-medium backdrop-blur-sm">
                  Estabelecimento fechado no momento
                </div>
              )}

              {/* Botão Localização */}
              {tenant.address && (
                <a
                  className="w-full sm:w-auto"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className={`w-full sm:w-auto shadow-lg font-semibold gap-1.5 ${tenant.bannerUrl
                      ? 'bg-white/10 border-white/30 text-white hover:bg-white'
                      : ''}
                          `}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Localização
                  </Button>
                </a>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm"
            style={activeCategory === cat ? { backgroundColor: tenant.primaryColor } : {}}
            onClick={() => setActiveCategory(cat)}>
            {cat === 'all' ? 'Todos' : cat}
          </Button>
        ))}
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(svc => {
          const profs = getProfessionals(svc.id);
          return (
            <Card key={svc.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="#"/>
              <CardContent className="pt-4 pb-6">
                <div className="mb-3">
                  <Badge variant="secondary" className="mb-2 text-xs">{svc.category}</Badge>
                  <h3 className="font-semibold text-lg leading-tight">{svc.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{svc.description}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {svc.duration} min</span>
                  <span className="flex items-center gap-1"><Scissors className="h-3.5 w-3.5" /> {profs.length} prof.</span>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {profs.slice(0, 3).map(p => (
                    <Avatar key={p.id} className="h-7 w-7 border-2 border-background -ml-1 first:ml-0">
                      {p.photoUrl && <AvatarImage src={p.photoUrl} alt={p.name} className="object-cover" />}
                      <AvatarFallback className="text-[10px] text-white font-bold" style={{ backgroundColor: tenant.primaryColor }}>{p.avatar}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">{formatCurrency(svc.price)}</span>
                  <Button size="sm" style={{ backgroundColor: tenant.primaryColor }}
                    onClick={() => navigate(`/${tenant.slug}/booking`, { state: { serviceId: svc.id } })}>
                    Agendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Nossa Equipe</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {professionals.map(p => (
            <Card key={p.id}>
              <CardContent className="pt-6 pb-6 text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3">
                  {p.photoUrl && <AvatarImage src={p.photoUrl} alt={p.name} className="object-cover" />}
                  <AvatarFallback className="text-white font-bold text-2xl" style={{ backgroundColor: tenant.primaryColor }}>{p.avatar}</AvatarFallback>
                </Avatar>
                <h4 className="font-semibold text-lg">{p.name}</h4>
                <p className="text-muted-foreground text-sm">{p.specialty}</p>
                <p className="text-muted-foreground text-xs mt-2 px-2">{p.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1 justify-center">
                  {services.filter(s => p.services.includes(s.id)).map(s => (
                    <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
