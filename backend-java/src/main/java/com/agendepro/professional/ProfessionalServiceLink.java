package com.agendepro.professional;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Porta do model ProfessionalService (tabela de junção professional_services). */
@Entity
@Table(name = "professional_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalServiceLink {

    @EmbeddedId
    private ProfessionalServiceLinkId id;

    public static ProfessionalServiceLink of(UUID professionalId, UUID serviceId) {
        return new ProfessionalServiceLink(new ProfessionalServiceLinkId(professionalId, serviceId));
    }
}
