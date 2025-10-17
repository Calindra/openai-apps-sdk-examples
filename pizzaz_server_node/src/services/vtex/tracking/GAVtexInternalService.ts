export default class GAVtexInternalService {
  static addItemToCart(item: any, cart: any) {
    console.log('GAVtexInternalService.addItemToCart', item, cart);
  }

  static removeItemFromCart(index: number, cart: any) {
    console.log('GAVtexInternalService.removeItemFromCart', index, cart);
  }

  static purchase(cart: any, orderId: string) {
    console.log('GAVtexInternalService.purchase', cart, orderId);
  }

  static addPaymentInfo(data: any) {
    console.log('GAVtexInternalService.addPaymentInfo', data);
  }

  static addShippingInfo(data: any) {
    console.log('GAVtexInternalService.addShippingInfo', data);
  }
}