package com.agendepro.product;

import com.agendepro.common.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static com.agendepro.product.ProductDtos.*;

/** Porta de product.controller.ts. */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> list(UUID tenantId) {
        return productRepository.findByTenantIdOrderByNameAsc(tenantId).stream().map(ProductResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listPublic(UUID tenantId) {
        return productRepository.findByTenantIdAndIsActiveTrueAndStockGreaterThanOrderByNameAsc(tenantId, 0)
                .stream().map(ProductResponse::from).toList();
    }

    @Transactional
    public ProductResponse create(UUID tenantId, ProductCreateRequest request) {
        Product product = productRepository.save(Product.builder()
                .tenantId(tenantId)
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .stock(request.stock())
                .lowStockThreshold(request.lowStockThreshold())
                .category(request.category())
                .imageUrl(request.imageUrl())
                .isActive(request.isActive())
                .build());
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse update(UUID tenantId, UUID id, ProductUpdateRequest request) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Produto não encontrado"));

        if (request.name() != null) product.setName(request.name());
        if (request.description() != null) product.setDescription(request.description());
        if (request.price() != null) product.setPrice(request.price());
        if (request.stock() != null) product.setStock(request.stock());
        if (request.lowStockThreshold() != null) product.setLowStockThreshold(request.lowStockThreshold());
        if (request.category() != null) product.setCategory(request.category());
        if (request.imageUrl() != null) product.setImageUrl(request.imageUrl());
        if (request.isActive() != null) product.setIsActive(request.isActive());

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Produto não encontrado"));
        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse adjustStock(UUID tenantId, UUID id, int delta) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Produto não encontrado"));

        int newStock = product.getStock() + delta;
        if (newStock < 0) throw new AppException("Estoque insuficiente", 400, "INSUFFICIENT_STOCK");

        product.setStock(newStock);
        return ProductResponse.from(productRepository.save(product));
    }
}
