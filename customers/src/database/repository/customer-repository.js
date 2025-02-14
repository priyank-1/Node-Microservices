const { CustomerModel, AddressModel } = require("../models");
const {
  APIError,
  BadRequestError,
  STATUS_CODES,
} = require("../../utils/app-errors");

//Dealing with data base operations
class CustomerRepository {
  async CreateCustomer({ email, password, phone, salt }) {
    try {
      const customer = new CustomerModel({
        email,
        password,
        salt,
        phone,
        address: [],
      });
      const customerResult = await customer.save();
      return customerResult;
    } catch (err) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to Create Customer"
      );
    }
  }

  async CreateAddress({ _id, street, postalCode, city, country }) {
    try {
      const profile = await CustomerModel.findById(_id);

      if (profile) {
        const newAddress = new AddressModel({
          street,
          postalCode,
          city,
          country,
        });

        await newAddress.save();

        profile.address.push(newAddress);
      }

      return await profile.save();
    } catch (err) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Error on Create Address"
      );
    }
  }

  async FindCustomer({ email }) {
    try {
      const existingCustomer = await CustomerModel.findOne({ email: email });
      return existingCustomer;
    } catch (err) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to Find Customer"
      );
    }
  }

  async FindCustomerById({ id }) {
    try {
      const existingCustomer = await CustomerModel.findById(id)
        .populate("address")
      return existingCustomer;
    } catch (err) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to Find Customer"
      );
    }
  }

  async Wishlist(customerId) {
    try {
      const profile = await CustomerModel.findById(customerId).populate(
        "wishlist"
      );

      return profile.wishlist;
    } catch (err) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to Get Wishlist "
      );
    }
  }

  async AddWishlistItem(customerId, {_id,name,desc,price,available,banner}) {
    const product = {
      _id,name,desc,price,available,banner
    }
    
    try {
      const profile = await CustomerModel.findById(customerId).populate(
        "wishlist"
      );

      if (profile) {
        let wishlist = profile.wishlist;

        if (wishlist.length > 0) {
          let isExist = false;
          wishlist.map((item) => {
            if (item._id.toString() === product._id.toString()) {
              const index = wishlist.indexOf(item);
              wishlist.splice(index, 1);
              isExist = true;
            }
          });

          if (!isExist) {
            wishlist.push(product);
          }
        } else {
          wishlist.push(product);
        }

        profile.wishlist = wishlist;
      }

      const profileResult = await profile.save();

      return profileResult.wishlist;
    } catch (err) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to Add to WishList"
      );
    }
  }

  async AddCartItem(customerId, { _id, name, price, banner }, qty, isRemove) {
    try {
        const profile = await CustomerModel.findById(customerId).populate("cart");

        if (!profile) {
            throw new APIError(
                "API Error",
                STATUS_CODES.NOT_FOUND,
                "Customer not found!"
            );
        }

        if (!profile.cart) {
            profile.cart = []; // Initialize if undefined
        }

        const cartItem = {
            product: { _id, name, price, banner },
            unit: qty,
        };

        let cartItems = profile.cart;

        let itemIndex = cartItems.findIndex((item) => item.product._id.toString() === _id.toString());

        if (itemIndex !== -1) {
            if (isRemove) {
                cartItems.splice(itemIndex, 1); // Remove from cart
            } else {
                cartItems[itemIndex].unit = qty; // Update quantity
            }
        } else {
            cartItems.push(cartItem);
        }

        profile.cart = cartItems;

        const cartSaveResult = await profile.save();
        return cartSaveResult.cart;

    } catch (err) {
        throw new APIError(
            "API Error",
            STATUS_CODES.INTERNAL_ERROR,
            "Unable to Add to Cart"
        );
    }
}


async AddOrderToProfile(customerId, order){
 
  const profile = await CustomerModel.findById(customerId);

  if(profile){ 
      
      if(profile.orders == undefined){
          profile.orders = []
      }
      profile.orders.push(order);

      profile.cart = [];

      const profileResult = await profile.save();

      return profileResult;
  }
  
  throw new Error('Unable to add to order!');
}
}

module.exports = CustomerRepository;
