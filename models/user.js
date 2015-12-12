var mongoose    =   require("mongoose");
mongoose.connect('mongodb://localhost:27017/testDB');
var userSchema  = {
    "userEmail" : String,
    "userPassword" : String
};
module.exports = mongoose.model('User',userSchema);
