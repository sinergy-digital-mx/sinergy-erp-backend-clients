import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

const phoneCountries = [
  { name: 'United States', code: 'US', value: '+1' },
  { name: 'Mexico', code: 'MX', value: '+52' },
  { name: 'Canada', code: 'CA', value: '+1' },
  { name: 'Spain', code: 'ES', value: '+34' },
  { name: 'United Kingdom', code: 'GB', value: '+44' },
  { name: 'France', code: 'FR', value: '+33' },
  { name: 'Germany', code: 'DE', value: '+49' },
  { name: 'Italy', code: 'IT', value: '+39' },
  { name: 'Brazil', code: 'BR', value: '+55' },
  { name: 'Argentina', code: 'AR', value: '+54' },
  { name: 'Colombia', code: 'CO', value: '+57' },
  { name: 'Chile', code: 'CL', value: '+56' },
  { name: 'Peru', code: 'PE', value: '+51' },
  { name: 'Venezuela', code: 'VE', value: '+58' },
  { name: 'Australia', code: 'AU', value: '+61' },
  { name: 'Japan', code: 'JP', value: '+81' },
  { name: 'China', code: 'CN', value: '+86' },
  { name: 'India', code: 'IN', value: '+91' },
  { name: 'South Korea', code: 'KR', value: '+82' },
  { name: 'Thailand', code: 'TH', value: '+66' },
  { name: 'Singapore', code: 'SG', value: '+65' },
  { name: 'Malaysia', code: 'MY', value: '+60' },
  { name: 'Philippines', code: 'PH', value: '+63' },
  { name: 'Indonesia', code: 'ID', value: '+62' },
  { name: 'Vietnam', code: 'VN', value: '+84' },
  { name: 'Russia', code: 'RU', value: '+7' },
  { name: 'Ukraine', code: 'UA', value: '+380' },
  { name: 'Poland', code: 'PL', value: '+48' },
  { name: 'Netherlands', code: 'NL', value: '+31' },
  { name: 'Belgium', code: 'BE', value: '+32' },
  { name: 'Switzerland', code: 'CH', value: '+41' },
  { name: 'Austria', code: 'AT', value: '+43' },
  { name: 'Sweden', code: 'SE', value: '+46' },
  { name: 'Norway', code: 'NO', value: '+47' },
  { name: 'Denmark', code: 'DK', value: '+45' },
  { name: 'Finland', code: 'FI', value: '+358' },
  { name: 'Greece', code: 'GR', value: '+30' },
  { name: 'Portugal', code: 'PT', value: '+351' },
  { name: 'Ireland', code: 'IE', value: '+353' },
  { name: 'New Zealand', code: 'NZ', value: '+64' },
  { name: 'South Africa', code: 'ZA', value: '+27' },
  { name: 'Egypt', code: 'EG', value: '+20' },
  { name: 'Nigeria', code: 'NG', value: '+234' },
  { name: 'Kenya', code: 'KE', value: '+254' },
  { name: 'Saudi Arabia', code: 'SA', value: '+966' },
  { name: 'United Arab Emirates', code: 'AE', value: '+971' },
  { name: 'Israel', code: 'IL', value: '+972' },
  { name: 'Turkey', code: 'TR', value: '+90' },
  { name: 'Pakistan', code: 'PK', value: '+92' },
  { name: 'Bangladesh', code: 'BD', value: '+880' },
];

async function seedCatalogs() {
  const dataSource = new DataSource(typeOrmOptions as any);
  await dataSource.initialize();

  try {
    const queryRunner = dataSource.createQueryRunner();

    // Check if catalogs already exist
    const count = await queryRunner.query('SELECT COUNT(*) as count FROM catalogs WHERE catalog_type = ?', ['phone_country']);
    if (count[0].count > 0) {
      console.log('✓ Phone country catalogs already seeded');
      return;
    }

    // Insert phone country catalogs
    for (let i = 0; i < phoneCountries.length; i++) {
      const country = phoneCountries[i];
      await queryRunner.query(
        `INSERT INTO catalogs (catalog_type, name, code, value, is_active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, true, ?, NOW(), NOW())`,
        ['phone_country', country.name, country.code, country.value, i]
      );
    }

    console.log(`✓ Seeded ${phoneCountries.length} phone country catalogs`);
  } catch (error) {
    console.error('Error seeding catalogs:', error.message);
  } finally {
    await dataSource.destroy();
  }
}

seedCatalogs();
