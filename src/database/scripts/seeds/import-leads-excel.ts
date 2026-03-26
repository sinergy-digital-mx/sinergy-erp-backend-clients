import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';
import { Lead } from '../../entities/leads/lead.entity';
import { LeadAddress } from '../../entities/leads/lead-address.entity';
import { LeadStatus } from '../../entities/leads/lead-status.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { typeOrmOptions } from '../typeorm.options';
import * as path from 'path';
import { parsePhoneNumber, extractCountryCode, getCountryName } from '../../common/utils/phone.validator';

interface ExcelRow {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    rating?: number;
    business_status?: string;
    working_hours?: string;
    verified?: boolean;
    owner_title?: string;
    location_link?: string;
    [key: string]: any;
}

interface ParsedAddress {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
}

class LeadsImporter {
    private dataSource: DataSource;
    private leadRepo: any;
    private addressRepo: any;
    private statusRepo: any;
    private tenantRepo: any;

    constructor() {
        this.dataSource = new DataSource(typeOrmOptions);
    }

    async initialize() {
        await this.dataSource.initialize();
        this.leadRepo = this.dataSource.getRepository(Lead);
        this.addressRepo = this.dataSource.getRepository(LeadAddress);
        this.statusRepo = this.dataSource.getRepository(LeadStatus);
        this.tenantRepo = this.dataSource.getRepository(RBACTenant);
        console.log('✅ Database connection established');
    }

    async destroy() {
        await this.dataSource.destroy();
    }

    parseAddress(addressString: string): ParsedAddress {
        if (!addressString) return {};

        // Example: "3120 W Carefree Hwy STE 1-136, Phoenix, AZ 85086"
        const parts = addressString.split(',').map(p => p.trim());
        
        if (parts.length >= 3) {
            const street = parts[0];
            const city = parts[1];
            const stateZip = parts[2];
            
            // Parse "AZ 85086" or "Arizona 85086"
            const stateZipMatch = stateZip.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
            
            return {
                street,
                city,
                state: stateZipMatch ? stateZipMatch[1] : stateZip,
                postal_code: stateZipMatch ? stateZipMatch[2] : undefined,
                country: 'United States'
            };
        } else if (parts.length === 2) {
            return {
                street: parts[0],
                city: parts[1],
                country: 'United States'
            };
        } else {
            return {
                street: addressString,
                country: 'United States'
            };
        }
    }

    cleanPhone(phone: string | undefined, defaultCountryCode: string = '+1'): { phone: string; phone_country: string; phone_code: string } {
        if (!phone) {
            const countryName = getCountryName(defaultCountryCode) || 'Unknown';
            return { 
                phone: '', 
                phone_country: countryName, 
                phone_code: defaultCountryCode 
            };
        }

        // Try to parse the phone number with default country code
        const result = parsePhoneNumber(phone, defaultCountryCode);
        
        if (!result.isValid) {
            console.warn(`⚠️  Invalid phone number: ${phone} - ${result.error}`);
            // Return empty phone but preserve country code
            const countryName = getCountryName(defaultCountryCode) || 'Unknown';
            return { 
                phone: '', 
                phone_country: countryName, 
                phone_code: defaultCountryCode 
            };
        }

        const countryName = result.countryName || getCountryName(result.countryCode) || 'Unknown';
        
        return {
            phone: result.e164,
            phone_country: countryName,
            phone_code: result.countryCode
        };
    }

    async importFromExcel(filePath: string, tenantId: string, defaultCountryCode: string = '+1') {
        console.log(`🚀 Starting import from ${filePath}`);
        console.log(`📋 Target tenant: ${tenantId}`);
        console.log(`🌍 Default country code: ${defaultCountryCode}`);

        // Verify tenant exists
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new Error(`Tenant ${tenantId} not found`);
        }

        // Get default status
        let defaultStatus = await this.statusRepo.findOne({ where: { code: 'new' } });
        if (!defaultStatus) {
            defaultStatus = await this.statusRepo.findOne({});
        }
        if (!defaultStatus) {
            throw new Error('No lead status found in database');
        }

        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Found ${data.length} rows in Excel file`);

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            try {
                // Skip rows without essential data
                if (!row.name) {
                    console.log(`⏭️  Row ${i + 1}: Skipping - no business name`);
                    skipped++;
                    continue;
                }

                // For this dataset, name is the business name
                const businessName = row.name;
                
                // Try to extract owner name from owner_title, otherwise use business name
                let contactName = businessName;
                let contactLastname = '';
                
                if (row.owner_title && row.owner_title !== businessName) {
                    const nameParts = row.owner_title.split(' ');
                    if (nameParts.length > 1) {
                        contactName = nameParts[0];
                        contactLastname = nameParts.slice(1).join(' ');
                    } else {
                        contactName = row.owner_title;
                    }
                }

                // Clean phone data with default country code
                const phoneData = this.cleanPhone(row.phone, defaultCountryCode);

                // Create lead
                const lead = this.leadRepo.create({
                    tenant_id: tenantId,
                    status: defaultStatus,
                    name: contactName.substring(0, 255),
                    lastname: contactLastname.substring(0, 255),
                    email: row.email || '',
                    phone: phoneData.phone,
                    phone_country: phoneData.phone_country,
                    phone_code: phoneData.phone_code,
                    source: 'Google Business Import',
                    company_name: businessName.substring(0, 255),
                    company_phone: phoneData.phone || null,
                    website: row.location_link?.substring(0, 255) || null,
                });

                const savedLead = await this.leadRepo.save(lead);

                // Create address if available
                if (row.address) {
                    const parsedAddress = this.parseAddress(row.address);
                    
                    const address = this.addressRepo.create({
                        lead: savedLead,
                        tenant_id: tenantId,
                        type: 'business',
                        street_address: parsedAddress.street?.substring(0, 255) || '',
                        street_address_2: null,
                        city: parsedAddress.city?.substring(0, 100) || '',
                        state: parsedAddress.state?.substring(0, 100) || '',
                        postal_code: parsedAddress.postal_code?.substring(0, 20) || '',
                        country: parsedAddress.country?.substring(0, 100) || 'United States',
                        is_primary: true,
                    });

                    await this.addressRepo.save(address);
                }

                imported++;
                
                if (imported % 100 === 0) {
                    console.log(`📈 Progress: ${imported}/${data.length} leads imported`);
                }

            } catch (error) {
                console.error(`❌ Error importing row ${i + 1}:`, error.message);
                errors++;
                
                // Continue with next row instead of stopping
                continue;
            }
        }

        console.log(`\n✅ Import completed!`);
        console.log(`📊 Summary:`);
        console.log(`   - Total rows: ${data.length}`);
        console.log(`   - Imported: ${imported}`);
        console.log(`   - Skipped: ${skipped}`);
        console.log(`   - Errors: ${errors}`);
    }
}

async function main() {
    const importer = new LeadsImporter();
    
    try {
        await importer.initialize();
        
        // Configuration
        const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';
        const excelFilePath = path.join(__dirname, '../excels/divino_full_leads.xlsx');
        
        console.log(`📁 Looking for Excel file at: ${excelFilePath}`);
        
        await importer.importFromExcel(excelFilePath, tenantId);
        
    } catch (error) {
        console.error('💥 Import failed:', error);
        process.exit(1);
    } finally {
        await importer.destroy();
    }
}

// Run the import
if (require.main === module) {
    main();
}