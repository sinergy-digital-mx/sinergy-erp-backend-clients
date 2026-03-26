import { AppDataSource } from '../data-source';
import { User } from '../../entities/users/user.entity';

async function listUsers() {
  try {
    await AppDataSource.initialize();

    const users = await AppDataSource.getRepository(User).find({
      take: 20,
    });

    console.log('Users in database:');
    users.forEach(u => {
      console.log(`- Email: ${u.email}, ID: ${u.id}, Tenant: ${u.tenant_id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
