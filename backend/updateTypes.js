const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://casacleanlimpezaecuidados_db_user:QXZxdOPjynmzsdUz@casa-clean.ofmuscx.mongodb.net/casa-clean?retryWrites=true&w=majority&appName=casa-clean';

async function update() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado!');

    const result = await mongoose.connection.db.collection('employees').updateMany(
      { type: 'folguista' },
      { $set: { type: 'fora_de_folha' } }
    );

    console.log('✅ Atualizados:', result.modifiedCount, 'funcionários');
    
    await mongoose.disconnect();
    console.log('✅ Desconectado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

update();