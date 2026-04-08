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

create table if not exists customers
(
    id            int auto_increment
        primary key,
    name          varchar(255)                        not null,
    created_at    timestamp default CURRENT_TIMESTAMP not null,
    tenant_id     varchar(36)                         null,
    status_id     int                                 null,
    group_id      varchar(255)                        null,
    lastname      varchar(255)                        null,
    email         varchar(255)                        null,
    phone         varchar(255)                        null,
    phone_country varchar(2)                          null,
    company_name  varchar(255)                        null,
    website       varchar(255)                        null,
    phone_code    varchar(10)                         null,
    country       varchar(100)                        null,
    constraint FK_9d666fe1125d410ff9d110e2d2e
        foreign key (status_id) references customer_status (id)
);

create index FK_3c205d25767606602d2a84bf8eb
    on customers (group_id);

create index FK_customers_rbac_tenant_id
    on customers (tenant_id);

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

create table if not exists payments
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
    on payments (contract_id);

create index payment_date_index
    on payments (payment_date);

create index status_index
    on payments (status);

create index tenant_index
    on payments (tenant_id);

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

create index tenant_index
    on document_types (tenant_id);

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
    constraint FK_6a3ffa5eaa223d9f40fa47ac2ee
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

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

create table if not exists contracts
(
    id                 varchar(36) collate utf8mb4_unicode_ci                                             not null
        primary key,
    tenant_id          varchar(36)                                                                        not null,
    customer_id        int                                                                                not null,
    property_id        varchar(36)                                                                        not null,
    contract_number    varchar(50) collate utf8mb4_unicode_ci                                             null,
    contract_date      date                                                                               not null,
    total_price        decimal(15, 2)                                                                     not null,
    down_payment       decimal(15, 2)                                                                     not null,
    remaining_balance  decimal(15, 2)                                                                     not null,
    payment_months     int                                                                                not null,
    monthly_payment    decimal(15, 2)                                                                     not null,
    first_payment_date date                                                                               not null,
    currency           varchar(10) collate utf8mb4_unicode_ci                                             null,
    status             enum ('activo', 'completado', 'cancelado', 'suspendido') default 'activo'          not null,
    notes              text                                                                               null,
    metadata           json                                                                               null,
    created_at         timestamp                                                default CURRENT_TIMESTAMP not null,
    updated_at         timestamp                                                default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    payment_due_day    int                                                                                null,
    interest_rate      decimal(5, 2)                                                                      null,
    constraint FK_2e66f7950711366031e3200413d
        foreign key (customer_id) references customers (id),
    constraint FK_5d074ef9e0a3c47bace58d850b0
        foreign key (property_id) references properties (id),
    constraint FK_99f99bdfee2d227b320d4d7c70e
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade
);

create index IDX_contracts_customer_id
    on contracts (customer_id);

create index IDX_contracts_property_id
    on contracts (property_id);

create index IDX_contracts_status
    on contracts (status);

create index IDX_contracts_tenant_id
    on contracts (tenant_id);

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
    name           varchar(255)                         not null,
    description    text                                 null,
    is_active      tinyint(1) default 1                 not null,
    created_at     timestamp  default CURRENT_TIMESTAMP not null,
    updated_at     timestamp  default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    category_id    varchar(36)                          null,
    subcategory_id varchar(36)                          null,
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
    id            varchar(36)                           not null
        primary key,
    tenant_id     varchar(36)                           null,
    status_id     int                                   null,
    email         varchar(255)                          not null,
    password      varchar(255)                          not null,
    last_login_at timestamp                             null,
    created_at    timestamp   default CURRENT_TIMESTAMP not null,
    updated_at    timestamp   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    first_name    varchar(100)                          null,
    last_name     varchar(100)                          null,
    phone         varchar(20)                           null,
    language_code varchar(10) default 'es'              null
);

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
    id           varchar(36)                                           not null
        primary key,
    tenant_id    varchar(36)                                           not null,
    name         varchar(255)                                          not null,
    company_name varchar(255)                                          not null,
    street       varchar(255)                                          not null,
    city         varchar(255)                                          not null,
    state        varchar(255)                                          not null,
    zip_code     varchar(255)                                          not null,
    country      varchar(255)                                          not null,
    razon_social varchar(255)                                          not null,
    rfc          varchar(255)                                          not null,
    persona_type enum ('Persona Física', 'Persona Moral')              not null,
    status       enum ('active', 'inactive') default 'active'          not null,
    created_at   timestamp                   default CURRENT_TIMESTAMP not null,
    updated_at   timestamp                   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
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

create index rfc_index
    on vendors (rfc);

create index status_index
    on vendors (status);

create index tenant_index
    on vendors (tenant_id);

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
    constraint UQ_d8b96d60ff9a288f5ed862280d9
        unique (code),
    constraint FK_09106b8068aeaf74fa33666df8f
        foreign key (tenant_id) references rbac_tenants (id)
            on delete cascade,
    constraint FK_746712ac0e81d7fe91f2be2c22e
        foreign key (fiscal_configuration_id) references fiscal_configurations (id)
            on delete set null
);

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
    product_uom_id                    varchar(36)                              not null,
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
    constraint fk_po_detail_batch
        foreign key (purchase_order_batch_id) references inv_s_purchase_order_batch (id)
            on delete cascade,
    constraint fk_po_detail_converted_uom
        foreign key (received_converted_uom_id) references uom_catalog (id),
    constraint fk_po_detail_product
        foreign key (product_id) references products (id),
    constraint fk_po_detail_received_product
        foreign key (received_original_product_id) references products (id),
    constraint fk_po_detail_received_uom
        foreign key (received_original_uom_id) references uom_catalog (id),
    constraint fk_po_detail_product_uom
        foreign key (product_uom_id) references product_uoms (id)
);

create table if not exists inv_s_batches
(
    id                       varchar(36)                         not null
        primary key,
    tenant_id                varchar(36)                         not null,
    batch_number             varchar(50)                         not null,
    warehouse_id             varchar(36)                         not null,
    product_id               varchar(36)                         not null,
    uom_id                   varchar(36)                         not null,
    quantity                 decimal(12, 3)                      not null,
    purchase_order_batch_id  varchar(36)                         null,
    purchase_order_detail_id varchar(36)                         null,
    created_by               varchar(36)                         not null,
    created_at               timestamp default CURRENT_TIMESTAMP not null,
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

