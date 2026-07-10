create table if not exists audit_logs
(
    id                varchar(36)                                                                                                                                                                                                                                                                                      not null
        primary key,
    action            enum ('permission_granted', 'permission_revoked', 'role_assigned', 'role_unassigned', 'role_created', 'role_updated', 'role_deleted', 'permission_created', 'permission_updated', 'permission_deleted', 'access_granted', 'access_denied', 'tenant_created', 'tenant_updated', 'tenant_deleted') not null,
    result            enum ('success', 'failure', 'error')                                                                                                                                                                                                                                                             not null,
    user_id           varchar(255)                                                                                                                                                                                                                                                                                     null,
    actor_id          varchar(255)                                                                                                                                                                                                                                                                                     null,
    tenant_id         varchar(36)                                                                                                                                                                                                                                                                                      null,
    resource_type     varchar(255)                                                                                                                                                                                                                                                                                     null,
    resource_id       varchar(255)                                                                                                                                                                                                                                                                                     null,
    entity_type       varchar(255)                                                                                                                                                                                                                                                                                     null,
    permission_action varchar(255)                                                                                                                                                                                                                                                                                     null,
    role_id           varchar(255)                                                                                                                                                                                                                                                                                     null,
    permission_id     varchar(255)                                                                                                                                                                                                                                                                                     null,
    details           text                                                                                                                                                                                                                                                                                             null,
    error_message     varchar(255)                                                                                                                                                                                                                                                                                     null,
    ip_address        varchar(255)                                                                                                                                                                                                                                                                                     null,
    user_agent        varchar(255)                                                                                                                                                                                                                                                                                     null,
    metadata          json                                                                                                                                                                                                                                                                                             null,
    created_at        datetime(6) default CURRENT_TIMESTAMP(6)                                                                                                                                                                                                                                                         not null
);

create index IDX_audit_logs_action_created
    on audit_logs (action, created_at);

create index IDX_audit_logs_result_created
    on audit_logs (result, created_at);

create index IDX_audit_logs_tenant_created
    on audit_logs (tenant_id, created_at);

create index IDX_audit_logs_user_created
    on audit_logs (user_id, created_at);

create table if not exists catalogs
(
    id           int auto_increment
        primary key,
    catalog_type enum ('phone_country', 'industry', 'lead_source', 'customer_type', 'activity_type') not null,
    name         varchar(100)                                                                        not null,
    code         varchar(50)                                                                         not null,
    value        varchar(100)                                                                        null,
    description  text                                                                                null,
    metadata     json                                                                                null,
    is_active    tinyint(1) default 1                                                                not null,
    sort_order   int        default 0                                                                not null,
    created_at   timestamp  default CURRENT_TIMESTAMP                                                not null,
    updated_at   timestamp  default CURRENT_TIMESTAMP                                                not null on update CURRENT_TIMESTAMP
);

create index catalog_code_index
    on catalogs (code);

create index catalog_type_index
    on catalogs (catalog_type);

create table if not exists contract_payments
(
    id                         varchar(36)                                                                    not null
        primary key,
    tenant_id                  varchar(36)                                                                    not null,
    contract_id                varchar(36)                                                                    not null,
    payment_number             varchar(50)                                                                    not null,
    payment_date               date                                                                           not null,
    amount_paid                decimal(15, 2)                                                                 not null,
    payment_method             varchar(50)                                          default 'transferencia'   null,
    status                     enum ('pagado', 'pendiente', 'parcial', 'cancelado') default 'pendiente'       not null,
    notes                      text                                                                           null,
    metadata                   json                                                                           null,
    created_at                 timestamp                                            default CURRENT_TIMESTAMP null,
    updated_at                 timestamp                                            default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    amount                     decimal(15, 2)                                       default 0.00              null,
    amount_pending             decimal(15, 2)                                       default 0.00              null,
    due_date                   date                                                                           null,
    paid_date                  date                                                                           null,
    first_partial_payment_date date                                                                           null,
    is_overdue                 tinyint                                              default 0                 not null
)
    collate = utf8mb4_unicode_ci;

create index contract_index
    on contract_payments (contract_id);

create index payment_date_index
    on contract_payments (payment_date);

create index status_index
    on contract_payments (status);

create index tenant_index
    on contract_payments (tenant_id);

create table if not exists customer_addresses
(
    id               int auto_increment
        primary key,
    type             varchar(255)                        not null,
    street_address   varchar(255)                        not null,
    street_address_2 varchar(255)                        null,
    city             varchar(255)                        not null,
    state            varchar(255)                        not null,
    postal_code      varchar(255)                        not null,
    country          varchar(255)                        not null,
    is_primary       tinyint   default 0                 not null,
    created_at       timestamp default CURRENT_TIMESTAMP not null,
    updated_at       timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    customer_id      int                                 null,
    tenant_id        varchar(36)                         null
);

create index FK_customer_addresses_rbac_tenant_id
    on customer_addresses (tenant_id);

create table if not exists customer_groups
(
    id          varchar(36)                         not null
        primary key,
    tenant_id   varchar(255)                        not null,
    name        varchar(255)                        not null,
    description text                                null,
    created_at  timestamp default CURRENT_TIMESTAMP not null,
    updated_at  timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
);

create index FK_76859f3c01882506503fec8c9a3
    on customer_groups (tenant_id);

create table if not exists customer_status
(
    id   int auto_increment
        primary key,
    code varchar(255) not null,
    name varchar(255) not null,
    constraint IDX_78e99d7a61b9583fe9e5c7d95e
        unique (code)
);

create table if not exists documents
(
    id          varchar(36)                         not null
        primary key,
    filename    varchar(255)                        not null,
    file_type   varchar(100)                        not null,
    s3_key      varchar(500)                        not null,
    s3_url      varchar(1000)                       not null,
    uploader_id varchar(36)                         not null,
    file_size   bigint                              not null,
    upload_date timestamp default CURRENT_TIMESTAMP not null,
    created_at  timestamp default CURRENT_TIMESTAMP not null,
    updated_at  timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
);

create table if not exists email_messages
(
    id                varchar(36)                           not null
        primary key,
    tenant_id         varchar(36)                           not null,
    thread_id         varchar(36)                           not null,
    message_id        varchar(255)                          not null,
    in_reply_to       varchar(255)                          null,
    from_email        varchar(255)                          not null,
    to_email          varchar(255)                          not null,
    cc                varchar(255)                          null,
    bcc               varchar(255)                          null,
    subject           varchar(255)                          not null,
    body              text                                  not null,
    body_html         text                                  null,
    direction         varchar(50) default 'outbound'        not null,
    status            varchar(50) default 'pending'         not null,
    external_provider varchar(50) default 'gmail'           not null,
    external_id       varchar(255)                          null,
    created_at        timestamp   default CURRENT_TIMESTAMP not null,
    received_at       timestamp                             null,
    read_at           timestamp                             null
);

create index IDX_email_messages_tenant_external
    on email_messages (tenant_id, external_id);

create index IDX_email_messages_thread_created
    on email_messages (thread_id, created_at);

create table if not exists entity_registry
(
    id   int auto_increment
        primary key,
    code varchar(255) not null,
    name varchar(255) not null,
    constraint IDX_2c905ed457c9332edfef026a29
        unique (code)
);

create table if not exists email_threads
(
    id              varchar(36)                           not null
        primary key,
    tenant_id       varchar(36)                           not null,
    entity_type     varchar(50)                           not null,
    entity_id       varchar(36)                           not null,
    subject         varchar(255)                          not null,
    email_from      varchar(255)                          not null,
    email_to        varchar(255)                          not null,
    status          varchar(50) default 'draft'           not null,
    last_message_at timestamp                             null,
    message_count   int         default 0                 not null,
    is_read         tinyint(1)  default 0                 not null,
    created_by      varchar(36)                           null,
    created_at      timestamp   default CURRENT_TIMESTAMP not null,
    updated_at      timestamp   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    lead_id         int                                   null comment 'Foreign key to leads table',
    entity_type_id  int                                   null,
    constraint FK_13f7a253f98aa9952469801d5aa
        foreign key (entity_type_id) references entity_registry (id)
);

create index IDX_email_threads_lead_id
    on email_threads (lead_id);

create index IDX_email_threads_tenant_entity
    on email_threads (tenant_id, entity_type, entity_id);

create index IDX_email_threads_tenant_status
    on email_threads (tenant_id, status);

create table if not exists exchange_rates
(
    id            varchar(36) default (uuid())          not null
        primary key,
    tenant_id     varchar(36)                           not null,
    rate_date     date                                  not null,
    exchange_rate decimal(10, 4)                        not null,
    notes         varchar(255)                          null,
    created_at    timestamp   default CURRENT_TIMESTAMP not null,
    updated_at    timestamp   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
);

create index IDX_exchange_rates_rate_date
    on exchange_rates (rate_date);

create index IDX_exchange_rates_tenant_date
    on exchange_rates (tenant_id, rate_date);

create index IDX_exchange_rates_tenant_id
    on exchange_rates (tenant_id);

create table if not exists inv_s_purchase_order_document_types
(
    id          int auto_increment
        primary key,
    name        varchar(100)                        not null,
    description varchar(255)                        null,
    created_at  timestamp default CURRENT_TIMESTAMP null,
    constraint UQ_7f98a983f342cbb010b03d22cf8
        unique (name)
);

create table if not exists lead_activities
(
    id               varchar(36)                                                                              not null
        primary key,
    lead_id          int                                                                                      not null,
    user_id          varchar(36)                                                                              null,
    tenant_id        varchar(36)                                                                              not null,
    type             enum ('call', 'email', 'meeting', 'note', 'task', 'follow_up') default 'call'            not null,
    status           enum ('completed', 'scheduled', 'cancelled', 'in_progress')    default 'completed'       not null,
    title            varchar(200)                                                                             not null,
    description      text                                                                                     null,
    activity_date    timestamp                                                                                not null,
    duration_minutes int                                                                                      null comment 'Duration in minutes',
    outcome          varchar(100)                                                                             null,
    follow_up_date   timestamp                                                                                null,
    notes            text                                                                                     null,
    metadata         json                                                                                     null,
    created_at       timestamp                                                      default CURRENT_TIMESTAMP not null,
    updated_at       timestamp                                                      default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
);

create index FK_lead_activities_tenant_id
    on lead_activities (tenant_id);

create index lead_activity_date_index
    on lead_activities (activity_date, tenant_id);

create index lead_activity_tenant_index
    on lead_activities (lead_id, tenant_id);

create index lead_activity_type_index
    on lead_activities (type, tenant_id);

create index lead_activity_user_index
    on lead_activities (user_id, tenant_id);

create table if not exists lead_addresses
(
    id               int auto_increment
        primary key,
    type             varchar(255)                        not null,
    street_address   varchar(255)                        not null,
    street_address_2 varchar(255)                        null,
    city             varchar(255)                        not null,
    state            varchar(255)                        not null,
    postal_code      varchar(255)                        not null,
    country          varchar(255)                        not null,
    is_primary       tinyint   default 0                 not null,
    created_at       timestamp default CURRENT_TIMESTAMP not null,
    updated_at       timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    lead_id          int                                 null,
    tenant_id        varchar(36)                         null
);

create index FK_lead_addresses_rbac_tenant_id
    on lead_addresses (tenant_id);

create table if not exists lead_groups
(
    id          varchar(36)                         not null
        primary key,
    tenant_id   varchar(255)                        not null,
    name        varchar(255)                        not null,
    description text                                null,
    created_at  timestamp default CURRENT_TIMESTAMP not null,
    updated_at  timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
);

create index FK_05824d2b985555c9c8930e6ed10
    on lead_groups (tenant_id);

create table if not exists lead_status
(
    id   int auto_increment
        primary key,
    code varchar(255) not null,
    name varchar(255) not null,
    constraint IDX_41eb934819883f62c971c646b2
        unique (code)
);

create table if not exists leads
(
    id                       int auto_increment
        primary key,
    source                   varchar(255)                         null,
    created_at               timestamp  default CURRENT_TIMESTAMP not null,
    tenant_id                varchar(36)                          null,
    status_id                int                                  null,
    name                     varchar(255)                         not null,
    lastname                 varchar(255)                         not null,
    email                    varchar(255)                         not null,
    phone                    varchar(255)                         not null,
    phone_country            varchar(2)                           not null,
    phone_code               varchar(5)                           not null,
    company_name             varchar(255)                         null,
    company_phone            varchar(255)                         null,
    website                  varchar(255)                         null,
    assigned_rep_id          varchar(36)                          null,
    email_contacted          tinyint(1) default 0                 not null,
    first_email_sent_at      timestamp                            null,
    customer_answered        tinyint(1) default 0                 not null,
    customer_answered_at     timestamp                            null,
    group_id                 varchar(255)                         null,
    last_email_thread_status varchar(255)                         null comment 'Track latest email thread status: draft, sent, replied, closed, archived',
    last_email_thread_id     varchar(255)                         null comment 'Reference to the latest email thread',
    email_thread_count       int        default 0                 not null comment 'Total number of email threads for this lead',
    agent_replied_back       tinyint(1) default 0                 not null,
    agent_replied_back_at    timestamp                            null,
    constraint FK_a2c42b471f34d261cfbad2427d6
        foreign key (status_id) references lead_status (id)
);

create index FK_e55bff85b7e8754e7f7dcefab52
    on leads (group_id);

create index FK_leads_rbac_tenant_id
    on leads (tenant_id);

create table if not exists measurement_units
(
    id          varchar(36)                                           not null
        primary key,
    code        varchar(20)                                           not null,
    name        varchar(100)                                          not null,
    symbol      varchar(10)                                           not null,
    description text                                                  null,
    `system`    enum ('metric', 'imperial') default 'metric'          null,
    created_at  timestamp                   default CURRENT_TIMESTAMP null,
    constraint code
        unique (code)
);

create index code_index
    on measurement_units (code);

create table if not exists migrations
(
    id        int auto_increment
        primary key,
    timestamp bigint       not null,
    name      varchar(255) not null
);

create table if not exists modules
(
    id          varchar(36)                         not null
        primary key,
    name        varchar(100)                        not null,
    code        varchar(50)                         not null,
    description varchar(255)                        null,
    created_at  timestamp default CURRENT_TIMESTAMP not null,
    constraint UQ_25b42b11ac8b697cdb2eddcef1a
        unique (code),
    constraint code_index
        unique (code)
);

