var mongoose = require('mongoose');
require('./User');

var Schema = mongoose.Schema;

var CommentSchema = new Schema({ 
User: {
    type: Schema.Types.ObjectId,
    ref: 'User'
},
Post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
}})

module.exports = Recipe = mongoose.model('Comment', CommentSchema);