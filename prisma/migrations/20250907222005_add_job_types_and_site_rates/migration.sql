/*
  Migration: Add Job Types and Site Job Rates
  
  This migration:
  1. Creates job_types table with default job types
  2. Creates site_job_rates table
  3. Migrates existing worker data to use new job type system
  4. Removes old columns from workers table
*/

-- Step 1: Create job_types table
CREATE TABLE `job_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `job_code` VARCHAR(20) NOT NULL,
    `job_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(50) NULL,
    `base_daily_rate` DECIMAL(10, 2) NOT NULL,
    `overtime_multiplier` DECIMAL(3, 2) NOT NULL DEFAULT 1.5,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `job_types_job_code_key`(`job_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Insert default job types
INSERT INTO `job_types` (`job_code`, `job_name`, `description`, `category`, `base_daily_rate`, `overtime_multiplier`) VALUES
('LABORER', 'Laborer', 'General construction worker', 'UNSKILLED', 8000.00, 1.50),
('MASON', 'Mason', 'Brickwork and stonework specialist', 'SKILLED', 15000.00, 1.50),
('CARPENTER', 'Carpenter', 'Woodwork and framing specialist', 'SKILLED', 18000.00, 1.50),
('ELECTRICIAN', 'Electrician', 'Electrical installation and repair specialist', 'SKILLED', 20000.00, 1.50),
('PLUMBER', 'Plumber', 'Plumbing installation and repair specialist', 'SKILLED', 19000.00, 1.50),
('SUPERVISOR', 'Supervisor', 'Site supervision and management', 'SUPERVISORY', 25000.00, 1.50),
('FOREMAN', 'Foreman', 'Team leader and task coordinator', 'SUPERVISORY', 22000.00, 1.50),
('DRIVER', 'Driver', 'Vehicle and equipment operator', 'SKILLED', 12000.00, 1.50),
('SECURITY', 'Security', 'Site security and safety', 'UNSKILLED', 10000.00, 1.50),
('CLEANER', 'Cleaner', 'Site cleanup and maintenance', 'UNSKILLED', 7000.00, 1.50),
('WELDER', 'Welder', 'Metal work and welding specialist', 'SKILLED', 17000.00, 1.50),
('PAINTER', 'Painter', 'Painting and finishing specialist', 'SKILLED', 14000.00, 1.50),
('ROOFER', 'Roofer', 'Roofing installation and repair specialist', 'SKILLED', 16000.00, 1.50);

-- Step 3: Create site_job_rates table
CREATE TABLE `site_job_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `site_id` INTEGER NOT NULL,
    `job_type_id` INTEGER NOT NULL,
    `site_specific_rate` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `site_job_rates_site_id_job_type_id_key`(`site_id`, `job_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 4: Add job_type_id column to workers table (nullable first)
ALTER TABLE `workers` ADD COLUMN `job_type_id` INTEGER NULL;

-- Step 5: Update existing workers to use appropriate job types based on their current job_type
UPDATE `workers` SET `job_type_id` = (
    SELECT `id` FROM `job_types` WHERE `job_code` = `workers`.`job_type`
) WHERE `job_type` IS NOT NULL;

-- Step 6: Set default job type for any workers that couldn't be mapped
UPDATE `workers` SET `job_type_id` = (SELECT `id` FROM `job_types` WHERE `job_code` = 'LABORER') WHERE `job_type_id` IS NULL;

-- Step 7: Make job_type_id NOT NULL
ALTER TABLE `workers` MODIFY COLUMN `job_type_id` INTEGER NOT NULL;

-- Step 8: Create site-specific rates for existing sites (using base rates as default)
INSERT INTO `site_job_rates` (`site_id`, `job_type_id`, `site_specific_rate`)
SELECT 
    cs.`id` as `site_id`,
    jt.`id` as `job_type_id`,
    jt.`base_daily_rate` as `site_specific_rate`
FROM `construction_sites` cs
CROSS JOIN `job_types` jt
WHERE jt.`is_active` = true;

-- Step 9: Add foreign key constraints
ALTER TABLE `site_job_rates` ADD CONSTRAINT `site_job_rates_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `construction_sites`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `site_job_rates` ADD CONSTRAINT `site_job_rates_job_type_id_fkey` FOREIGN KEY (`job_type_id`) REFERENCES `job_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `workers` ADD CONSTRAINT `workers_job_type_id_fkey` FOREIGN KEY (`job_type_id`) REFERENCES `job_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 10: Drop old columns from workers table
ALTER TABLE `workers` DROP COLUMN `daily_rate`,
    DROP COLUMN `job_type`,
    DROP COLUMN `overtime_rate`,
    DROP COLUMN `site_specific_rate`;
