const { CUSTOMER_BINDING_KEY } = require("../config");
const ShoppingService = require("../services/shopping-service");
const { Subscribe,PublishMessage } = require("../utils");
const UserAuth = require('./middlewares/auth'); 

module.exports = (app,channel) => {
    
    const service = new ShoppingService();
    Subscribe(channel,service);

    app.post('/order',UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        const { txnNumber } = req.body;


        try {
            const { data } = await service.PlaceOrder({_id, txnNumber});
            const payload = await service.GetOrderPayload(_id,data,'CREATE_ORDER');
            console.log(payload);
            // PublishCustomerEvent(payload);
            PublishMessage(channel,CUSTOMER_BINDING_KEY,JSON.stringify(payload))
            return res.status(200).json(data);
            
        } catch (err) {
            next(err)
        }

    });

    app.get('/orders',UserAuth, async (req,res,next) => {

        const { _id } = req.user;

        try {
            const { data } = await service.GetOrders(_id);
            return res.status(200).json(data.orders);
        } catch (err) {
            next(err);
        }

    });

    app.get('/orders/:id',UserAuth, async(req,res,next)=>{
        const {_id} = req.user;
        const {orderId} = req.params;
        try {
            
            const {data} = await service.GetOrderDetails(_id,orderId);
            return res.status(200).json(data);    
        } catch (err) {
            next(err)            
        }


    })
       
    
    app.get('/cart', UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        try {
            const { data } = await service.getCart({_id});
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });
}