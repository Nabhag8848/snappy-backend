import {stripe} from '../payment/payment.js';


export async function createSubscription(priceId, customerId){

    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
  
      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent
      };
}