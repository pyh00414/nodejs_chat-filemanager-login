var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema({
    room : String,
	userId: String,
    message: String,
});

module.exports = mongoose.model('chat', chatSchema);