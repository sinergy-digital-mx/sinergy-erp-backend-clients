-- Crear tabla product_price_lists
CREATE TABLE product_price_lists (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_price_lists_tenant 
    FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
  
  CONSTRAINT tenant_name_unique UNIQUE (tenant_id, name)
);

CREATE INDEX tenant_index ON product_price_lists(tenant_id);

-- Crear tabla product_prices
CREATE TABLE product_prices (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  price_list_id VARCHAR(36) NOT NULL,
  product_uom_id VARCHAR(36) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  iva_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
  ieps_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
  iva_unit_total DECIMAL(12,2) DEFAULT 0 NOT NULL,
  ieps_unit_total DECIMAL(12,2) DEFAULT 0 NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_product_prices_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_product_prices_price_list 
    FOREIGN KEY (price_list_id) REFERENCES product_price_lists(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_product_prices_product_uom 
    FOREIGN KEY (product_uom_id) REFERENCES product_uoms(id) ON DELETE CASCADE,
  
  CONSTRAINT product_price_list_uom_unique UNIQUE (product_id, price_list_id, product_uom_id)
);

CREATE INDEX product_index ON product_prices(product_id);
CREATE INDEX price_list_index ON product_prices(price_list_id);
CREATE INDEX product_uom_index ON product_prices(product_uom_id);

-- Verificar
SELECT * FROM product_price_lists LIMIT 5;
SELECT * FROM product_prices LIMIT 5;
