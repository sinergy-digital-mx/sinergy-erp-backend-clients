-- Crear tabla product_vendor_costs
CREATE TABLE product_vendor_costs (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    product_uom_id VARCHAR(36) NOT NULL,
    cost DECIMAL(12,2) NOT NULL,
    iva_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
    ieps_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
    iva_unit_total DECIMAL(12,2) DEFAULT 0 NOT NULL,
    ieps_unit_total DECIMAL(12,2) DEFAULT 0 NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_product_vendor_costs_product 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_vendor_costs_vendor 
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_vendor_costs_product_uom 
        FOREIGN KEY (product_uom_id) REFERENCES product_uoms(id) ON DELETE CASCADE,
    CONSTRAINT product_vendor_uom_unique 
        UNIQUE (product_id, vendor_id, product_uom_id)
);

CREATE INDEX product_index ON product_vendor_costs(product_id);
CREATE INDEX vendor_index ON product_vendor_costs(vendor_id);
CREATE INDEX product_uom_index ON product_vendor_costs(product_uom_id);

-- Verificar
SELECT * FROM product_vendor_costs LIMIT 5;
