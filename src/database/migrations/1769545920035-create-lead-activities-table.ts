import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeadActivitiesTable1769545920035 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE lead_activities (
                id VARCHAR(36) PRIMARY KEY,
                lead_id INT NOT NULL,
                user_id VARCHAR(36) NULL,
                tenant_id VARCHAR(36) NOT NULL,
                type ENUM('call', 'email', 'meeting', 'note', 'task', 'follow_up') NOT NULL DEFAULT 'call',
                status ENUM('completed', 'scheduled', 'cancelled', 'in_progress') NOT NULL DEFAULT 'completed',
                title VARCHAR(200) NOT NULL,
                description TEXT NULL,
                activity_date DATETIME NOT NULL,
                duration_minutes INT NULL COMMENT 'Duration in minutes',
                outcome VARCHAR(100) NULL,
                follow_up_date DATETIME NULL,
                notes TEXT NULL,
                metadata JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX lead_activity_tenant_index (lead_id, tenant_id),
                INDEX lead_activity_user_index (user_id, tenant_id),
                INDEX lead_activity_type_index (type, tenant_id),
                INDEX lead_activity_date_index (activity_date, tenant_id),
                
                CONSTRAINT FK_lead_activities_lead_id 
                    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
                CONSTRAINT FK_lead_activities_user_id 
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                CONSTRAINT FK_lead_activities_tenant_id 
                    FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS lead_activities`);
    }

}