create table if not exists phone_countries
(
    id           int auto_increment
        primary key,
    country_name varchar(100)                         not null,
    country_code varchar(3)                           not null,
    phone_code   varchar(20)                          not null,
    flag_emoji   varchar(50)                          null,
    is_active    tinyint(1) default 1                 null,
    created_at   timestamp  default CURRENT_TIMESTAMP null,
    updated_at   timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP
)
    collate = utf8mb4_unicode_ci;

create index phone_country_code_index
    on phone_countries (phone_code);

create index phone_country_name_index
    on phone_countries (country_name);

create table if not exists rbac_permissions
(
    id                   varchar(36)                         not null
        primary key,
    entity_registry_id   int                                 not null,
    action               varchar(255)                        not null,
    description          varchar(255)                        null,
    is_system_permission tinyint   default 0                 not null,
    created_at           timestamp default CURRENT_TIMESTAMP not null,
    updated_at           timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    module_id            varchar(36)                         null,
    constraint module_action_index
        unique (module_id, action),
    constraint FK_e6a2c7bf2684feb9b05a3a3721e
        foreign key (module_id) references modules (id)
            on delete cascade
);

create index IDX_rbac_permissions_entity_registry_id
    on rbac_permissions (entity_registry_id);

create index action_index
    on rbac_permissions (action);

create index module_index_permissions
    on rbac_permissions (module_id);

create table if not exists rbac_tenants
(
    id               varchar(36)                         not null
        primary key,
    name             varchar(255)                        not null,
    subdomain        varchar(255)                        not null,
    is_active        tinyint   default 1                 not null,
    created_at       timestamp default CURRENT_TIMESTAMP not null,
    updated_at       timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    legacy_tenant_id varchar(255)                        null,
    constraint IDX_17178b3a1eeb26bb657e753d44
        unique (name),
    constraint IDX_cd26a0ba3780becea66b837603
        unique (subdomain)
);

