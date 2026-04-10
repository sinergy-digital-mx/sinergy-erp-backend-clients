-- Migration: Create pos_sessions table
-- Description: Stores POS session information for cash management and shift control

CREATE TABLE pos_sessions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    pos_configuration_id VARCHAR(36) NOT NULL COMMENT 'Reference to pos_configurations.id',
    user_id VARCHAR(36) NOT NULL COMMENT 'Cashier/seller who opened the session',
    session_number INT NOT NULL COMMENT 'Sequential number per POS configuration',
    
    -- Session timing
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When session was opened',
    closed_at TIMESTAMP NULL COMMENT 'When session was closed',
    
    -- Cash management
    opening_cash DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Initial cash in drawer',
    closing_cash DECIMAL(10, 2) NULL COMMENT 'Final cash counted at closing',
    expected_cash DECIMAL(10, 2) NULL COMMENT 'Expected cash based on transactions',
    cash_difference DECIMAL(10, 2) NULL COMMENT 'Difference between expected and actual (closing - expected)',
    
    -- Session status
    status ENUM('open', 'closed', 'suspended') NOT NULL DEFAULT 'open' COMMENT 'Current session status',
    
    -- Additional tracking
    total_sales DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Total sales amount during session',
    total_transactions INT DEFAULT 0 COMMENT 'Number of transactions processed',
    notes TEXT NULL COMMENT 'Optional notes or observations',
    closed_by VARCHAR(36) NULL COMMENT 'User who closed the session (if different from opener)',
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT FK_pos_sessions_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT FK_pos_sessions_pos_configuration 
        FOREIGN KEY (pos_configuration_id) REFERENCES pos_configurations(id) ON DELETE RESTRICT,
    CONSTRAINT FK_pos_sessions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT FK_pos_sessions_closed_by 
        FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Business rule: Only one open session per POS configuration
    CONSTRAINT UQ_pos_sessions_open_per_config 
        UNIQUE (pos_configuration_id, status) 
        -- Note: This works in MySQL 8.0+ with functional indexes, otherwise use application logic
);

-- Indexes for performance
CREATE INDEX idx_pos_sessions_tenant ON pos_sessions(tenant_id);
CREATE INDEX idx_pos_sessions_pos_config ON pos_sessions(pos_configuration_id);
CREATE INDEX idx_pos_sessions_user ON pos_sessions(user_id);
CREATE INDEX idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX idx_pos_sessions_opened_at ON pos_sessions(opened_at);
CREATE INDEX idx_pos_sessions_tenant_status ON pos_sessions(tenant_id, status);

-- Composite index for finding sessions by config and date
CREATE INDEX idx_pos_sessions_config_date ON pos_sessions(pos_configuration_id, opened_at);

-- Unique constraint for session number per POS configuration
CREATE UNIQUE INDEX idx_pos_sessions_number ON pos_sessions(tenant_id, pos_configuration_id, session_number);
