-- CreateTable
CREATE TABLE `construction_sites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `site_code` VARCHAR(20) NOT NULL,
    `site_name` VARCHAR(200) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `sector` VARCHAR(100) NOT NULL,
    `cell` VARCHAR(100) NOT NULL,
    `village` VARCHAR(100) NOT NULL,
    `project_manager` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `working_hours_start` VARCHAR(191) NOT NULL DEFAULT '08:00',
    `working_hours_end` VARCHAR(191) NOT NULL DEFAULT '17:00',
    `standard_hours_per_day` DECIMAL(3, 1) NOT NULL DEFAULT 8.0,
    `overtime_rate_multiplier` DECIMAL(3, 2) NOT NULL DEFAULT 1.5,
    `status` ENUM('ACTIVE', 'INACTIVE', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'ACTIVE',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `construction_sites_site_code_key`(`site_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `national_id` VARCHAR(50) NULL,
    `job_type` ENUM('LABORER', 'MASON', 'CARPENTER', 'ELECTRICIAN', 'PLUMBER', 'SUPERVISOR', 'FOREMAN', 'DRIVER', 'SECURITY', 'CLEANER', 'WELDER', 'PAINTER', 'ROOFER') NOT NULL,
    `daily_rate` DECIMAL(10, 2) NOT NULL,
    `overtime_rate` DECIMAL(10, 2) NULL,
    `site_specific_rate` DECIMAL(10, 2) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE') NOT NULL DEFAULT 'ACTIVE',
    `bank_account` VARCHAR(50) NULL,
    `bank_name` VARCHAR(100) NULL,
    `mobile_money_number` VARCHAR(20) NULL,
    `mobile_money_provider` ENUM('MTN_MOMO', 'AIRTEL_MONEY') NULL,
    `airtel_money_number` VARCHAR(20) NULL,
    `airtel_money_provider` ENUM('AIRTEL_MONEY') NULL,
    `preferred_payment_method` ENUM('BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'AIRTEL_MONEY', 'CHECK') NOT NULL DEFAULT 'BANK_TRANSFER',
    `emergency_contact_name` VARCHAR(100) NULL,
    `emergency_contact_phone` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `assigned_site_id` INTEGER NOT NULL,

    UNIQUE INDEX `workers_employee_id_key`(`employee_id`),
    UNIQUE INDEX `workers_national_id_key`(`national_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fingerprint_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `worker_id` INTEGER NOT NULL,
    `finger_position` ENUM('THUMB', 'INDEX', 'MIDDLE', 'RING', 'PINKY') NOT NULL,
    `hand` ENUM('LEFT', 'RIGHT') NOT NULL,
    `template_data` TEXT NOT NULL,
    `quality_score` TINYINT UNSIGNED NOT NULL,
    `enrollment_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `enrolled_by` VARCHAR(100) NULL,
    `device_used` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fingerprint_devices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `device_id` VARCHAR(50) NOT NULL,
    `device_name` VARCHAR(100) NOT NULL,
    `site_id` INTEGER NULL,
    `manufacturer` VARCHAR(100) NULL,
    `model` VARCHAR(100) NULL,
    `serial_number` VARCHAR(100) NULL,
    `firmware_version` VARCHAR(50) NULL,
    `ip_address` VARCHAR(15) NULL,
    `mac_address` VARCHAR(17) NULL,
    `is_online` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_ping` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fingerprint_devices_device_id_key`(`device_id`),
    UNIQUE INDEX `fingerprint_devices_serial_number_key`(`serial_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `worker_id` INTEGER NOT NULL,
    `site_id` INTEGER NOT NULL,
    `attendance_date` DATETIME(3) NOT NULL,
    `check_in_time` DATETIME(3) NULL,
    `check_out_time` DATETIME(3) NULL,
    `total_hours` DECIMAL(4, 2) NULL,
    `regular_hours` DECIMAL(4, 2) NULL,
    `overtime_hours` DECIMAL(4, 2) NOT NULL DEFAULT 0,
    `break_time_minutes` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'OVERTIME', 'EARLY_DEPARTURE') NOT NULL DEFAULT 'PRESENT',
    `check_out_method` ENUM('FINGERPRINT', 'MANUAL', 'EMERGENCY_OVERRIDE') NOT NULL DEFAULT 'FINGERPRINT',
    `fingerprint_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendance_records_worker_id_site_id_attendance_date_key`(`worker_id`, `site_id`, `attendance_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fingerprint_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attendance_record_id` INTEGER NULL,
    `worker_id` INTEGER NULL,
    `device_id` INTEGER NULL,
    `match_score` TINYINT UNSIGNED NULL,
    `matched_template_id` INTEGER NULL,
    `scan_timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `scan_quality` TINYINT UNSIGNED NULL,
    `match_result` ENUM('SUCCESS', 'NO_MATCH', 'POOR_QUALITY', 'DEVICE_ERROR', 'MULTIPLE_MATCHES') NOT NULL,
    `error_message` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `worker_id` INTEGER NOT NULL,
    `site_id` INTEGER NOT NULL,
    `pay_period_start` DATETIME(3) NOT NULL,
    `pay_period_end` DATETIME(3) NOT NULL,
    `pay_period_type` ENUM('WEEKLY', 'BI_WEEKLY', 'MONTHLY') NOT NULL,
    `total_days_worked` INTEGER NOT NULL,
    `total_hours` DECIMAL(6, 2) NOT NULL,
    `regular_hours` DECIMAL(6, 2) NOT NULL,
    `overtime_hours` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `daily_rate` DECIMAL(10, 2) NOT NULL,
    `regular_pay` DECIMAL(10, 2) NOT NULL,
    `overtime_pay` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `gross_pay` DECIMAL(10, 2) NOT NULL,
    `net_pay` DECIMAL(10, 2) NOT NULL,
    `payment_status` ENUM('PENDING', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `payment_method` ENUM('BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'AIRTEL_MONEY', 'CHECK') NULL,
    `payment_date` DATETIME(3) NULL,
    `payment_reference` VARCHAR(100) NULL,
    `calculated_by` VARCHAR(100) NULL,
    `approved_by` VARCHAR(100) NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payroll_records_worker_id_site_id_pay_period_start_key`(`worker_id`, `site_id`, `pay_period_start`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `config_key` VARCHAR(100) NOT NULL,
    `config_value` TEXT NOT NULL,
    `config_type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL,
    `description` VARCHAR(500) NULL,
    `modified_by` VARCHAR(100) NULL,
    `modified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_config_config_key_key`(`config_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `site_id` INTEGER NOT NULL,
    `report_date` DATETIME(3) NOT NULL,
    `total_workers_assigned` INTEGER NOT NULL,
    `total_workers_present` INTEGER NOT NULL,
    `total_workers_absent` INTEGER NOT NULL,
    `total_hours_worked` DECIMAL(8, 2) NOT NULL,
    `total_overtime_hours` DECIMAL(8, 2) NOT NULL,
    `total_labor_cost` DECIMAL(12, 2) NOT NULL,
    `average_hours_per_worker` DECIMAL(4, 2) NOT NULL,
    `generated_by` VARCHAR(100) NULL,
    `report_status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `daily_reports_site_id_report_date_key`(`site_id`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workers` ADD CONSTRAINT `workers_assigned_site_id_fkey` FOREIGN KEY (`assigned_site_id`) REFERENCES `construction_sites`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fingerprint_templates` ADD CONSTRAINT `fingerprint_templates_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fingerprint_devices` ADD CONSTRAINT `fingerprint_devices_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `construction_sites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `construction_sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fingerprint_logs` ADD CONSTRAINT `fingerprint_logs_attendance_record_id_fkey` FOREIGN KEY (`attendance_record_id`) REFERENCES `attendance_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fingerprint_logs` ADD CONSTRAINT `fingerprint_logs_matched_template_id_fkey` FOREIGN KEY (`matched_template_id`) REFERENCES `fingerprint_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fingerprint_logs` ADD CONSTRAINT `fingerprint_logs_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `fingerprint_devices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `construction_sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `construction_sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
