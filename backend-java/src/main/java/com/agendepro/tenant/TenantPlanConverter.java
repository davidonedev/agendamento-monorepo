package com.agendepro.tenant;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TenantPlanConverter implements AttributeConverter<TenantPlan, String> {

    @Override
    public String convertToDatabaseColumn(TenantPlan attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public TenantPlan convertToEntityAttribute(String dbData) {
        return dbData == null ? null : TenantPlan.fromValue(dbData);
    }
}
