const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.log('Şifreyi komut satırından parametre olarak ver lütfen.');
  process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Hashleme hatası:', err);
    process.exit(1);
  }
  console.log('Hashlenmiş şifre:', hash);
});
