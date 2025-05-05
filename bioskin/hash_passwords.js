// hash_passwords.js
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Adjust the path if users.json is elsewhere relative to this script
const usersFilePath = path.join(__dirname, 'users.json');
const saltRounds = 10; // Cost factor for hashing

async function hashPasswords() {
  try {
    console.log(`Reading users from: ${usersFilePath}`);
    const usersData = fs.readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(usersData);

    console.log('Hashing passwords...');
    let updated = false;

    for (const user of users) {
      // Only hash if password exists and doesn't look like a bcrypt hash
      if (user.password && !user.password.startsWith('$2')) {
        console.log(`Hashing password for user: ${user.username}`);
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        user.password = hashedPassword; // Replace plain text with hash
        console.log(` -> Hashed successfully.`);
        updated = true;
      } else {
         console.log(`Password for ${user.username} already hashed or is empty. Skipping.`);
      }
    }

    if (updated) {
      // Write the updated users array back to the file
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2)); // Pretty print JSON
      console.log('Successfully updated users.json with hashed passwords.');
    } else {
      console.log('No passwords needed hashing.');
    }

  } catch (error) {
    console.error('Error hashing passwords:', error);
  }
}

hashPasswords();