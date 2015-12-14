var mongoose    =   require("mongoose");
var StripeSchema  = {
    "id":String,
    "amount": Number,
    "balance_transaction": String,
    "paid": Boolean,
    "receipt_number": String,
    "status": String
};
module.exports = mongoose.model('Stripe',StripeSchema);
