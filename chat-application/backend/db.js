const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://root:root@books-store-mern.pl4k5pa.mongodb.net/chat-coll?retryWrites=true&w=majority&appName=Books-Store-MERN', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});

module.exports = mongoose;
