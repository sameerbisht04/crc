import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

export const razorpay = new Razorpay({ key_id, key_secret });

export async function createOrder(amountInPaise: number, receiptId: string) {
  return razorpay.orders.create({ amount: amountInPaise, currency: 'INR', receipt: receiptId });
}

export async function verifyPaymentSignature(_payload: unknown) {
  // TODO: Implement signature verification based on Razorpay docs
  return true;
}


