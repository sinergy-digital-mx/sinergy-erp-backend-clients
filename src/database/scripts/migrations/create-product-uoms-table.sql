-- Crear tabla product_uoms

CREATE TABLE product_uoms (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  uom_catalog_id VARCHAR(36) NOT NULL,
  factor INT DEFAULT 1 NOT NULL,
  is_base BOOLEAN DEFAULT FALSE NOT NULL,
  parent_uom_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_product_uoms_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_product_uoms_uom_catalog 
    FOREIGN KEY (uom_catalog_id) REFERENCES uom_catalog(id) ON DELETE RESTRICT,
  
  CONSTRAINT fk_product_uoms_parent 
    FOREIGN KEY (parent_uom_id) REFERENCES uom_catalog(id) ON DELETE SET NULL,
  
  CONSTRAINT product_uom_unique UNIQUE (product_id, uom_catalog_id)
);

CREATE INDEX product_index ON product_uoms(product_id);
CREATE INDEX uom_catalog_index ON product_uoms(uom_catalog_id);

-- Verificar
SELECT * FROM product_uoms LIMIT 5;
