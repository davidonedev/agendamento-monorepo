package com.agendepro.product;

import com.agendepro.common.ApiResponse;
import com.agendepro.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.agendepro.product.ProductDtos.*;

/** GET é compartilhado (admin + professional); create/update/delete/stock só admin. */
@Tag(name = "Products")
@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping({"/api/admin/products", "/api/professional/products"})
    public ResponseEntity<ApiResponse<List<ProductResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(productService.list(SecurityUtils.requireTenantId())));
    }

    @PostMapping("/api/admin/products")
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductCreateRequest request) {
        var created = productService.create(SecurityUtils.requireTenantId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PatchMapping("/api/admin/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(@PathVariable UUID id, @Valid @RequestBody ProductUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.update(SecurityUtils.requireTenantId(), id, request)));
    }

    @DeleteMapping("/api/admin/products/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        productService.delete(SecurityUtils.requireTenantId(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/admin/products/{id}/stock")
    public ResponseEntity<ApiResponse<ProductResponse>> adjustStock(@PathVariable UUID id, @Valid @RequestBody AdjustStockRequest request) {
        var updated = productService.adjustStock(SecurityUtils.requireTenantId(), id, request.delta());
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
