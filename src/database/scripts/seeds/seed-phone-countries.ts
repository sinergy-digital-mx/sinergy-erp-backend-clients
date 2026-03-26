import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

const phoneCountries = [
  { country_name: 'United States', country_code: 'US', phone_code: '+1' },
  { country_name: 'Mexico', country_code: 'MX', phone_code: '+52' },
  { country_name: 'Canada', country_code: 'CA', phone_code: '+1' },
  { country_name: 'Spain', country_code: 'ES', phone_code: '+34' },
  { country_name: 'United Kingdom', country_code: 'GB', phone_code: '+44' },
  { country_name: 'France', country_code: 'FR', phone_code: '+33' },
  { country_name: 'Germany', country_code: 'DE', phone_code: '+49' },
  { country_name: 'Italy', country_code: 'IT', phone_code: '+39' },
  { country_name: 'Brazil', country_code: 'BR', phone_code: '+55' },
  { country_name: 'Argentina', country_code: 'AR', phone_code: '+54' },
  { country_name: 'Colombia', country_code: 'CO', phone_code: '+57' },
  { country_name: 'Chile', country_code: 'CL', phone_code: '+56' },
  { country_name: 'Peru', country_code: 'PE', phone_code: '+51' },
  { country_name: 'Venezuela', country_code: 'VE', phone_code: '+58' },
  { country_name: 'Australia', country_code: 'AU', phone_code: '+61' },
  { country_name: 'Japan', country_code: 'JP', phone_code: '+81' },
  { country_name: 'China', country_code: 'CN', phone_code: '+86' },
  { country_name: 'India', country_code: 'IN', phone_code: '+91' },
  { country_name: 'South Korea', country_code: 'KR', phone_code: '+82' },
  { country_name: 'Thailand', country_code: 'TH', phone_code: '+66' },
  { country_name: 'Singapore', country_code: 'SG', phone_code: '+65' },
  { country_name: 'Malaysia', country_code: 'MY', phone_code: '+60' },
  { country_name: 'Philippines', country_code: 'PH', phone_code: '+63' },
  { country_name: 'Indonesia', country_code: 'ID', phone_code: '+62' },
  { country_name: 'Vietnam', country_code: 'VN', phone_code: '+84' },
  { country_name: 'Russia', country_code: 'RU', phone_code: '+7' },
  { country_name: 'Ukraine', country_code: 'UA', phone_code: '+380' },
  { country_name: 'Poland', country_code: 'PL', phone_code: '+48' },
  { country_name: 'Netherlands', country_code: 'NL', phone_code: '+31' },
  { country_name: 'Belgium', country_code: 'BE', phone_code: '+32' },
  { country_name: 'Switzerland', country_code: 'CH', phone_code: '+41' },
  { country_name: 'Austria', country_code: 'AT', phone_code: '+43' },
  { country_name: 'Sweden', country_code: 'SE', phone_code: '+46' },
  { country_name: 'Norway', country_code: 'NO', phone_code: '+47' },
  { country_name: 'Denmark', country_code: 'DK', phone_code: '+45' },
  { country_name: 'Finland', country_code: 'FI', phone_code: '+358' },
  { country_name: 'Greece', country_code: 'GR', phone_code: '+30' },
  { country_name: 'Portugal', country_code: 'PT', phone_code: '+351' },
  { country_name: 'Ireland', country_code: 'IE', phone_code: '+353' },
  { country_name: 'New Zealand', country_code: 'NZ', phone_code: '+64' },
  { country_name: 'South Africa', country_code: 'ZA', phone_code: '+27' },
  { country_name: 'Egypt', country_code: 'EG', phone_code: '+20' },
  { country_name: 'Nigeria', country_code: 'NG', phone_code: '+234' },
  { country_name: 'Kenya', country_code: 'KE', phone_code: '+254' },
  { country_name: 'Saudi Arabia', country_code: 'SA', phone_code: '+966' },
  { country_name: 'United Arab Emirates', country_code: 'AE', phone_code: '+971' },
  { country_name: 'Israel', country_code: 'IL', phone_code: '+972' },
  { country_name: 'Turkey', country_code: 'TR', phone_code: '+90' },
  { country_name: 'Pakistan', country_code: 'PK', phone_code: '+92' },
  { country_name: 'Bangladesh', country_code: 'BD', phone_code: '+880' },
];

async function seedPhoneCountries() {
  const dataSource = new DataSource(typeOrmOptions as any);
  await dataSource.initialize();

  try {
    const queryRunner = dataSource.createQueryRunner();

    // Check if data already exists
    const count = await queryRunner.query('SELECT COUNT(*) as count FROM phone_countries');
    if (count[0].count > 0) {
      console.log('✓ Phone countries already seeded');
      return;
    }

    // Insert phone countries
    for (const country of phoneCountries) {
      await queryRunner.query(
        `INSERT INTO phone_countries (country_name, country_code, phone_code, is_active, created_at, updated_at)
         VALUES (?, ?, ?, true, NOW(), NOW())`,
        [country.country_name, country.country_code, country.phone_code]
      );
    }

    console.log(`✓ Seeded ${phoneCountries.length} phone countries`);
  } catch (error) {
    console.error('Error seeding phone countries:', error.message);
  } finally {
    await dataSource.destroy();
  }
}

seedPhoneCountries();