create table if not exists categories
(
    id            varchar(36)                                           not null
        primary key,
    tenant_id     varchar(36)                                           not null,
    name          varchar(255)                                          not null,
    description   text                                                  null,
    status        enum ('active', 'inactive') default 'active'          not null,
    icon          varchar(255)                                          null,
    display_order int                         default 0                 not null,
    created_at    timestamp                   default CURRENT_TIMESTAMP not null,
    updated_at    timestamp                   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint FK_5d4fe23b360b1b9e16a3f41727f
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index status_index
    on categories (status);

create index tenant_index
    on categories (tenant_id);

create index tenant_status_index
    on categories (tenant_id, status);

create table if not exists contract_documents
(
    id          varchar(36)                                                        not null
        primary key,
    tenant_id   varchar(36)                                                        not null,
    contract_id varchar(36) collate utf8mb4_unicode_ci                             not null,
    file_name   varchar(255)                                                       not null,
    s3_key      varchar(500)                                                       not null,
    mime_type   varchar(100)                                                       not null,
    file_size   bigint                                                             not null,
    notes       text                                                               null,
    status      enum ('pending', 'approved', 'rejected') default 'pending'         null,
    metadata    json                                                               null,
    uploaded_by varchar(36)                                                        null,
    created_at  timestamp                                default CURRENT_TIMESTAMP null,
    updated_at  timestamp                                default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint contract_documents_ibfk_1
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index contract_index
    on contract_documents (contract_id);

create index tenant_index
    on contract_documents (tenant_id);

create table if not exists document_types
(
    id          varchar(36)                          not null
        primary key,
    tenant_id   varchar(36)                          null,
    code        varchar(100)                         not null,
    name        varchar(150)                         not null,
    description text                                 null,
    is_active   tinyint(1) default 1                 null,
    is_required tinyint(1) default 0                 null,
    metadata    json                                 null,
    created_at  timestamp  default CURRENT_TIMESTAMP null,
    constraint document_types_ibfk_1
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index tenant_index
    on document_types (tenant_id);

create table if not exists email_templates
(
    id               varchar(36)                               not null
        primary key,
    tenant_id        varchar(36) charset utf8mb4               not null,
    name             varchar(150)                              not null,
    subject          varchar(255)                              not null,
    body_html        longtext                                  not null,
    variables        json                                      null,
    custom_variables json                                      null,
    is_active        tinyint(1)   default 1                    not null,
    created_by       varchar(36)                               null,
    updated_by       varchar(36)                               null,
    deleted_at       timestamp                                 null,
    deleted_by       varchar(36)                               null,
    created_at       timestamp(6) default CURRENT_TIMESTAMP(6) not null,
    updated_at       timestamp(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    constraint fk_email_templates_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

create index idx_email_templates_tenant_active
    on email_templates (tenant_id, is_active);

create index idx_email_templates_tenant_name
    on email_templates (tenant_id, name);

create table if not exists fiscal_configurations
(
    id                    varchar(36)                                                                                                                                                     not null
        primary key,
    tenant_id             varchar(36)                                                                                                                                                     not null,
    razon_social          varchar(255)                                                                                                                                                    not null,
    rfc                   varchar(13)                                                                                                                                                     not null,
    persona_type          enum ('Persona Física', 'Persona Moral')                                                                                                                        not null,
    fiscal_regime         enum ('601', '603', '605', '606', '607', '608', '609', '610', '611', '614', '616', '620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '630') null,
    digital_seal          text                                                                                                                                                            null,
    digital_seal_password varchar(255)                                                                                                                                                    null,
    private_key           text                                                                                                                                                            null,
    status                enum ('active', 'inactive') default 'active'                                                                                                                    not null,
    created_at            timestamp                   default CURRENT_TIMESTAMP                                                                                                           not null,
    updated_at            timestamp                   default CURRENT_TIMESTAMP                                                                                                           not null on update CURRENT_TIMESTAMP,
    logo                  varchar(500)                                                                                                                                                    null,
    constraint FK_6a3ffa5eaa223d9f40fa47ac2ee
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create table if not exists billing_branches
(
    id                      varchar(36)                         not null
        primary key,
    fiscal_configuration_id varchar(36)                         not null,
    code                    varchar(255)                        not null,
    address                 varchar(255)                        not null,
    city                    varchar(255)                        not null,
    state                   varchar(255)                        not null,
    country                 varchar(255)                        not null,
    postal_code             varchar(20)                         not null,
    status                  tinyint   default 1                 not null comment '1 = active, 0 = inactive',
    created_at              timestamp default CURRENT_TIMESTAMP not null,
    updated_at              timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint idx_billing_branches_code_unique
        unique (fiscal_configuration_id, code),
    constraint FK_billing_branches_fiscal_configuration
        foreign key (fiscal_configuration_id) references fiscal_configurations (id)
            on delete cascade
);

create index idx_billing_branches_fiscal_config
    on billing_branches (fiscal_configuration_id);

create index tenant_index
    on fiscal_configurations (tenant_id);

create table if not exists mailer_configurations
(
    id                  varchar(36)                                    not null
        primary key,
    tenant_id           varchar(36)                                    not null,
    name                varchar(255)                                   not null,
    vendor              enum ('resend', 'sendgrid', 'aws_ses', 'smtp') not null,
    vendor_config       json                                           not null,
    is_active           tinyint(1) default 0                           not null,
    is_fallback         tinyint(1) default 0                           not null,
    is_valid            tinyint(1) default 1                           not null,
    created_at          timestamp  default CURRENT_TIMESTAMP           not null,
    created_by          varchar(36)                                    not null,
    updated_at          timestamp  default CURRENT_TIMESTAMP           not null on update CURRENT_TIMESTAMP,
    updated_by          varchar(36)                                    not null,
    deleted_at          timestamp                                      null,
    deleted_by          varchar(36)                                    null,
    last_test_result    json                                           null,
    last_test_timestamp timestamp                                      null,
    last_used_timestamp timestamp                                      null,
    constraint IDX_mailer_configurations_tenant_name
        unique (tenant_id, name),
    constraint FK_mailer_configurations_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create table if not exists mailer_configuration_audits
(
    id               varchar(36)                                                           not null
        primary key,
    configuration_id varchar(36)                                                           not null,
    tenant_id        varchar(36)                                                           not null,
    action           enum ('CREATE', 'UPDATE', 'DELETE', 'TEST', 'ACTIVATE', 'DEACTIVATE') not null,
    changed_fields   json                                                                  null,
    performed_by     varchar(36)                                                           not null,
    performed_at     timestamp default CURRENT_TIMESTAMP                                   not null,
    details          text                                                                  null,
    constraint FK_mailer_configuration_audits_configuration
        foreign key (configuration_id) references mailer_configurations (id)
            on delete cascade,
    constraint FK_mailer_configuration_audits_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index IDX_mailer_configuration_audits_configuration_id
    on mailer_configuration_audits (configuration_id);

create index IDX_mailer_configuration_audits_performed_at
    on mailer_configuration_audits (performed_at);

create index IDX_mailer_configuration_audits_tenant_id
    on mailer_configuration_audits (tenant_id);

create table if not exists mailer_configuration_health
(
    id                   varchar(36)                                                       not null
        primary key,
    configuration_id     varchar(36)                                                       not null,
    tenant_id            varchar(36)                                                       not null,
    last_test_result     enum ('SUCCESS', 'FAILURE', 'UNTESTED') default 'UNTESTED'        not null,
    last_test_timestamp  timestamp                                                         null,
    last_test_error      text                                                              null,
    last_used_timestamp  timestamp                                                         null,
    consecutive_failures int                                     default 0                 not null,
    is_healthy           tinyint(1)                              default 1                 not null,
    updated_at           timestamp                               default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint UQ_e232c165f183b69af72752369a5
        unique (configuration_id),
    constraint FK_mailer_configuration_health_configuration
        foreign key (configuration_id) references mailer_configurations (id)
            on delete cascade,
    constraint FK_mailer_configuration_health_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index IDX_mailer_configuration_health_is_healthy
    on mailer_configuration_health (is_healthy);

create index IDX_mailer_configuration_health_tenant_id
    on mailer_configuration_health (tenant_id);

create index IDX_mailer_configurations_created_at
    on mailer_configurations (created_at);

create index IDX_mailer_configurations_tenant_is_active
    on mailer_configurations (tenant_id, is_active);

create index IDX_mailer_configurations_tenant_is_fallback
    on mailer_configurations (tenant_id, is_fallback);

create table if not exists pos_configurations
(
    id         varchar(36)                           not null
        primary key,
    tenant_id  varchar(36)                           not null,
    code       varchar(255)                          not null,
    sucursal   varchar(36)                           not null comment 'Reference to billing_branches.id',
    modelo     varchar(255)                          null,
    status     tinyint     default 1                 not null comment '1 = active, 0 = inactive',
    created_at timestamp   default CURRENT_TIMESTAMP not null,
    updated_at timestamp   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    type       varchar(20) default 'VENTAS'          not null comment 'Equipment type: VENTAS or COBRANZA',
    constraint idx_pos_configurations_code_unique
        unique (tenant_id, code),
    constraint FK_pos_configurations_billing_branch
        foreign key (sucursal) references billing_branches (id)
);

create index branch_index
    on pos_configurations (sucursal);

create index tenant_index
    on pos_configurations (tenant_id);

create table if not exists product_attributes
(
    id         varchar(36)                         not null
        primary key,
    tenant_id  varchar(36)                         not null,
    name       varchar(100)                        not null,
    is_active  tinyint   default 1                 not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint UQ_product_attributes_tenant_name
        unique (tenant_id, name),
    constraint FK_product_attributes_tenant_id
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create table if not exists product_attribute_values
(
    id            varchar(36)                         not null
        primary key,
    attribute_id  varchar(36)                         not null,
    value         varchar(100)                        not null,
    display_order int       default 0                 not null,
    is_active     tinyint   default 1                 not null,
    created_at    timestamp default CURRENT_TIMESTAMP not null,
    updated_at    timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint UQ_product_attribute_values_attribute_value
        unique (attribute_id, value),
    constraint FK_product_attribute_values_attribute_id
        foreign key (attribute_id) references product_attributes (id)
            on delete cascade
);

create index IDX_product_attribute_values_attribute_id
    on product_attribute_values (attribute_id);

create index IDX_product_attribute_values_is_active
    on product_attribute_values (is_active);

create index IDX_product_attributes_is_active
    on product_attributes (is_active);

create index IDX_product_attributes_tenant_id
    on product_attributes (tenant_id);

create table if not exists product_price_lists
(
    id          varchar(36)                          not null
        primary key,
    tenant_id   varchar(36)                          not null,
    name        varchar(255)                         not null,
    description text                                 null,
    is_active   tinyint(1) default 1                 not null,
    created_at  timestamp  default CURRENT_TIMESTAMP not null,
    updated_at  timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint tenant_name_unique
        unique (tenant_id, name),
    constraint fk_price_lists_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index tenant_index
    on product_price_lists (tenant_id);

create table if not exists property_groups
(
    id                   varchar(36)                         not null
        primary key,
    tenant_id            varchar(36)                         not null,
    name                 varchar(100)                        not null,
    description          text                                null,
    location             varchar(50)                         null,
    total_area           decimal(15, 2)                      null,
    total_properties     int       default 0                 not null,
    available_properties int       default 0                 not null,
    sold_properties      int       default 0                 not null,
    created_at           timestamp default CURRENT_TIMESTAMP not null,
    updated_at           timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint FK_a2f301d89bc89c7c390572b50ac
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create table if not exists properties
(
    id                  varchar(36)                                                                                             not null
        primary key,
    tenant_id           varchar(36)                                                                                             not null,
    group_id            varchar(36)                                                                                             not null,
    code                varchar(50)                                                                                             not null,
    block               varchar(50)                                                                                             null,
    name                varchar(150)                                                                                            not null,
    description         text                                                                                                    null,
    location            varchar(255)                                                                                            null,
    total_area          decimal(12, 2)                                                                                          not null,
    total_price         decimal(15, 2)                                                                                          not null,
    list_price          decimal(15, 2)                                                                                          null,
    currency            varchar(10)                                              default 'MXN'                                  not null,
    status              enum ('disponible', 'vendido', 'reservado', 'cancelado') default 'disponible'                           not null,
    metadata            json                                                                                                    null,
    created_at          timestamp                                                default CURRENT_TIMESTAMP                      not null,
    updated_at          timestamp                                                default CURRENT_TIMESTAMP                      not null on update CURRENT_TIMESTAMP,
    measurement_unit_id varchar(36)                                              default '550e8400-e29b-41d4-a716-446655440001' not null,
    lot_number          varchar(50)                                                                                             null,
    constraint IDX_properties_code_tenant
        unique (code, tenant_id),
    constraint FK_391cc82bdbffcf9a8139ca80363
        foreign key (group_id) references property_groups (id)
            on delete cascade,
    constraint FK_6bcd5c3d46689610c9bbf14e0eb
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint FK_properties_measurement_unit_id
        foreign key (measurement_unit_id) references measurement_units (id)
);

create index IDX_properties_group_id
    on properties (group_id);

create index IDX_properties_tenant_id
    on properties (tenant_id);

create index IDX_property_groups_tenant_id
    on property_groups (tenant_id);

create table if not exists rbac_roles
(
    id             varchar(36)                          not null
        primary key,
    name           varchar(255)                         not null,
    description    varchar(255)                         null,
    is_system_role tinyint    default 0                 not null,
    tenant_id      varchar(255)                         not null,
    created_at     timestamp  default CURRENT_TIMESTAMP not null,
    updated_at     timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    is_admin       tinyint(1) default 0                 not null,
    constraint tenant_name_index
        unique (tenant_id, name),
    constraint FK_252a038d62e9d956b067421766c
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create table if not exists rbac_role_permissions
(
    id            varchar(36)                         not null
        primary key,
    role_id       varchar(255)                        not null,
    permission_id varchar(255)                        not null,
    created_at    timestamp default CURRENT_TIMESTAMP not null,
    constraint role_permission_index
        unique (role_id, permission_id),
    constraint FK_6e03d8aa0ac0be56a799875ac4d
        foreign key (permission_id) references rbac_permissions (id)
            on delete cascade,
    constraint FK_6eb94e2e9d283993bc7c2f01603
        foreign key (role_id) references rbac_roles (id)
            on delete cascade
);

create index permission_index
    on rbac_role_permissions (permission_id);

create index role_index
    on rbac_role_permissions (role_id);

create index name_index
    on rbac_roles (name);

create index tenant_index
    on rbac_roles (tenant_id);

create index name_index
    on rbac_tenants (name);

create index subdomain_index
    on rbac_tenants (subdomain);

create table if not exists subcategories
(
    id            varchar(36)                                           not null
        primary key,
    tenant_id     varchar(36)                                           not null,
    category_id   varchar(36)                                           not null,
    name          varchar(255)                                          not null,
    description   text                                                  null,
    status        enum ('active', 'inactive') default 'active'          not null,
    icon          varchar(255)                                          null,
    display_order int                         default 0                 not null,
    created_at    timestamp                   default CURRENT_TIMESTAMP not null,
    updated_at    timestamp                   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint FK_7d1f9a3f167de40cc4c911d2486
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint FK_f7b015bc580ae5179ba5a4f42ec
        foreign key (category_id) references categories (id)
            on delete cascade
);

create table if not exists products
(
    id             varchar(36)                          not null
        primary key,
    tenant_id      varchar(36)                          not null,
    sku            varchar(255)                         not null,
    external_sku   varchar(255)                         null,
    name           varchar(255)                         not null,
    description    text                                 null,
    is_active      tinyint(1) default 1                 not null,
    created_at     timestamp  default CURRENT_TIMESTAMP not null,
    updated_at     timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    category_id    varchar(36)                          null,
    subcategory_id varchar(36)                          null,
    photo          varchar(500)                         null,
    constraint UQ_products_tenant_external_sku
        unique (tenant_id, external_sku),
    constraint UQ_products_tenant_sku
        unique (tenant_id, sku),
    constraint FK_products_category_id
        foreign key (category_id) references categories (id)
            on delete set null,
    constraint FK_products_subcategory_id
        foreign key (subcategory_id) references subcategories (id)
            on delete set null
);

create table if not exists product_photos
(
    id            varchar(36)                          not null
        primary key,
    tenant_id     varchar(36)                          not null,
    product_id    varchar(36)                          not null,
    file_name     varchar(255)                         not null,
    s3_key        varchar(500)                         not null,
    mime_type     varchar(100)                         not null,
    file_size     bigint                               not null,
    display_order int        default 0                 not null,
    is_primary    tinyint(1) default 0                 not null,
    alt_text      text                                 null,
    uploaded_by   varchar(36)                          null,
    created_at    timestamp  default CURRENT_TIMESTAMP not null,
    updated_at    timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint FK_product_photos_product_id
        foreign key (product_id) references products (id)
            on delete cascade,
    constraint FK_product_photos_tenant_id
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index IDX_product_photos_is_primary
    on product_photos (product_id, is_primary);

create index IDX_product_photos_product_id
    on product_photos (product_id);

create index IDX_product_photos_tenant_id
    on product_photos (tenant_id);

create index IDX_products_category_id
    on products (category_id);

create index IDX_products_external_sku
    on products (external_sku);

create index IDX_products_sku
    on products (sku);

create index IDX_products_subcategory_id
    on products (subcategory_id);

create index IDX_products_tenant_category
    on products (tenant_id, category_id);

create index IDX_products_tenant_id
    on products (tenant_id);

create index IDX_products_tenant_subcategory
    on products (tenant_id, subcategory_id);

create index category_index
    on subcategories (category_id);

create index status_index
    on subcategories (status);

create index tenant_category_index
    on subcategories (tenant_id, category_id);

create index tenant_index
    on subcategories (tenant_id);

create table if not exists tenant_modules
(
    id         varchar(36)                          not null
        primary key,
    tenant_id  varchar(36)                          not null,
    module_id  varchar(36)                          not null,
    is_enabled tinyint(1) default 1                 not null,
    created_at timestamp  default CURRENT_TIMESTAMP not null,
    constraint tenant_module_index
        unique (tenant_id, module_id),
    constraint FK_0667f94fca07ca1e6ec5c833aa6
        foreign key (module_id) references modules (id)
            on delete cascade,
    constraint FK_a5b7a4c8027dea979f5f731c522
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index module_index
    on tenant_modules (module_id);

create index tenant_index
    on tenant_modules (tenant_id);

create table if not exists third_party_configs
(
    id                       varchar(36)                          not null
        primary key,
    tenant_id                varchar(36)                          not null,
    provider                 varchar(100)                         not null,
    name                     varchar(255)                         not null,
    encrypted_api_key        longtext                             not null,
    encrypted_api_secret     longtext                             null,
    encrypted_webhook_secret longtext                             null,
    metadata                 json                                 null,
    is_enabled               tinyint(1) default 1                 not null,
    is_test_mode             tinyint(1) default 0                 not null,
    last_tested_at           timestamp                            null,
    created_by               varchar(36)                          null,
    updated_by               varchar(36)                          null,
    created_at               timestamp  default CURRENT_TIMESTAMP not null,
    updated_at               timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint IDX_third_party_configs_tenant_provider
        unique (tenant_id, provider)
);

create index IDX_third_party_configs_tenant_id
    on third_party_configs (tenant_id);

create table if not exists uom_catalog
(
    id          varchar(36)                         not null
        primary key,
    tenant_id   varchar(36)                         not null,
    name        varchar(255)                        not null,
    description text                                null,
    created_at  timestamp default CURRENT_TIMESTAMP not null,
    updated_at  timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint fk_uom_catalog_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create table if not exists product_uoms
(
    id             varchar(36)                          not null
        primary key,
    product_id     varchar(36)                          not null,
    uom_catalog_id varchar(36)                          not null,
    factor         int        default 1                 not null,
    is_base        tinyint(1) default 0                 not null,
    parent_uom_id  varchar(36)                          null,
    created_at     timestamp  default CURRENT_TIMESTAMP not null,
    updated_at     timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint product_uom_unique
        unique (product_id, uom_catalog_id),
    constraint fk_product_uoms_parent
        foreign key (parent_uom_id) references uom_catalog (id)
            on delete set null,
    constraint fk_product_uoms_product
        foreign key (product_id) references products (id)
            on delete cascade,
    constraint fk_product_uoms_uom_catalog
        foreign key (uom_catalog_id) references uom_catalog (id)
);

create table if not exists product_prices
(
    id              varchar(36)                              not null
        primary key,
    product_id      varchar(36)                              not null,
    price_list_id   varchar(36)                              not null,
    product_uom_id  varchar(36)                              not null,
    price           decimal(12, 2)                           not null,
    iva_percentage  decimal(5, 2)  default 0.00              not null,
    ieps_percentage decimal(5, 2)  default 0.00              not null,
    iva_unit_total  decimal(12, 2) default 0.00              not null,
    ieps_unit_total decimal(12, 2) default 0.00              not null,
    subtotal        decimal(12, 2)                           not null,
    total           decimal(12, 2) default 0.00              not null,
    created_at      timestamp      default CURRENT_TIMESTAMP not null,
    updated_at      timestamp      default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint product_price_list_uom_unique
        unique (product_id, price_list_id, product_uom_id),
    constraint fk_product_prices_price_list
        foreign key (price_list_id) references product_price_lists (id)
            on delete cascade,
    constraint fk_product_prices_product
        foreign key (product_id) references products (id)
            on delete cascade,
    constraint fk_product_prices_product_uom
        foreign key (product_uom_id) references product_uoms (id)
            on delete cascade
);

create index price_list_index
    on product_prices (price_list_id);

create index product_index
    on product_prices (product_id);

create index product_uom_index
    on product_prices (product_uom_id);

create index product_index
    on product_uoms (product_id);

create index uom_catalog_index
    on product_uoms (uom_catalog_id);

create index tenant_index
    on uom_catalog (tenant_id);

create table if not exists user_status
(
    id   int auto_increment
        primary key,
    code varchar(255) not null,
    name varchar(255) not null,
    constraint IDX_587cd524e46e72a3a405b0bb27
        unique (code)
);

create table if not exists users
(
    id                  varchar(36)                           not null
        primary key,
    tenant_id           varchar(36)                           null,
    status_id           int                                   null,
    email               varchar(255)                          not null,
    password            varchar(255)                          not null,
    last_login_at       timestamp                             null,
    created_at          timestamp   default CURRENT_TIMESTAMP not null,
    updated_at          timestamp   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    first_name          varchar(100)                          null,
    last_name           varchar(100)                          null,
    phone               varchar(20)                           null,
    language_code       varchar(10) default 'es'              null,
    permissions_version int         default 1                 not null
);

create table if not exists pos_sessions
(
    id                   varchar(36)                                                    not null
        primary key,
    tenant_id            varchar(36)                                                    not null,
    pos_configuration_id varchar(36)                                                    not null comment 'Reference to pos_configurations.id',
    user_id              varchar(36)                                                    not null comment 'Cashier/seller who opened the session',
    session_number       int                                                            not null comment 'Sequential number per POS configuration',
    opened_at            timestamp                            default CURRENT_TIMESTAMP not null comment 'When session was opened',
    closed_at            timestamp                                                      null comment 'When session was closed',
    opening_cash         decimal(10, 2)                       default 0.00              not null comment 'Initial cash in drawer',
    closing_cash         decimal(10, 2)                                                 null comment 'Final cash counted at closing',
    expected_cash        decimal(10, 2)                                                 null comment 'Expected cash based on transactions',
    cash_difference      decimal(10, 2)                                                 null comment 'Difference between expected and actual (closing - expected)',
    status               enum ('open', 'closed', 'suspended') default 'open'            not null comment 'Current session status',
    total_sales          decimal(10, 2)                       default 0.00              null comment 'Total sales amount during session',
    total_transactions   int                                  default 0                 null comment 'Number of transactions processed',
    notes                text                                                           null comment 'Optional notes or observations',
    closed_by            varchar(36)                                                    null comment 'User who closed the session (if different from opener)',
    created_at           timestamp                            default CURRENT_TIMESTAMP not null,
    updated_at           timestamp                            default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint UQ_pos_sessions_single_open_guard
        unique (pos_configuration_id, ((case when (`status` = _utf8mb4'open') then 1 else NULL end))),
    constraint idx_pos_sessions_number
        unique (tenant_id, pos_configuration_id, session_number),
    constraint FK_pos_sessions_closed_by
        foreign key (closed_by) references users (id)
            on delete set null,
    constraint FK_pos_sessions_pos_configuration
        foreign key (pos_configuration_id) references pos_configurations (id),
    constraint FK_pos_sessions_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint FK_pos_sessions_user
        foreign key (user_id) references users (id)
);

create index idx_pos_sessions_config_date
    on pos_sessions (pos_configuration_id, opened_at);

create index idx_pos_sessions_opened_at
    on pos_sessions (opened_at);

create index idx_pos_sessions_pos_config
    on pos_sessions (pos_configuration_id);

create index idx_pos_sessions_status
    on pos_sessions (status);

create index idx_pos_sessions_tenant
    on pos_sessions (tenant_id);

create index idx_pos_sessions_tenant_status
    on pos_sessions (tenant_id, status);

create index idx_pos_sessions_user
    on pos_sessions (user_id);

create table if not exists rbac_user_roles
(
    id         varchar(36)                         not null
        primary key,
    user_id    varchar(255)                        not null,
    role_id    varchar(255)                        not null,
    tenant_id  varchar(255)                        not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    constraint user_role_tenant_index
        unique (user_id, role_id, tenant_id),
    constraint FK_39e3a8d5948cc0c3bb9dfe97382
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint FK_4e65c2f4fa77251a05d21e44a1a
        foreign key (user_id) references users (id)
            on delete cascade,
    constraint FK_8e6c750b54d0a976bdb5daf5cda
        foreign key (role_id) references rbac_roles (id)
            on delete cascade
);

create index role_index
    on rbac_user_roles (role_id);

create index tenant_index
    on rbac_user_roles (tenant_id);

create index user_tenant_index
    on rbac_user_roles (user_id, tenant_id);

create index FK_users_rbac_tenant_id
    on users (tenant_id);

create table if not exists vendors
(
    id                  varchar(36)                                                  not null
        primary key,
    tenant_id           varchar(36)                                                  not null,
    name                varchar(255)                                                 not null,
    company_name        varchar(255)                                                 not null,
    street              varchar(255)                                                 not null,
    city                varchar(255)                                                 not null,
    state               varchar(255)                                                 not null,
    zip_code            varchar(255)                                                 not null,
    country             varchar(255)                                                 not null,
    razon_social        varchar(255)                                                 not null,
    rfc                 varchar(255)                                                 not null,
    persona_type        enum ('Persona Física', 'Persona Moral')                     not null,
    status              enum ('active', 'inactive')        default 'active'          not null,
    created_at          timestamp                          default CURRENT_TIMESTAMP not null,
    updated_at          timestamp                          default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    credit_days         int                                                          null,
    credit_limit        decimal(15, 2)                                               null,
    vendor_type         enum ('NATIONAL', 'INTERNATIONAL') default 'NATIONAL'        not null,
    tax_id              varchar(64)                                                  null,
    legal_name          varchar(255)                                                 null,
    bank_name           varchar(120)                                                 null,
    bank_account_holder varchar(255)                                                 null,
    bank_account_number varchar(34)                                                  null,
    bank_clabe          varchar(18)                                                  null,
    bank_swift_bic      varchar(11)                                                  null,
    bank_iban           varchar(34)                                                  null,
    bank_currency       varchar(3)                                                   null,
    vendor_code         varchar(32)                                                  null,
    constraint FK_b362795545b91a886939d70beae
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create table if not exists product_vendor_costs
(
    id              varchar(36)                              not null
        primary key,
    product_id      varchar(36)                              not null,
    vendor_id       varchar(36)                              not null,
    product_uom_id  varchar(36)                              not null,
    cost            decimal(12, 2)                           not null,
    iva_percentage  decimal(5, 2)  default 0.00              not null,
    ieps_percentage decimal(5, 2)  default 0.00              not null,
    iva_unit_total  decimal(12, 2) default 0.00              not null,
    ieps_unit_total decimal(12, 2) default 0.00              not null,
    subtotal        decimal(12, 2)                           not null,
    total           decimal(12, 2) default 0.00              not null,
    created_at      timestamp      default CURRENT_TIMESTAMP not null,
    updated_at      timestamp      default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint product_vendor_uom_unique
        unique (product_id, vendor_id, product_uom_id),
    constraint fk_product_vendor_costs_product
        foreign key (product_id) references products (id)
            on delete cascade,
    constraint fk_product_vendor_costs_product_uom
        foreign key (product_uom_id) references product_uoms (id)
            on delete cascade,
    constraint fk_product_vendor_costs_vendor
        foreign key (vendor_id) references vendors (id)
            on delete cascade
);

create index product_index
    on product_vendor_costs (product_id);

create index product_uom_index
    on product_vendor_costs (product_uom_id);

create index vendor_index
    on product_vendor_costs (vendor_id);

create index IDX_vendors_tenant_vendor_code
    on vendors (tenant_id, vendor_code);

create index rfc_index
    on vendors (rfc);

create index status_index
    on vendors (status);

create index tenant_index
    on vendors (tenant_id);

create index vendor_type_index
    on vendors (vendor_type);

create table if not exists warehouses
(
    id                      varchar(36)                                           not null
        primary key,
    tenant_id               varchar(36)                                           not null,
    name                    varchar(255)                                          not null,
    code                    varchar(255)                                          not null,
    description             varchar(255)                                          null,
    street                  varchar(255)                                          not null,
    city                    varchar(255)                                          not null,
    state                   varchar(255)                                          not null,
    zip_code                varchar(255)                                          not null,
    country                 varchar(255)                                          not null,
    phone                   varchar(255)                                          null,
    email                   varchar(255)                                          null,
    contact_person          varchar(255)                                          null,
    status                  enum ('active', 'inactive') default 'active'          not null,
    metadata                json                                                  null,
    created_at              timestamp                   default CURRENT_TIMESTAMP not null,
    updated_at              timestamp                   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    fiscal_configuration_id varchar(36)                                           null,
    prefix                  varchar(10)                                           null,
    billing_branch_id       varchar(36)                                           null,
    constraint UQ_d8b96d60ff9a288f5ed862280d9
        unique (code),
    constraint FK_09106b8068aeaf74fa33666df8f
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint FK_746712ac0e81d7fe91f2be2c22e
        foreign key (fiscal_configuration_id) references fiscal_configurations (id)
            on delete set null,
    constraint FK_e7c616327d31567ecad1c231943
        foreign key (billing_branch_id) references billing_branches (id)
            on delete set null
);

create table if not exists customers
(
    id                       int auto_increment
        primary key,
    name                     varchar(255)                        not null,
    created_at               timestamp default CURRENT_TIMESTAMP not null,
    tenant_id                varchar(36)                         null,
    status_id                int                                 null,
    group_id                 varchar(255)                        null,
    lastname                 varchar(255)                        null,
    email                    varchar(255)                        null,
    phone                    varchar(255)                        null,
    phone_country            varchar(2)                          null,
    company_name             varchar(255)                        null,
    website                  varchar(255)                        null,
    phone_code               varchar(10)                         null,
    country                  varchar(100)                        null,
    additional_name          varchar(255)                        null,
    additional_lastname      varchar(255)                        null,
    additional_email         varchar(255)                        null,
    additional_phone         varchar(50)                         null,
    additional_phone_country varchar(2)                          null,
    additional_phone_code    varchar(10)                         null,
    fiscal_rfc               varchar(20)                         null,
    fiscal_razon_social      varchar(255)                        null,
    fiscal_person_type       varchar(20)                         null,
    fiscal_address           varchar(255)                        null,
    fiscal_city              varchar(120)                        null,
    fiscal_state             varchar(120)                        null,
    fiscal_postal_code       varchar(20)                         null,
    warehouse_id             varchar(36)                         null,
    credit_days              int                                 null,
    credit_amount            decimal(14, 2)                      null,
    legacy_customer_id       int                                 null,
    constraint FK_9d666fe1125d410ff9d110e2d2e
        foreign key (status_id) references customer_status (id),
    constraint fk_customers_warehouse_id
        foreign key (warehouse_id) references warehouses (id)
            on delete set null
);

create table if not exists contracts
(
    id                              varchar(36) collate utf8mb4_unicode_ci                                             not null
        primary key,
    tenant_id                       varchar(36)                                                                        not null,
    customer_id                     int                                                                                not null,
    property_id                     varchar(36)                                                                        not null,
    contract_number                 varchar(50) collate utf8mb4_unicode_ci                                             null,
    contract_date                   date                                                                               not null,
    total_price                     decimal(15, 2)                                                                     not null,
    list_price                      decimal(15, 2)                                                                     null,
    down_payment                    decimal(15, 2)                                                                     not null,
    down_payment_target             decimal(15, 2)                                                                     null,
    down_payment_financed           tinyint                                                  default 0                 not null,
    down_payment_months             int                                                                                null,
    down_payment_monthly_amount     decimal(15, 2)                                                                     null,
    down_payment_first_payment_date date                                                                               null,
    down_payment_payment_day        int                                                                                null,
    remaining_balance               decimal(15, 2)                                                                     not null,
    payment_months                  int                                                                                not null,
    monthly_payment                 decimal(15, 2)                                                                     not null,
    first_payment_date              date                                                                               not null,
    currency                        varchar(10) collate utf8mb4_unicode_ci                                             null,
    status                          enum ('activo', 'completado', 'cancelado', 'suspendido') default 'activo'          not null,
    notes                           text                                                                               null,
    metadata                        json                                                                               null,
    created_at                      timestamp                                                default CURRENT_TIMESTAMP not null,
    updated_at                      timestamp                                                default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    payment_due_day                 int                                                                                null,
    interest_rate                   decimal(5, 2)                                                                      null,
    seller_id                       varchar(36)                                                                        null,
    lead_id                         int                                                                                null,
    lead_group_id                   varchar(36)                                                                        null,
    constraint FK_2e66f7950711366031e3200413d
        foreign key (customer_id) references customers (id),
    constraint FK_5d074ef9e0a3c47bace58d850b0
        foreign key (property_id) references properties (id),
    constraint FK_7007ebacc0a8a606adbc373de45
        foreign key (seller_id) references users (id)
            on delete set null,
    constraint FK_99f99bdfee2d227b320d4d7c70e
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create table if not exists contract_downpayment_payments
(
    id                         varchar(36) collate utf8mb4_unicode_ci                                            not null
        primary key,
    tenant_id                  varchar(36)                                                                       not null,
    contract_id                varchar(36) collate utf8mb4_unicode_ci                                            not null,
    payment_number             varchar(50)                                                                       not null,
    amount                     decimal(15, 2)                                                                    not null,
    amount_paid                decimal(15, 2)                                       default 0.00                 not null,
    amount_pending             decimal(15, 2)                                                                    not null,
    due_date                   date                                                                              not null,
    paid_date                  date                                                                              null,
    first_partial_payment_date date                                                                              null,
    payment_method             varchar(50)                                                                       null,
    status                     enum ('pagado', 'pendiente', 'parcial', 'cancelado') default 'pendiente'          not null,
    is_overdue                 tinyint                                              default 0                    not null,
    notes                      text                                                                              null,
    created_at                 timestamp(6)                                         default CURRENT_TIMESTAMP(6) not null,
    updated_at                 timestamp(6)                                         default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    constraint FK_contract_downpayment_payments_contract
        foreign key (contract_id) references contracts (id),
    constraint FK_contract_downpayment_payments_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index contract_downpayment_payments_contract_index
    on contract_downpayment_payments (contract_id);

create index contract_downpayment_payments_due_date_index
    on contract_downpayment_payments (due_date);

create index contract_downpayment_payments_status_index
    on contract_downpayment_payments (status);

create index contract_downpayment_payments_tenant_index
    on contract_downpayment_payments (tenant_id);

create table if not exists contract_hoa_payments
(
    id                         varchar(36)                                                                       not null
        primary key,
    tenant_id                  varchar(36) charset utf8mb4                                                       not null,
    contract_id                varchar(36)                                                                       not null,
    payment_number             varchar(50)                                                                       not null,
    amount                     decimal(15, 2)                                                                    not null,
    amount_paid                decimal(15, 2)                                       default 0.00                 not null,
    amount_pending             decimal(15, 2)                                                                    not null,
    currency                   varchar(10)                                          default 'MXN'                not null,
    due_date                   date                                                                              not null,
    paid_date                  date                                                                              null,
    first_partial_payment_date date                                                                              null,
    payment_method             varchar(50)                                                                       null,
    status                     enum ('pagado', 'pendiente', 'parcial', 'cancelado') default 'pendiente'          not null,
    is_overdue                 tinyint                                              default 0                    not null,
    notes                      text                                                                              null,
    created_at                 timestamp(6)                                         default CURRENT_TIMESTAMP(6) not null,
    updated_at                 timestamp(6)                                         default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    constraint FK_contract_hoa_payments_contract
        foreign key (contract_id) references contracts (id),
    constraint FK_contract_hoa_payments_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

create index contract_hoa_payments_contract_index
    on contract_hoa_payments (contract_id);

create index contract_hoa_payments_due_date_index
    on contract_hoa_payments (due_date);

create index contract_hoa_payments_status_index
    on contract_hoa_payments (status);

create index contract_hoa_payments_tenant_index
    on contract_hoa_payments (tenant_id);

create index IDX_contracts_customer_id
    on contracts (customer_id);

create index IDX_contracts_property_id
    on contracts (property_id);

create index IDX_contracts_seller_id
    on contracts (seller_id);

create index IDX_contracts_status
    on contracts (status);

create index IDX_contracts_tenant_id
    on contracts (tenant_id);

create table if not exists customer_activities
(
    id               varchar(36)                                                                                                     not null
        primary key,
    customer_id      int                                                                                                             not null,
    user_id          varchar(36)                                                                                                     null,
    tenant_id        varchar(36)                                                                                                     not null,
    type             enum ('call', 'email', 'meeting', 'note', 'task', 'follow_up', 'purchase', 'support') default 'note'            not null,
    status           enum ('completed', 'scheduled', 'cancelled', 'in_progress')                           default 'completed'       not null,
    title            varchar(200)                                                                                                    not null,
    description      text                                                                                                            null,
    activity_date    timestamp                                                                                                       not null,
    duration_minutes int                                                                                                             null,
    outcome          varchar(100)                                                                                                    null,
    follow_up_date   timestamp                                                                                                       null,
    notes            text                                                                                                            null,
    metadata         json                                                                                                            null,
    created_at       timestamp                                                                             default CURRENT_TIMESTAMP not null,
    updated_at       timestamp                                                                             default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint FK_77282126d9f9d8c12c17513a268
        foreign key (customer_id) references customers (id)
            on delete cascade,
    constraint FK_7fcbe5f9fa5205f9d01cfc9e0d2
        foreign key (user_id) references users (id)
            on delete set null,
    constraint FK_ae1755fc6b0b5a98eedacf1b4af
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index IDX_customer_activities_date
    on customer_activities (activity_date, tenant_id);

create index IDX_customer_activities_tenant_customer
    on customer_activities (tenant_id, customer_id);

create index IDX_customer_activities_type
    on customer_activities (type, tenant_id);

create index IDX_customer_activities_user
    on customer_activities (user_id, tenant_id);

create table if not exists customer_documents
(
    id               varchar(36)                                                        not null
        primary key,
    tenant_id        varchar(36)                                                        not null,
    customer_id      int                                                                not null,
    document_type_id varchar(36)                                                        not null,
    file_name        varchar(255)                                                       not null,
    s3_key           varchar(500)                                                       not null,
    mime_type        varchar(100)                                                       not null,
    file_size        bigint                                                             not null,
    expiration_date  date                                                               null,
    notes            text                                                               null,
    status           enum ('pending', 'approved', 'rejected') default 'pending'         null,
    metadata         json                                                               null,
    uploaded_by      varchar(36)                                                        null,
    created_at       timestamp                                default CURRENT_TIMESTAMP null,
    updated_at       timestamp                                default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint customer_documents_ibfk_1
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint customer_documents_ibfk_2
        foreign key (customer_id) references customers (id)
            on delete cascade,
    constraint customer_documents_ibfk_3
        foreign key (document_type_id) references document_types (id)
);

create index customer_index
    on customer_documents (customer_id);

create index document_type_id
    on customer_documents (document_type_id);

create index tenant_index
    on customer_documents (tenant_id);

create index FK_3c205d25767606602d2a84bf8eb
    on customers (group_id);

create index IDX_customers_tenant_legacy_customer_id
    on customers (tenant_id, legacy_customer_id);

create index idx_customers_warehouse_id
    on customers (warehouse_id);

create table if not exists inv_s_purchase_order_batch
(
    id                      varchar(36)                                                        not null
        primary key,
    tenant_id               varchar(36)                                                        not null,
    fiscal_configuration_id varchar(36)                                                        not null,
    warehouse_id            varchar(36)                                                        not null,
    vendor_id               varchar(36)                                                        not null,
    expected_delivery_date  date                                                               not null,
    payment_status          enum ('Pendiente', 'Pagado')             default 'Pendiente'       not null,
    general_status          enum ('Creada', 'Recibida', 'Cancelada') default 'Creada'          not null,
    notes                   text                                                               null,
    created_by              varchar(36)                                                        not null,
    created_at              timestamp                                default CURRENT_TIMESTAMP not null,
    updated_by              varchar(36)                                                        null,
    updated_at              timestamp                                default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    folio                   varchar(20)                              default 'ODC-000001'      not null,
    requested_subtotal      decimal(12, 2)                           default 0.00              not null,
    requested_iva_total     decimal(12, 2)                           default 0.00              not null,
    requested_ieps_total    decimal(12, 2)                           default 0.00              not null,
    requested_total         decimal(12, 2)                           default 0.00              not null,
    received_subtotal       decimal(12, 2)                           default 0.00              not null,
    received_iva_total      decimal(12, 2)                           default 0.00              not null,
    received_ieps_total     decimal(12, 2)                           default 0.00              not null,
    received_total          decimal(12, 2)                           default 0.00              not null,
    payment_currency        enum ('MXN', 'USD')                      default 'MXN'             not null,
    constraint IDX_403461c1358be728b882d8bb32
        unique (folio),
    constraint idx_folio
        unique (folio),
    constraint fk_po_batch_fiscal_config
        foreign key (fiscal_configuration_id) references fiscal_configurations (id),
    constraint fk_po_batch_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint fk_po_batch_vendor
        foreign key (vendor_id) references vendors (id),
    constraint fk_po_batch_warehouse
        foreign key (warehouse_id) references warehouses (id)
);

create index idx_expected_delivery
    on inv_s_purchase_order_batch (expected_delivery_date);

create index idx_general_status
    on inv_s_purchase_order_batch (general_status);

create index idx_payment_status
    on inv_s_purchase_order_batch (payment_status);

create index idx_tenant
    on inv_s_purchase_order_batch (tenant_id);

create index idx_vendor
    on inv_s_purchase_order_batch (vendor_id);

create index idx_warehouse
    on inv_s_purchase_order_batch (warehouse_id);

create table if not exists inv_s_purchase_order_batch_detail
(
    id                                varchar(36)                              not null
        primary key,
    purchase_order_batch_id           varchar(36)                              not null,
    product_id                        varchar(36)                              not null,
    quantity                          decimal(12, 3)                           not null,
    unit_total                        decimal(12, 2)                           not null,
    iva_percentage                    decimal(5, 2)  default 0.00              not null,
    iva_unit                          decimal(12, 2) default 0.00              not null,
    ieps_percentage                   decimal(5, 2)  default 0.00              not null,
    ieps_unit                         decimal(12, 2) default 0.00              not null,
    received_original_product_id      varchar(36)                              null,
    received_original_uom_id          varchar(36)                              null,
    received_original_quantity        decimal(12, 3)                           null,
    received_original_unit_total      decimal(12, 2)                           null,
    received_original_iva_percentage  decimal(5, 2)                            null,
    received_original_iva_unit        decimal(12, 2)                           null,
    received_original_ieps_percentage decimal(5, 2)                            null,
    received_original_ieps_unit       decimal(12, 2)                           null,
    received_converted_uom_id         varchar(36)                              null,
    received_converted_quantity       decimal(12, 3)                           null,
    created_by                        varchar(36)                              not null,
    created_at                        timestamp      default CURRENT_TIMESTAMP not null,
    updated_by                        varchar(36)                              null,
    updated_at                        timestamp      default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    uom_id_new                        varchar(36)                              null,
    product_uom_id                    varchar(36)                              null,
    constraint fk_po_detail_batch
        foreign key (purchase_order_batch_id) references inv_s_purchase_order_batch (id)
            on delete cascade,
    constraint fk_po_detail_converted_uom
        foreign key (received_converted_uom_id) references uom_catalog (id),
    constraint fk_po_detail_product
        foreign key (product_id) references products (id),
    constraint fk_po_detail_product_uom
        foreign key (product_uom_id) references product_uoms (id),
    constraint fk_po_detail_received_product
        foreign key (received_original_product_id) references products (id),
    constraint fk_po_detail_received_uom
        foreign key (received_original_uom_id) references uom_catalog (id)
);

create table if not exists inv_s_batches
(
    id                       varchar(36)                              not null
        primary key,
    tenant_id                varchar(36)                              not null,
    batch_number             varchar(50)                              not null,
    warehouse_id             varchar(36)                              not null,
    product_id               varchar(36)                              not null,
    uom_id                   varchar(36)                              not null,
    initial_quantity         decimal(12, 3) default 0.000             not null,
    available_quantity       decimal(12, 3) default 0.000             not null,
    purchase_order_batch_id  varchar(36)                              null,
    purchase_order_detail_id varchar(36)                              null,
    created_by               varchar(36)                              not null,
    created_at               timestamp      default CURRENT_TIMESTAMP not null,
    source_tag_identifier    varchar(100)                             null,
    photo                    varchar(500)                             null,
    constraint uq_batch_number
        unique (tenant_id, batch_number),
    constraint fk_batch_po
        foreign key (purchase_order_batch_id) references inv_s_purchase_order_batch (id)
            on delete set null,
    constraint fk_batch_po_detail
        foreign key (purchase_order_detail_id) references inv_s_purchase_order_batch_detail (id)
            on delete set null,
    constraint fk_batch_product
        foreign key (product_id) references products (id),
    constraint fk_batch_tenant
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint fk_batch_uom
        foreign key (uom_id) references uom_catalog (id),
    constraint fk_batch_warehouse
        foreign key (warehouse_id) references warehouses (id)
);

create index idx_batch_number
    on inv_s_batches (batch_number);

create index idx_product
    on inv_s_batches (product_id);

create index idx_purchase_order
    on inv_s_batches (purchase_order_batch_id);

create index idx_source_tag_identifier
    on inv_s_batches (source_tag_identifier);

create index idx_tenant
    on inv_s_batches (tenant_id);

create index idx_warehouse
    on inv_s_batches (warehouse_id);

create index idx_product
    on inv_s_purchase_order_batch_detail (product_id);

create index idx_purchase_order
    on inv_s_purchase_order_batch_detail (purchase_order_batch_id);

create index idx_received_product
    on inv_s_purchase_order_batch_detail (received_original_product_id);

create table if not exists inv_s_purchase_order_documents
(
    id                      varchar(36)                         not null
        primary key,
    purchase_order_batch_id varchar(36)                         not null,
    document_type_id        int                                 not null,
    file_name               varchar(255)                        not null,
    file_path               varchar(500)                        not null,
    file_size               bigint                              null,
    mime_type               varchar(100)                        null,
    uploaded_by             varchar(36)                         not null,
    created_at              timestamp default CURRENT_TIMESTAMP not null,
    constraint FK_67047def4a419d5dd483b806597
        foreign key (document_type_id) references inv_s_purchase_order_document_types (id),
    constraint FK_e72ffd79574c5c4bd457c11dd12
        foreign key (purchase_order_batch_id) references inv_s_purchase_order_batch (id)
            on delete cascade
);

create index idx_doc_type_id
    on inv_s_purchase_order_documents (document_type_id);

create index idx_po_batch_id
    on inv_s_purchase_order_documents (purchase_order_batch_id);

create table if not exists inv_s_purchase_order_payments
(
    id                      varchar(36)         default (uuid())          not null
        primary key,
    tenant_id               varchar(36)                                   not null,
    purchase_order_batch_id varchar(36)                                   not null,
    payment_date            date                                          not null,
    amount                  decimal(12, 2)                                not null,
    currency                enum ('MXN', 'USD') default 'MXN'             not null,
    payment_method          varchar(100)                                  not null,
    reference_number        varchar(100)                                  null,
    notes                   text                                          null,
    created_by              varchar(36)                                   not null,
    created_at              timestamp           default CURRENT_TIMESTAMP not null,
    constraint FK_a3ec47e4e40c9b917ab139a71d4
        foreign key (purchase_order_batch_id) references inv_s_purchase_order_batch (id)
            on delete cascade
);

create index idx_po_payments_date
    on inv_s_purchase_order_payments (payment_date);

create index idx_po_payments_po_id
    on inv_s_purchase_order_payments (purchase_order_batch_id);

create index idx_po_payments_tenant
    on inv_s_purchase_order_payments (tenant_id);

create table if not exists inv_s_sales_orders
(
    id                      varchar(36)                                                       not null
        primary key,
    tenant_id               varchar(36)                                                       not null,
    folio                   varchar(20)                                                       not null,
    fiscal_configuration_id varchar(36)                                                       not null,
    warehouse_id            varchar(36)                                                       not null,
    customer_id             int                                                               not null,
    expected_delivery_date  date                                                              not null,
    payment_status          enum ('Pendiente', 'Pagado')            default 'Pendiente'       not null,
    general_status          enum ('Creada', 'Surtida', 'Cancelada') default 'Creada'          not null,
    notes                   text                                                              null,
    subtotal                decimal(12, 2)                          default 0.00              not null,
    iva_total               decimal(12, 2)                          default 0.00              not null,
    ieps_total              decimal(12, 2)                          default 0.00              not null,
    total                   decimal(12, 2)                          default 0.00              not null,
    created_by              varchar(36)                                                       not null,
    created_at              timestamp                               default CURRENT_TIMESTAMP not null,
    updated_by              varchar(36)                                                       null,
    updated_at              timestamp                               default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    sales_order_type        enum ('POS', 'MANUAL')                  default 'MANUAL'          not null,
    fiscal_razon_social     varchar(255)                                                      null,
    discount_total          decimal(12, 2)                          default 0.00              not null,
    constraint folio
        unique (folio),
    constraint inv_s_sales_orders_ibfk_1
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint inv_s_sales_orders_ibfk_2
        foreign key (fiscal_configuration_id) references fiscal_configurations (id),
    constraint inv_s_sales_orders_ibfk_3
        foreign key (warehouse_id) references warehouses (id),
    constraint inv_s_sales_orders_ibfk_4
        foreign key (customer_id) references customers (id)
);

create table if not exists inv_s_sales_order_details
(
    id                  varchar(36)                              not null
        primary key,
    sales_order_id      varchar(36)                              not null,
    product_id          varchar(36)                              not null,
    product_uom_id      varchar(36)                              not null,
    quantity            decimal(12, 3)                           not null,
    quantity_base_uom   decimal(12, 3) default 0.000             not null,
    base_uom_id         varchar(36)                              null,
    unit_price          decimal(12, 2)                           not null,
    iva_percentage      decimal(5, 2)  default 0.00              not null,
    iva_unit            decimal(12, 2) default 0.00              not null,
    ieps_percentage     decimal(5, 2)  default 0.00              not null,
    ieps_unit           decimal(12, 2) default 0.00              not null,
    created_by          varchar(36)                              not null,
    created_at          timestamp      default CURRENT_TIMESTAMP not null,
    updated_by          varchar(36)                              null,
    updated_at          timestamp      default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    discount_percentage decimal(5, 2)  default 0.00              not null,
    discount_unit       decimal(12, 2) default 0.00              not null,
    constraint inv_s_sales_order_details_ibfk_1
        foreign key (sales_order_id) references inv_s_sales_orders (id)
            on delete cascade,
    constraint inv_s_sales_order_details_ibfk_2
        foreign key (product_id) references products (id),
    constraint inv_s_sales_order_details_ibfk_3
        foreign key (product_uom_id) references product_uoms (id),
    constraint inv_s_sales_order_details_ibfk_4
        foreign key (base_uom_id) references uom_catalog (id)
);

create table if not exists inv_s_sales_order_batch_allocations
(
    id                    varchar(36)                         not null
        primary key,
    sales_order_detail_id varchar(36)                         not null,
    inventory_batch_id    varchar(36)                         not null,
    quantity_allocated    decimal(12, 3)                      not null,
    created_by            varchar(36)                         not null,
    created_at            timestamp default CURRENT_TIMESTAMP not null,
    constraint inv_s_sales_order_batch_allocations_ibfk_1
        foreign key (sales_order_detail_id) references inv_s_sales_order_details (id)
            on delete cascade,
    constraint inv_s_sales_order_batch_allocations_ibfk_2
        foreign key (inventory_batch_id) references inv_s_batches (id)
);

create index idx_alloc_batch
    on inv_s_sales_order_batch_allocations (inventory_batch_id);

create index idx_alloc_detail
    on inv_s_sales_order_batch_allocations (sales_order_detail_id);

create index base_uom_id
    on inv_s_sales_order_details (base_uom_id);

create index idx_so_detail_order
    on inv_s_sales_order_details (sales_order_id);

create index idx_so_detail_product
    on inv_s_sales_order_details (product_id);

create index product_uom_id
    on inv_s_sales_order_details (product_uom_id);

create index fiscal_configuration_id
    on inv_s_sales_orders (fiscal_configuration_id);

create index idx_so_customer
    on inv_s_sales_orders (customer_id);

create index idx_so_general_status
    on inv_s_sales_orders (general_status);

create index idx_so_payment_status
    on inv_s_sales_orders (payment_status);

create index idx_so_tenant
    on inv_s_sales_orders (tenant_id);

create index idx_so_warehouse
    on inv_s_sales_orders (warehouse_id);

create index billing_branch_index
    on warehouses (billing_branch_id);

create index code_index
    on warehouses (code);

create index fiscal_configuration_index
    on warehouses (fiscal_configuration_id);

create index idx_prefix
    on warehouses (prefix);

create index status_index
    on warehouses (status);

create index tenant_index
    on warehouses (tenant_id);

create
    definer = victor@`%` procedure proc_add_inv_requisition_payment(IN p_requisition_id int,
                                                                    IN p_payment_amount decimal(12, 2),
                                                                    IN p_payment_date date,
                                                                    IN p_payment_method varchar(100),
                                                                    IN p_payment_reference varchar(255),
                                                                    IN p_notes text, IN p_created_by int)
BEGIN
  DECLARE v_total DECIMAL(12,2);
  DECLARE v_total_paid DECIMAL(12,2);
  DECLARE v_new_total_paid DECIMAL(12,2);

  -- Get current totals
  SELECT total, total_paid INTO v_total, v_total_paid
  FROM inv_requisition
  WHERE id = p_requisition_id;

  -- Insert payment
  INSERT INTO inv_requisition_payments (
    requisition_id, payment_amount, payment_date, payment_method,
    payment_reference, notes, created_by
  ) VALUES (
    p_requisition_id, p_payment_amount, p_payment_date, p_payment_method,
    p_payment_reference, p_notes, p_created_by
  );

  -- Update total paid and payment status
  SET v_new_total_paid = v_total_paid + p_payment_amount;

  UPDATE inv_requisition
  SET
    total_paid = v_new_total_paid,
    payment_status = CASE
      WHEN v_new_total_paid >= v_total THEN 'PAGADO'
      WHEN v_new_total_paid > 0 THEN 'PARCIAL'
      ELSE 'PENDIENTE'
    END
  WHERE id = p_requisition_id;

  SELECT LAST_INSERT_ID() as payment_id;
END;

create
    definer = victor@`%` procedure proc_add_requisition_product(IN p_requisition_id int, IN p_product_id int,
                                                                IN p_ordered_quantity decimal(10, 2),
                                                                IN p_unit_cost decimal(10, 2),
                                                                IN p_tax_rate decimal(5, 2))
BEGIN
  DECLARE v_line_subtotal DECIMAL(12,2);
  DECLARE v_line_tax DECIMAL(12,2);
  DECLARE v_line_total DECIMAL(12,2);
  DECLARE v_status VARCHAR(50);

  -- Check if requisition can be edited
  SELECT status INTO v_status FROM inv_requisition WHERE id = p_requisition_id;

  IF v_status != 'PENDIENTE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot edit requisition that is not PENDIENTE';
  END IF;

  -- Calculate line totals
  SET v_line_subtotal = p_ordered_quantity * p_unit_cost;
  SET v_line_tax = v_line_subtotal * (p_tax_rate / 100);
  SET v_line_total = v_line_subtotal + v_line_tax;

  -- Insert product
  INSERT INTO inv_requisition_detail (
    requisition_id, product_id, ordered_quantity, unit_cost, tax_rate,
    line_subtotal, line_tax, line_total
  ) VALUES (
    p_requisition_id, p_product_id, p_ordered_quantity, p_unit_cost, p_tax_rate,
    v_line_subtotal, v_line_tax, v_line_total
  );

  -- Update requisition totals
  UPDATE inv_requisition r
  SET
    subtotal = (SELECT SUM(line_subtotal) FROM inv_requisition_detail WHERE requisition_id = p_requisition_id),
    tax = (SELECT SUM(line_tax) FROM inv_requisition_detail WHERE requisition_id = p_requisition_id),
    total = (SELECT SUM(line_total) FROM inv_requisition_detail WHERE requisition_id = p_requisition_id),
    total_ordered = (SELECT SUM(ordered_quantity) FROM inv_requisition_detail WHERE requisition_id = p_requisition_id)
  WHERE id = p_requisition_id;

  SELECT LAST_INSERT_ID() as detail_id;
END;

create
    definer = victor@`%` procedure proc_assert_sales_order_warehouse_picked(IN p_sales_order_id int, OUT p_error_message varchar(500))
BEGIN
  DECLARE v_pending INT DEFAULT 0;
  DECLARE v_is_legacy TINYINT DEFAULT 0;

  SET p_error_message = NULL;

  SELECT
    CASE
      WHEN so.source = 'LEGACY_IMPORT'
        OR (so.order_number LIKE 'LEG-OV-%')
        OR (so.legacy_transaction_id IS NOT NULL AND so.legacy_transaction_id > 0)
      THEN 1
      ELSE 0
    END
  INTO v_is_legacy
  FROM sales_orders so
  WHERE so.id = p_sales_order_id
  LIMIT 1;

  IF COALESCE(v_is_legacy, 0) = 0 THEN
    SELECT COUNT(*) INTO v_pending
    FROM sales_orders_batches
    WHERE sales_order_id = p_sales_order_id
      AND COALESCE(pick_confirmed, 0) = 0;

    IF v_pending > 0 THEN
      SET p_error_message = 'Corrobore todos los lotes en almacén antes de entregar la OV';
    END IF;
  END IF;
END;

create
    definer = victor@`%` procedure proc_cancel_inv_requisition(IN p_requisition_id int)
BEGIN
  UPDATE inv_requisition
  SET status = 'CANCELADA'
  WHERE id = p_requisition_id;
END;

create
    definer = victor@`%` procedure proc_create_inv_requisition(IN p_requisition_number varchar(50),
                                                               IN p_requisition_type varchar(50),
                                                               IN p_external_order_id varchar(100), IN p_vendor_id int,
                                                               IN p_cedis_padre_id int, IN p_created_by int,
                                                               IN p_order_date date, IN p_expected_date date,
                                                               IN p_subtotal decimal(12, 2), IN p_tax decimal(12, 2),
                                                               IN p_total decimal(12, 2), IN p_notes text,
                                                               IN p_products json)
BEGIN
  DECLARE v_requisition_id INT;
  DECLARE v_product_id INT;
  DECLARE v_ordered_quantity DECIMAL(10,2);
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE v_tax_rate DECIMAL(5,2);
  DECLARE v_line_subtotal DECIMAL(12,2);
  DECLARE v_line_tax DECIMAL(12,2);
  DECLARE v_line_total DECIMAL(12,2);
  DECLARE v_total_ordered DECIMAL(12,2) DEFAULT 0;
  DECLARE i INT DEFAULT 0;
  DECLARE v_count INT;

  -- Insert requisition header
  INSERT INTO inv_requisition (
    requisition_number, requisition_type, external_order_id, vendor_id, cedis_padre_id,
    created_by, order_date, expected_date, subtotal, tax, total, notes
  ) VALUES (
    p_requisition_number, p_requisition_type, p_external_order_id, p_vendor_id, p_cedis_padre_id,
    p_created_by, p_order_date, p_expected_date, p_subtotal, p_tax, p_total, p_notes
  );

  SET v_requisition_id = LAST_INSERT_ID();
  SET v_count = JSON_LENGTH(p_products);

  -- Insert products
  WHILE i < v_count DO
    SET v_product_id = JSON_UNQUOTE(JSON_EXTRACT(p_products, CONCAT('$[', i, '].product_id')));
    SET v_ordered_quantity = JSON_UNQUOTE(JSON_EXTRACT(p_products, CONCAT('$[', i, '].ordered_quantity')));
    SET v_unit_cost = JSON_UNQUOTE(JSON_EXTRACT(p_products, CONCAT('$[', i, '].unit_cost')));
    SET v_tax_rate = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_products, CONCAT('$[', i, '].tax_rate'))), 0);

    SET v_line_subtotal = v_ordered_quantity * v_unit_cost;
    SET v_line_tax = v_line_subtotal * (v_tax_rate / 100);
    SET v_line_total = v_line_subtotal + v_line_tax;
    SET v_total_ordered = v_total_ordered + v_ordered_quantity;

    INSERT INTO inv_requisition_detail (
      requisition_id, product_id, ordered_quantity, unit_cost, tax_rate,
      line_subtotal, line_tax, line_total
    ) VALUES (
      v_requisition_id, v_product_id, v_ordered_quantity, v_unit_cost, v_tax_rate,
      v_line_subtotal, v_line_tax, v_line_total
    );

    SET i = i + 1;
  END WHILE;

  -- Update total_ordered
  UPDATE inv_requisition SET total_ordered = v_total_ordered WHERE id = v_requisition_id;

  SELECT v_requisition_id as requisition_id, p_requisition_number as requisition_number;
END;

create
    definer = victor@`%` procedure proc_delete_requisition_product(IN p_detail_id int)
BEGIN
  DECLARE v_requisition_id INT;
  DECLARE v_status VARCHAR(50);
  DECLARE v_received_quantity DECIMAL(10,2);

  -- Get requisition info
  SELECT requisition_id, received_quantity INTO v_requisition_id, v_received_quantity
  FROM inv_requisition_detail WHERE id = p_detail_id;

  SELECT status INTO v_status FROM inv_requisition WHERE id = v_requisition_id;

  -- Check if can be deleted
  IF v_status != 'PENDIENTE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete product from requisition that is not PENDIENTE';
  END IF;

  IF v_received_quantity > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete product that has been partially received';
  END IF;

  -- Delete product
  DELETE FROM inv_requisition_detail WHERE id = p_detail_id;

  -- Update requisition totals
  UPDATE inv_requisition r
  SET
    subtotal = IFNULL((SELECT SUM(line_subtotal) FROM inv_requisition_detail WHERE requisition_id = v_requisition_id), 0),
    tax = IFNULL((SELECT SUM(line_tax) FROM inv_requisition_detail WHERE requisition_id = v_requisition_id), 0),
    total = IFNULL((SELECT SUM(line_total) FROM inv_requisition_detail WHERE requisition_id = v_requisition_id), 0),
    total_ordered = IFNULL((SELECT SUM(ordered_quantity) FROM inv_requisition_detail WHERE requisition_id = v_requisition_id), 0)
  WHERE id = v_requisition_id;
END;

create
    definer = victor@`%` procedure proc_deliver_sales_order(IN p_order_id int, IN p_lines_json json,
                                                            IN p_is_full_delivery tinyint,
                                                            IN p_delivered_by int unsigned,
                                                            OUT p_error_message varchar(500),
                                                            OUT p_new_status varchar(50))
proc_deliver: BEGIN
  DECLARE v_status VARCHAR(50);
  DECLARE v_order_number VARCHAR(20);
  DECLARE v_is_legacy TINYINT DEFAULT 0;
  DECLARE v_detail_count INT DEFAULT 0;
  DECLARE v_detail_id INT;
  DECLARE v_qty_requested DECIMAL(10,2);
  DECLARE v_qty_delivered DECIMAL(10,2);
  DECLARE v_conv DECIMAL(10,4);
  DECLARE v_storage_delivered DECIMAL(10,2);
  DECLARE v_remaining_consume DECIMAL(10,2);
  DECLARE v_hold_id INT;
  DECLARE v_batch_id INT UNSIGNED;
  DECLARE v_hold_qty DECIMAL(10,2);
  DECLARE v_take DECIMAL(10,2);
  DECLARE v_lines_in_json INT DEFAULT 0;
  DECLARE v_i INT DEFAULT 0;
  DECLARE v_json_detail_id INT;
  DECLARE v_json_qty DECIMAL(10,2);
  DECLARE v_active_holds INT DEFAULT 0;
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_blocked_batch VARCHAR(20);
  DECLARE v_line_in_delivery TINYINT DEFAULT 0;

  DECLARE detail_cursor CURSOR FOR
    SELECT id, quantity_requested, quantity_delivered, IFNULL(NULLIF(conversion_factor, 0), 1)
    FROM sales_orders_detail WHERE sales_order_id = p_order_id;

  DECLARE hold_consume_cursor CURSOR FOR
    SELECT h.id, h.batch_id, h.quantity_held
    FROM inv_batch_holds h
    INNER JOIN inv_batches b ON b.id = h.batch_id
    WHERE h.sales_order_detail_id = v_detail_id AND h.sales_order_id = p_order_id
      AND h.status = 'ACTIVE' AND h.quantity_held > 0
    ORDER BY b.created_at ASC, b.expiration_date ASC, b.id ASC;

  DECLARE hold_release_cursor CURSOR FOR
    SELECT h.id, h.batch_id, h.quantity_held
    FROM inv_batch_holds h
    INNER JOIN inv_batches b ON b.id = h.batch_id
    WHERE h.sales_order_detail_id = v_detail_id AND h.sales_order_id = p_order_id
      AND h.status = 'ACTIVE' AND h.quantity_held > 0
    ORDER BY b.created_at DESC, b.id DESC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @msg = MESSAGE_TEXT;
    SET p_error_message = LEFT(CONCAT('Error en entrega OV: ', IFNULL(@msg, 'SQL')), 500);
    ROLLBACK;
  END;

  SET p_error_message = NULL;
  SET p_new_status = NULL;

  SELECT status, order_number,
    IF(
      source = 'LEGACY_IMPORT'
      OR (order_number COLLATE utf8mb4_unicode_ci) LIKE 'LEG-OV-%'
      OR legacy_transaction_id IS NOT NULL,
      1, 0
    )
  INTO v_status, v_order_number, v_is_legacy
  FROM sales_orders WHERE id = p_order_id;

  IF v_order_number IS NULL THEN
    SET p_error_message = 'Orden de venta no encontrada';
    LEAVE proc_deliver;
  END IF;

  IF v_is_legacy = 1 AND NOT EXISTS (
    SELECT 1 FROM sales_orders_batches WHERE sales_order_id = p_order_id
  ) THEN
    SET p_error_message = 'Orden LEG-OV sin lotes: use entrega histórica (sin consumo de inventario). No ejecutar proc_deliver en legacy sin asignación.';
    LEAVE proc_deliver;
  END IF;

  IF v_status IN ('Cancelada', 'Entregada') THEN
    SET p_error_message = CONCAT('No se puede entregar una orden en estado ', v_status);
    LEAVE proc_deliver;
  END IF;

  IF v_status NOT IN ('En Camino', 'Lista para envio') THEN
    SET p_error_message = CONCAT('La entrega solo aplica en En Camino o Lista para envio. Estado: ', v_status);
    LEAVE proc_deliver;
  END IF;

  SET v_blocked_batch = NULL;
  SELECT b.batch_number INTO v_blocked_batch
  FROM inv_batch_holds h
  INNER JOIN inv_batches b ON b.id = h.batch_id
  WHERE h.sales_order_id = p_order_id AND h.status = 'ACTIVE'
    AND EXISTS (
      SELECT 1 FROM inv_batches b
      WHERE b.id = h.batch_id
        AND (
          COALESCE(b.is_locked, 0) = 1
          OR EXISTS (
            SELECT 1 FROM inv_batch_audits a
            WHERE a.batch_id = b.id
              AND a.status IN ('IN_PROGRESS', 'PENDING_APPROVAL')
          )
        )
    )
  LIMIT 1;
  SET v_done = 0;

  IF v_blocked_batch IS NOT NULL THEN
    SET p_error_message = CONCAT('Lote ', v_blocked_batch, ' bloqueado por auditoría; no se puede entregar');
    LEAVE proc_deliver;
  END IF;

  SELECT COUNT(*) INTO v_detail_count FROM sales_orders_detail WHERE sales_order_id = p_order_id;
  IF v_detail_count = 0 THEN
    SET p_error_message = 'La orden no tiene líneas de producto';
    LEAVE proc_deliver;
  END IF;

  START TRANSACTION;

  IF COALESCE(p_is_full_delivery, 0) = 1 THEN
    UPDATE sales_orders_detail SET quantity_delivered = quantity_requested, updated_at = CURRENT_TIMESTAMP
    WHERE sales_order_id = p_order_id;
  ELSE
    IF p_lines_json IS NULL OR JSON_TYPE(p_lines_json) <> 'ARRAY' THEN
      SET p_error_message = 'Entrega parcial requiere lines[] en JSON';
      ROLLBACK;
      LEAVE proc_deliver;
    END IF;
    SET v_lines_in_json = JSON_LENGTH(p_lines_json);
    SET v_i = 0;
    WHILE v_i < v_lines_in_json DO
      SET v_json_detail_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_lines_json, CONCAT('$[', v_i, '].sales_order_detail_id'))) AS UNSIGNED);
      SET v_json_qty = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_lines_json, CONCAT('$[', v_i, '].quantity_delivered'))) AS DECIMAL(10,2));
      IF v_json_detail_id IS NULL OR v_json_qty IS NULL THEN
        SET p_error_message = 'Cada línea requiere sales_order_detail_id y quantity_delivered';
        ROLLBACK;
        LEAVE proc_deliver;
      END IF;
      SELECT quantity_requested INTO v_qty_requested FROM sales_orders_detail
      WHERE id = v_json_detail_id AND sales_order_id = p_order_id;
      IF v_qty_requested IS NULL OR v_json_qty < 0 OR v_json_qty > v_qty_requested THEN
        SET p_error_message = CONCAT('Cantidad inválida para ', fn_sales_order_detail_product_label(v_json_detail_id));
        ROLLBACK;
        LEAVE proc_deliver;
      END IF;
      UPDATE sales_orders_detail SET quantity_delivered = v_json_qty, updated_at = CURRENT_TIMESTAMP
      WHERE id = v_json_detail_id AND sales_order_id = p_order_id;
      SET v_i = v_i + 1;
    END WHILE;
  END IF;

  SET v_done = 0;
  OPEN detail_cursor;
  detail_loop: LOOP
    FETCH detail_cursor INTO v_detail_id, v_qty_requested, v_qty_delivered, v_conv;
    IF v_done THEN SET v_done = 0; LEAVE detail_loop; END IF;

    SET v_line_in_delivery = IF(COALESCE(p_is_full_delivery, 0) = 1, 1, 0);
    IF COALESCE(p_is_full_delivery, 0) = 0 THEN
      SET v_i = 0;
      json_search: WHILE v_i < v_lines_in_json DO
        SET v_json_detail_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_lines_json, CONCAT('$[', v_i, '].sales_order_detail_id'))) AS UNSIGNED);
        IF v_json_detail_id = v_detail_id THEN
          SET v_line_in_delivery = 1;
          LEAVE json_search;
        END IF;
        SET v_i = v_i + 1;
      END WHILE json_search;
      IF v_line_in_delivery = 0 THEN
        IF v_qty_delivered > 0 AND EXISTS (
          SELECT 1 FROM inv_batch_holds h
          WHERE h.sales_order_detail_id = v_detail_id
            AND h.sales_order_id = p_order_id
            AND h.status = 'ACTIVE'
            AND h.quantity_held > 0
        ) THEN
          SET v_line_in_delivery = 1;
        ELSE
          ITERATE detail_loop;
        END IF;
      END IF;
    END IF;

    SET v_storage_delivered = v_qty_delivered * v_conv;
    SET v_remaining_consume = v_storage_delivered;

    OPEN hold_consume_cursor;
    consume_loop: LOOP
      FETCH hold_consume_cursor INTO v_hold_id, v_batch_id, v_hold_qty;
      IF v_done THEN SET v_done = 0; LEAVE consume_loop; END IF;
      IF v_remaining_consume <= 0 THEN LEAVE consume_loop; END IF;

      IF EXISTS (
        SELECT 1 FROM inv_batches b
        WHERE b.id = v_batch_id
          AND (
            COALESCE(b.is_locked, 0) = 1
            OR EXISTS (
              SELECT 1 FROM inv_batch_audits a
              WHERE a.batch_id = b.id
                AND a.status IN ('IN_PROGRESS', 'PENDING_APPROVAL')
            )
          )
      ) THEN
        SELECT batch_number INTO v_blocked_batch FROM inv_batches WHERE id = v_batch_id;
        SET p_error_message = CONCAT('Lote ', IFNULL(v_blocked_batch, v_batch_id), ' bloqueado por auditoría');
        ROLLBACK;
        LEAVE proc_deliver;
      END IF;

      SET v_take = LEAST(v_remaining_consume, v_hold_qty);
      UPDATE inv_batches SET available_quantity = GREATEST(0, available_quantity - v_take),
        held_quantity = GREATEST(0, COALESCE(held_quantity, 0) - v_take),
        status = IF(GREATEST(0, available_quantity - v_take) <= 0, 'AGOTADO', status),
        updated_at = CURRENT_TIMESTAMP WHERE id = v_batch_id;
      UPDATE inv_batch_holds SET quantity_held = quantity_held - v_take,
        status = IF(quantity_held - v_take <= 0, 'FULFILLED', 'ACTIVE'), updated_at = CURRENT_TIMESTAMP WHERE id = v_hold_id;
      UPDATE sales_orders_batches SET quantity_allocated = GREATEST(0, quantity_allocated - v_take),
        has_hold = IF(quantity_allocated - v_take > 0, TRUE, FALSE)
      WHERE sales_order_id = p_order_id AND sales_order_detail_id = v_detail_id AND batch_id = v_batch_id;
      INSERT INTO inv_batch_movements (batch_id, movement_type, movement_id, quantity, reference, notes, created_by, movement_uom_id)
      SELECT v_batch_id, 'ORDER', p_order_id, -v_take, v_order_number,
        CONCAT('Entrega OV ', v_order_number, ' línea ', v_detail_id), p_delivered_by, b.product_uom_id
      FROM inv_batches b WHERE b.id = v_batch_id;
      SET v_remaining_consume = v_remaining_consume - v_take;
    END LOOP consume_loop;
    CLOSE hold_consume_cursor;

    IF v_remaining_consume > 0.0001 AND v_storage_delivered > 0 THEN
      SET p_error_message = fn_sales_order_reserved_insufficient_message(v_detail_id, v_remaining_consume);
      ROLLBACK;
      LEAVE proc_deliver;
    END IF;

    OPEN hold_release_cursor;
    release_loop: LOOP
      FETCH hold_release_cursor INTO v_hold_id, v_batch_id, v_hold_qty;
      IF v_done THEN SET v_done = 0; LEAVE release_loop; END IF;
      SET v_take = v_hold_qty;
      UPDATE inv_batches SET held_quantity = GREATEST(0, COALESCE(held_quantity, 0) - v_take), updated_at = CURRENT_TIMESTAMP WHERE id = v_batch_id;
      UPDATE inv_batch_holds SET quantity_held = 0, status = 'RELEASED', updated_at = CURRENT_TIMESTAMP WHERE id = v_hold_id;
      UPDATE sales_orders_batches SET quantity_allocated = GREATEST(0, quantity_allocated - v_take), has_hold = FALSE
      WHERE sales_order_id = p_order_id AND sales_order_detail_id = v_detail_id AND batch_id = v_batch_id;
    END LOOP release_loop;
    CLOSE hold_release_cursor;
  END LOOP detail_loop;
  CLOSE detail_cursor;

  SELECT COUNT(*)
  INTO v_active_holds
  FROM inv_batch_holds
  WHERE sales_order_id = p_order_id
    AND status = 'ACTIVE'
    AND quantity_held > 0;

  IF v_active_holds = 0 THEN
    SET p_new_status = 'Entregada';
  ELSE
    SET p_new_status = 'En Camino';
  END IF;

  UPDATE sales_orders SET status = p_new_status,
    total_delivered = (SELECT COALESCE(SUM(quantity_delivered), 0) FROM sales_orders_detail WHERE sales_order_id = p_order_id),
    delivered_at = CURRENT_TIMESTAMP, delivered_by = p_delivered_by, updated_at = CURRENT_TIMESTAMP
  WHERE id = p_order_id;

  SET p_error_message = NULL;
  COMMIT;
END proc_deliver;

create
    definer = victor@`%` procedure proc_get_inv_requisition_detail(IN p_requisition_id int)
BEGIN
  -- Header
  SELECT
    r.*,
    v.name as vendor_name,
    c.nombre as cedis_name,
    u.name as created_by_name
  FROM inv_requisition r
  LEFT JOIN vendor v ON r.vendor_id = v.id
  LEFT JOIN cedis_padre c ON r.cedis_padre_id = c.id
  LEFT JOIN user u ON r.created_by = u.id
  WHERE r.id = p_requisition_id;

  -- Products
  SELECT
    rd.*,
    p.name as product_name,
    p.partnumber as product_partnumber
  FROM inv_requisition_detail rd
  LEFT JOIN product p ON rd.product_id = p.id
  WHERE rd.requisition_id = p_requisition_id;

  -- Batches
  SELECT
    rb.*,
    b.batch_number,
    b.expiration_date,
    b.status as batch_status,
    p.name as product_name,
    u.name as received_by_name
  FROM inv_requisition_batches rb
  LEFT JOIN inv_batches b ON rb.batch_id = b.id
  LEFT JOIN inv_requisition_detail rd ON rb.requisition_detail_id = rd.id
  LEFT JOIN product p ON rd.product_id = p.id
  LEFT JOIN user u ON rb.received_by = u.id
  WHERE rb.requisition_id = p_requisition_id;

  -- Documents
  SELECT
    d.*,
    dt.name as document_type_name,
    u.name as uploaded_by_name
  FROM inv_requisition_documents d
  LEFT JOIN inv_document_types dt ON d.document_type_id = dt.id
  LEFT JOIN user u ON d.uploaded_by = u.id
  WHERE d.requisition_id = p_requisition_id;

  -- Payments
  SELECT
    p.*,
    u.name as created_by_name
  FROM inv_requisition_payments p
  LEFT JOIN user u ON p.created_by = u.id
  WHERE p.requisition_id = p_requisition_id
  ORDER BY p.payment_date DESC;
END;

create
    definer = victor@`%` procedure proc_get_inv_requisition_stats(IN p_cedis_padre_id int, IN p_vendor_id int,
                                                                  IN p_requisition_type varchar(50),
                                                                  IN p_date_from date, IN p_date_to date)
BEGIN
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status = 'PENDIENTE' THEN 1 ELSE 0 END) as pendiente,
    SUM(CASE WHEN status = 'PARCIAL' THEN 1 ELSE 0 END) as parcial,
    SUM(CASE WHEN status = 'RECIBIDA' THEN 1 ELSE 0 END) as recibida,
    SUM(CASE WHEN status = 'CANCELADA' THEN 1 ELSE 0 END) as cancelada,
    SUM(CASE WHEN payment_status = 'PENDIENTE' THEN 1 ELSE 0 END) as pago_pendiente,
    SUM(CASE WHEN payment_status = 'PARCIAL' THEN 1 ELSE 0 END) as pago_parcial,
    SUM(CASE WHEN payment_status = 'PAGADO' THEN 1 ELSE 0 END) as pagado,
    IFNULL(SUM(total), 0) as monto_total,
    IFNULL(SUM(total_paid), 0) as monto_pagado,
    IFNULL(SUM(total - total_paid), 0) as monto_pendiente
  FROM inv_requisition
  WHERE 1=1
    AND (p_cedis_padre_id IS NULL OR cedis_padre_id = p_cedis_padre_id)
    AND (p_vendor_id IS NULL OR vendor_id = p_vendor_id)
    AND (p_requisition_type IS NULL OR requisition_type = p_requisition_type)
    AND (p_date_from IS NULL OR order_date >= p_date_from)
    AND (p_date_to IS NULL OR order_date <= p_date_to);
END;

create
    definer = victor@`%` procedure proc_get_inv_requisitions(IN p_status varchar(50), IN p_payment_status varchar(50),
                                                             IN p_requisition_type varchar(50), IN p_vendor_id int,
                                                             IN p_cedis_padre_id int, IN p_search varchar(255),
                                                             IN p_date_from date, IN p_date_to date, IN p_offset int,
                                                             IN p_limit int)
BEGIN
  SELECT
    r.id,
    r.requisition_number,
    r.requisition_type,
    r.external_order_id,
    r.vendor_id,
    v.name as vendor_name,
    r.cedis_padre_id,
    c.nombre as cedis_name,
    r.status,
    r.payment_status,
    r.order_date,
    r.expected_date,
    r.received_date,
    r.subtotal,
    r.tax,
    r.total,
    r.total_ordered,
    r.total_received,
    r.total_paid,
    r.folio_fiscal,
    r.created_at,
    r.updated_at,
    COUNT(DISTINCT rd.id) as total_products,
    COUNT(DISTINCT rb.batch_id) as total_batches
  FROM inv_requisition r
  LEFT JOIN vendor v ON r.vendor_id = v.id
  LEFT JOIN cedis_padre c ON r.cedis_padre_id = c.id
  LEFT JOIN inv_requisition_detail rd ON r.id = rd.requisition_id
  LEFT JOIN inv_requisition_batches rb ON r.id = rb.requisition_id
  WHERE 1=1
    AND (p_status IS NULL OR r.status = p_status)
    AND (p_payment_status IS NULL OR r.payment_status = p_payment_status)
    AND (p_requisition_type IS NULL OR r.requisition_type = p_requisition_type)
    AND (p_vendor_id IS NULL OR r.vendor_id = p_vendor_id)
    AND (p_cedis_padre_id IS NULL OR r.cedis_padre_id = p_cedis_padre_id)
    AND (p_search IS NULL OR r.requisition_number LIKE CONCAT('%', p_search, '%')
         OR r.external_order_id LIKE CONCAT('%', p_search, '%'))
    AND (p_date_from IS NULL OR r.order_date >= p_date_from)
    AND (p_date_to IS NULL OR r.order_date <= p_date_to)
  GROUP BY r.id
  ORDER BY r.created_at DESC
  LIMIT p_offset, p_limit;

  -- Total count
  SELECT COUNT(DISTINCT r.id) as total_count
  FROM inv_requisition r
  WHERE 1=1
    AND (p_status IS NULL OR r.status = p_status)
    AND (p_payment_status IS NULL OR r.payment_status = p_payment_status)
    AND (p_requisition_type IS NULL OR r.requisition_type = p_requisition_type)
    AND (p_vendor_id IS NULL OR r.vendor_id = p_vendor_id)
    AND (p_cedis_padre_id IS NULL OR r.cedis_padre_id = p_cedis_padre_id)
    AND (p_search IS NULL OR r.requisition_number LIKE CONCAT('%', p_search, '%')
         OR r.external_order_id LIKE CONCAT('%', p_search, '%'))
    AND (p_date_from IS NULL OR r.order_date >= p_date_from)
    AND (p_date_to IS NULL OR r.order_date <= p_date_to);
END;

create
    definer = victor@`%` procedure proc_receive_inv_requisition_product(IN p_requisition_id int,
                                                                        IN p_requisition_detail_id int,
                                                                        IN p_quantity decimal(10, 2),
                                                                        IN p_expiration_date date,
                                                                        IN p_batch_number varchar(50),
                                                                        IN p_received_by int)
BEGIN
  DECLARE v_batch_id INT;
  DECLARE v_product_id INT;
  DECLARE v_cedis_padre_id INT;
  DECLARE v_ordered_quantity DECIMAL(10,2);
  DECLARE v_received_quantity DECIMAL(10,2);
  DECLARE v_new_received DECIMAL(10,2);
  DECLARE v_total_received DECIMAL(10,2);

  -- Get requisition and product info
  SELECT rd.product_id, rd.ordered_quantity, rd.received_quantity, r.cedis_padre_id
  INTO v_product_id, v_ordered_quantity, v_received_quantity, v_cedis_padre_id
  FROM inv_requisition_detail rd
  JOIN inv_requisition r ON rd.requisition_id = r.id
  WHERE rd.id = p_requisition_detail_id;

  -- Validate quantity
  IF (v_received_quantity + p_quantity) > v_ordered_quantity THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Received quantity exceeds ordered quantity';
  END IF;

  -- Create batch
  CALL proc_create_batch(
    p_batch_number,
    v_product_id,
    v_cedis_padre_id,
    p_requisition_id,
    p_quantity,
    p_expiration_date
  );

  SET v_batch_id = (SELECT batch_id FROM (SELECT LAST_INSERT_ID() as batch_id) as temp);

  -- Link batch to requisition
  INSERT INTO inv_requisition_batches (
    requisition_id, requisition_detail_id, batch_id, quantity_received, received_by
  ) VALUES (
    p_requisition_id, p_requisition_detail_id, v_batch_id, p_quantity, p_received_by
  );

  -- Update received quantity
  SET v_new_received = v_received_quantity + p_quantity;
  UPDATE inv_requisition_detail
  SET received_quantity = v_new_received
  WHERE id = p_requisition_detail_id;

  -- Update requisition totals and status
  SELECT SUM(received_quantity) INTO v_total_received
  FROM inv_requisition_detail
  WHERE requisition_id = p_requisition_id;

  UPDATE inv_requisition
  SET
    total_received = v_total_received,
    status = CASE
      WHEN v_total_received >= total_ordered THEN 'RECIBIDA'
      WHEN v_total_received > 0 THEN 'PARCIAL'
      ELSE 'PENDIENTE'
    END,
    received_date = CASE
      WHEN v_total_received >= total_ordered THEN NOW()
      ELSE received_date
    END
  WHERE id = p_requisition_id;

  SELECT v_batch_id as batch_id, p_batch_number as batch_number;
END;

create
    definer = victor@`%` procedure proc_reopen_sales_order(IN p_order_id int, IN p_reopened_by int unsigned,
                                                           OUT p_error_message varchar(500),
                                                           OUT p_new_status varchar(50))
proc_reopen_label: BEGIN
  DECLARE v_status VARCHAR(50);
  DECLARE v_order_number VARCHAR(20);
  DECLARE v_is_legacy TINYINT DEFAULT 0;
  DECLARE v_has_delivery_movements TINYINT DEFAULT 0;
  DECLARE v_detail_id INT;
  DECLARE v_detail_count INT DEFAULT 0;
  DECLARE v_fully_selected_count INT DEFAULT 0;
  DECLARE v_batch_id INT UNSIGNED;
  DECLARE v_restore_qty DECIMAL(10,2);
  DECLARE v_fifo_err VARCHAR(500);
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_has_invoice INT DEFAULT 0;

  DECLARE batch_restore_cursor CURSOR FOR
    SELECT batch_id, ABS(SUM(quantity)) AS restore_qty
    FROM inv_batch_movements
    WHERE movement_type = 'ORDER'
      AND movement_id = p_order_id
      AND quantity < 0
    GROUP BY batch_id
    HAVING SUM(quantity) < 0;

  DECLARE detail_cursor CURSOR FOR
    SELECT id FROM sales_orders_detail WHERE sales_order_id = p_order_id ORDER BY id ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @msg = MESSAGE_TEXT;
    SET p_error_message = LEFT(CONCAT('Error al reabrir OV: ', IFNULL(@msg, 'SQL')), 500);
    SET p_new_status = NULL;
    ROLLBACK;
  END;

  SET p_error_message = NULL;
  SET p_new_status = NULL;

  SELECT
    so.status,
    so.order_number,
    CASE
      WHEN so.source = 'LEGACY_IMPORT'
        OR so.order_number LIKE 'LEG-OV-%'
        OR so.legacy_transaction_id IS NOT NULL
      THEN 1
      ELSE 0
    END
  INTO v_status, v_order_number, v_is_legacy
  FROM sales_orders so
  WHERE so.id = p_order_id;

  IF v_order_number IS NULL THEN
    SET p_error_message = 'Orden de venta no encontrada';
    LEAVE proc_reopen_label;
  END IF;

  IF v_is_legacy = 1 THEN
    SET p_error_message =
      'Las órdenes legacy (LEG-OV) no se reabren con inventario. Use corrección legacy en el detalle.';
    LEAVE proc_reopen_label;
  END IF;

  IF v_status <> 'Entregada' THEN
    SET p_error_message = CONCAT(
      'Solo se pueden reabrir órdenes entregadas. Estado actual: ',
      IFNULL(v_status, '(vacío)')
    );
    LEAVE proc_reopen_label;
  END IF;

  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM sales_order_cfdi_invoices ci
      WHERE ci.sales_order_id = p_order_id
        AND ci.invoice_kind = 'factura'
        AND ci.status_id = 1
        AND ci.env = 'prod'
        AND (ci.cfdi_estado IS NULL OR ci.cfdi_estado = 'Vigente')
    ) THEN 1
    ELSE 0
  END
  INTO v_has_invoice;

  IF v_has_invoice = 1 THEN
    SET p_error_message = 'No se puede reabrir: la orden tiene factura CFDI vigente';
    LEAVE proc_reopen_label;
  END IF;

  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM inv_batch_movements
      WHERE movement_type = 'ORDER' AND movement_id = p_order_id AND quantity < 0
    ) THEN 1
    ELSE 0
  END
  INTO v_has_delivery_movements;

  IF v_has_delivery_movements = 0 THEN
    SET p_error_message =
      'La orden no tiene movimientos de entrega en lotes; no aplica re-ingreso de inventario.';
    LEAVE proc_reopen_label;
  END IF;

  SELECT COUNT(*) INTO v_detail_count
  FROM sales_orders_detail
  WHERE sales_order_id = p_order_id;

  IF v_detail_count = 0 THEN
    SET p_error_message = 'La orden no tiene líneas de producto';
    LEAVE proc_reopen_label;
  END IF;

  START TRANSACTION;

  OPEN batch_restore_cursor;
  restore_loop: LOOP
    FETCH batch_restore_cursor INTO v_batch_id, v_restore_qty;
    IF v_done THEN
      SET v_done = 0;
      LEAVE restore_loop;
    END IF;

    IF v_restore_qty IS NULL OR v_restore_qty <= 0 THEN
      ITERATE restore_loop;
    END IF;

    UPDATE inv_batches
    SET
      available_quantity = available_quantity + v_restore_qty,
      status = CASE
        WHEN status = 'AGOTADO' AND (available_quantity + v_restore_qty) > 0 THEN 'ACTIVO'
        ELSE status
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = v_batch_id;

    INSERT INTO inv_batch_movements (
      batch_id, movement_type, movement_id, quantity, reference, notes, created_by, movement_uom_id
    )
    SELECT
      v_batch_id, 'ORDER', p_order_id, v_restore_qty, v_order_number,
      CONCAT('Reapertura OV ', v_order_number, ' (revierte entrega)'),
      p_reopened_by, b.product_uom_id
    FROM inv_batches b WHERE b.id = v_batch_id;
  END LOOP restore_loop;
  CLOSE batch_restore_cursor;

  UPDATE inv_batches ib
  INNER JOIN inv_batch_holds h
    ON h.batch_id = ib.id
    AND h.sales_order_id = p_order_id
    AND h.status = 'ACTIVE'
    AND h.quantity_held > 0
  SET ib.held_quantity = GREATEST(0, COALESCE(ib.held_quantity, 0) - COALESCE(h.quantity_held, 0));

  DELETE FROM sales_orders_batches WHERE sales_order_id = p_order_id;
  DELETE FROM inv_batch_holds WHERE sales_order_id = p_order_id;

  UPDATE sales_orders_detail
  SET quantity_delivered = 0, updated_at = CURRENT_TIMESTAMP
  WHERE sales_order_id = p_order_id;

  OPEN detail_cursor;
  fifo_loop: LOOP
    FETCH detail_cursor INTO v_detail_id;
    IF v_done THEN
      SET v_done = 0;
      LEAVE fifo_loop;
    END IF;

    SET v_fifo_err = NULL;
    CALL proc_select_batches_fifo(p_order_id, v_detail_id, v_fifo_err);
    IF v_fifo_err IS NOT NULL AND TRIM(v_fifo_err) <> '' THEN
      SET p_error_message = v_fifo_err;
      ROLLBACK;
      LEAVE proc_reopen_label;
    END IF;
  END LOOP fifo_loop;
  CLOSE detail_cursor;

  SELECT COUNT(*)
  INTO v_fully_selected_count
  FROM sales_orders_detail sod
  WHERE sod.sales_order_id = p_order_id
    AND COALESCE((
      SELECT SUM(sob.quantity_allocated)
      FROM sales_orders_batches sob
      WHERE sob.sales_order_detail_id = sod.id
    ), 0) >= (sod.quantity_requested * IFNULL(NULLIF(sod.conversion_factor, 0), 1));

  IF v_fully_selected_count >= v_detail_count THEN
    SET p_new_status = 'Lista para envio';
  ELSE
    SET p_new_status = 'Seleccion y Armado - No tiene seleccion';
  END IF;

  UPDATE sales_orders
  SET
    status = p_new_status,
    total_delivered = 0,
    delivered_at = NULL,
    delivered_by = NULL,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_order_id;

  CALL proc_calculate_order_totals(p_order_id, v_fifo_err);
  IF v_fifo_err IS NOT NULL AND TRIM(v_fifo_err) <> '' THEN
    SET p_error_message = v_fifo_err;
    ROLLBACK;
    LEAVE proc_reopen_label;
  END IF;

  SET p_error_message = NULL;
  COMMIT;
END proc_reopen_label;

create
    definer = victor@`%` procedure proc_update_requisition_product(IN p_detail_id int,
                                                                   IN p_ordered_quantity decimal(10, 2),
                                                                   IN p_unit_cost decimal(10, 2),
                                                                   IN p_tax_rate decimal(5, 2))
BEGIN
  DECLARE v_requisition_id INT;
  DECLARE v_status VARCHAR(50);
  DECLARE v_received_quantity DECIMAL(10,2);
  DECLARE v_line_subtotal DECIMAL(12,2);
  DECLARE v_line_tax DECIMAL(12,2);
  DECLARE v_line_total DECIMAL(12,2);

  -- Get requisition info
  SELECT requisition_id, received_quantity INTO v_requisition_id, v_received_quantity
  FROM inv_requisition_detail WHERE id = p_detail_id;

  SELECT status INTO v_status FROM inv_requisition WHERE id = v_requisition_id;

  -- Check if can be edited
  IF v_status != 'PENDIENTE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot edit requisition that is not PENDIENTE';
  END IF;

  IF v_received_quantity > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot edit product that has been partially received';
  END IF;

  -- Calculate new totals
  SET v_line_subtotal = p_ordered_quantity * p_unit_cost;
  SET v_line_tax = v_line_subtotal * (p_tax_rate / 100);
  SET v_line_total = v_line_subtotal + v_line_tax;

  -- Update product
  UPDATE inv_requisition_detail
  SET
    ordered_quantity = p_ordered_quantity,
    unit_cost = p_unit_cost,
    tax_rate = p_tax_rate,
    line_subtotal = v_line_subtotal,
    line_tax = v_line_tax,
    line_total = v_line_total
  WHERE id = p_detail_id;

  -- Update requisition totals
  UPDATE inv_requisition r
  SET
    subtotal = (SELECT SUM(line_subtotal) FROM inv_requisition_detail WHERE requisition_id = v_requisition_id),
    tax = (SELECT SUM(line_tax) FROM inv_requisition_detail WHERE requisition_id = v_requisition_id),
    total = (SELECT SUM(line_total) FROM inv_requisition_detail WHERE requisition_id = v_requisition_id),
    total_ordered = (SELECT SUM(ordered_quantity) FROM inv_requisition_detail WHERE requisition_id = v_requisition_id)
  WHERE id = v_requisition_id;
END;

