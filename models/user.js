var mongoose    =   require("mongoose");
mongoose.connect(process.env.MONGOLAB_URI ||'mongodb://localhost:27017/testDB');

var userSchema  = {
    "userEmail" : String,
    "userPassword" : String
};
module.exports = mongoose.model('User',userSchema);
