const { CustomerRepository } = require("../database");
const { FormateData, GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } = require('../utils');
const { APIError, BadRequestError } = require('../utils/app-errors')


// All Business logic will be here
class CustomerService {

    constructor(){
        this.repository = new CustomerRepository();
    }

    async SignIn(userInputs){

        const { email, password } = userInputs;
        
        try {
            
            const existingCustomer = await this.repository.FindCustomer({ email});

            if(existingCustomer){
            
                const validPassword = await ValidatePassword(password, existingCustomer.password, existingCustomer.salt);
                
                if(validPassword){
                    const token = await GenerateSignature({ email: existingCustomer.email, _id: existingCustomer._id});
                    return FormateData({id: existingCustomer._id, token });
                } 
            }
    
            return FormateData(null);

        } catch (err) {
            throw new APIError('Data Not found', err)
        }

       
    }

    async SignUp(userInputs){
        
        const { email, password, phone } = userInputs;
        
        try{
            // create salt
            let salt = await GenerateSalt();
            
            let userPassword = await GeneratePassword(password, salt);
            
            const existingCustomer = await this.repository.CreateCustomer({ email, password: userPassword, phone, salt});
            
            const token = await GenerateSignature({ email: email, _id: existingCustomer._id});

            return FormateData({id: existingCustomer._id, token });

        }catch(err){
            throw new APIError('Data Not found', err)
        }

    }

    async AddNewAddress(_id,userInputs){
        
        const { street, postalCode, city,country} = userInputs;
        
        try {
            const addressResult = await this.repository.CreateAddress({ _id, street, postalCode, city,country})
            return FormateData(addressResult);
            
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
        
    
    }

    async GetProfile(id){

        try {
            const existingCustomer = await this.repository.FindCustomerById({id});
            return FormateData(existingCustomer);
            
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async GetShopingDetails(id){

        try {
            const existingCustomer = await this.repository.FindCustomerById({id});
    
            if(existingCustomer){
               return FormateData(existingCustomer);
            }       
            return FormateData({ msg: 'Error'});
            
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async GetWishList(customerId){

        try {
            const wishListItems = await this.repository.Wishlist(customerId);
            return FormateData(wishListItems);
        } catch (err) {
            throw new APIError('Data Not found', err)           
        }
    }

    async AddToWishlist(customerId, product){
        try {
            const wishlistResult = await this.repository.AddWishlistItem(customerId, product);        
           return FormateData(wishlistResult);
    
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async ManageCart(customerId, product, qty, isRemove){
        try {
            const cartResult = await this.repository.AddCartItem(customerId, product, qty, isRemove);        
            return FormateData(cartResult);
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async ManageOrder(customerId, order){
        try {
            console.log(customerId)
            console.log(order)
            const orderResult = await this.repository.AddOrderToProfile(customerId, order);
            return FormateData(orderResult);
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async SubscribeEvents(payload) {
        console.log("Raw Payload:", payload);
    
        try {
            payload = JSON.parse(payload);
        } catch (error) {
            console.error("JSON Parsing Error:", error);
            return;
        }
    
        console.log("\nParsed Payload:", payload);
    
        if (!payload || typeof payload !== "object") {
            console.error("Invalid payload:", payload);
            return;
        }
    
        // Check if the payload follows the nested structure (CREATE_ORDER) or flat structure
        let event, data;
    
        if (payload.data && payload.data.event) {
            // Nested structure (CREATE_ORDER)
            event = payload.data.event;
            data = payload.data.data;
        } else {
            // Flat structure (other events)
            event = payload.event;
            data = payload.data;
        }
    
        console.log("Extracted Event:", event);
        console.log("Extracted Data:", data);
    
        if (!event || !data || typeof data !== "object") {
            console.error("Malformed event data:", payload);
            return;
        }
    
        let userId, order, product, qty;
    
        switch (event) {
            case "CREATE_ORDER":
                ({ userId, order } = data || {}); 
                if (!userId || !order) {
                    console.error("Invalid CREATE_ORDER data:", data);
                    return;
                }
                console.log("Order received:", userId, order);
                await this.ManageOrder(userId, order);
                break;
    
            case "ADD_TO_WISHLIST":
            case "REMOVE_FROM_WISHLIST":
                ({ userId, product } = data || {}); 
                if (!userId || !product) {
                    console.error(`Invalid ${event} data:`, data);
                    return;
                }
                console.log(`Processing ${event} for user:`, userId, "Product:", product);
                await this.AddToWishlist(userId, product);
                break;
    
            case "ADD_TO_CART":
            case "REMOVE_FROM_CART":
                ({ userId, product, qty } = data || {});
                if (!userId || !product || qty === undefined) {
                    console.error(`Invalid ${event} data:`, data);
                    return;
                }
                console.log(`Processing ${event} for user:`, userId, "Product:", product, "Qty:", qty);
                await this.ManageCart(userId, product, qty, event === "REMOVE_FROM_CART");
                break;
    
            default:
                console.log("Unhandled event:", event);
                break;
        }
    }
    
}
module.exports = CustomerService;