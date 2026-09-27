package com.agendepro.catalog;

import com.agendepro.common.ApiResponse;
import com.agendepro.common.AppException;
import com.agendepro.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.agendepro.catalog.ProductCategoryDtos.*;

/** Porta de productCategory.controller.ts. */
@Tag(name = "Product Categories")
@RestController
@RequestMapping("/api/admin/product-categories")
@RequiredArgsConstructor
public class ProductCategoryController {

    private final ProductCategoryRepository repository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> list() {
        UUID tenantId = SecurityUtils.requireTenantId();
        var data = repository.findByTenantIdOrderByNameAsc(tenantId).stream().map(CategoryResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest request) {
        UUID tenantId = SecurityUtils.requireTenantId();
        repository.findByTenantIdAndName(tenantId, request.name()).ifPresent(c -> {
            throw new AppException("Categoria já existe", 409);
        });
        ProductCategory saved = repository.save(ProductCategory.builder().tenantId(tenantId).name(request.name()).build());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(CategoryResponse.from(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        UUID tenantId = SecurityUtils.requireTenantId();
        ProductCategory existing = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Categoria não encontrada"));
        repository.delete(existing);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
