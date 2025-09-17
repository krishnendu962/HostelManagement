const { UserModel } = require('./backend/models');

async function createDemoUsers() {
  try {
    console.log('Creating demo users...');

    // Create Super Admin
    const admin = await UserModel.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@hostel.com',
      role: 'SuperAdmin',
      phone: '+91 9876543210'
    });
    console.log('✅ Created Super Admin:', admin.username);

    // Create Warden
    const warden = await UserModel.create({
      username: 'warden1',
      password: 'warden123',
      email: 'warden1@hostel.com',
      role: 'Warden',
      phone: '+91 9876543211'
    });
    console.log('✅ Created Warden:', warden.username);

    // Create Student
    const student = await UserModel.create({
      username: 'student1',
      password: 'student123',
      email: 'student1@college.edu',
      role: 'Student',
      phone: '+91 9876543212'
    });
    console.log('✅ Created Student:', student.username);

    console.log('\n🎉 Demo users created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Super Admin - admin / admin123');
    console.log('Warden - warden1 / warden123');
    console.log('Student - student1 / student123');

  } catch (error) {
    console.error('❌ Error creating demo users:', error.message);
  }
}

// Run the script
createDemoUsers().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});