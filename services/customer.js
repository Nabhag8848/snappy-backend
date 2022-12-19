import {stripe} from '../payment/payment.js';

export async function createCustomer(email, name){

    const customers = await stripe.customers.create({
        email: email,
        name: name,
    });

    
    return customers;
}

// {
//   "id": "cus_MyxjYa2msB0qcI",
//   "object": "customer",
//   "address": {
//     "city": "Brothers",
//     "country": "US",
//     "line1": "27 Fredrick Ave",
//     "line2": null,
//     "postal_code": "97712",
//     "state": "CA"
//   },
//   "balance": 0,
//   "created": 1671042972,
//   "currency": null,
//   "default_source": null,
//   "delinquent": false,
//   "description": null,
//   "discount": null,
//   "email": "developertwitterbot@gmail.com",
//   "invoice_prefix": "104DC81A",
//   "invoice_settings": {
//     "custom_fields": null,
//     "default_payment_method": null,
//     "footer": null,
//     "rendering_options": null
//   },
//   "livemode": false,
//   "metadata": {},
//   "name": "{{CUSTOMER_NAME}}",
//   "next_invoice_sequence": 1,
//   "phone": null,
//   "preferred_locales": [],
//   "shipping": {
//     "address": {
//       "city": "Brothers",
//       "country": "US",
//       "line1": "27 Fredrick Ave",
//       "line2": null,
//       "postal_code": "97712",
//       "state": "CA"
//     },
//     "name": "{{CUSTOMER_NAME}}",
//     "phone": null
//   },
//   "tax_exempt": "none",
//   "test_clock": null
// }