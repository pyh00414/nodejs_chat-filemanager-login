var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    userId: String,
    userPw: String,
});

module.exports = mongoose.model('user', userSchema);