import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPurchaseConfirmation = async ({
  email,
  gridId,
  subscriptionId,
  amount,
  renewalDate,
}: {
  email: string;
  gridId: string;
  subscriptionId: string;
  amount: number;
  renewalDate: Date;
}) => {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: 'Your Grid Purchase Confirmation',
    html: `
      <h1>Thank you for your purchase!</h1>
      
      <h2>Grid Details:</h2>
      <ul>
        <li>Grid ID: ${gridId}</li>
        <li>Monthly Price: $${amount / 100}</li>
      </ul>

      <h2>To edit your grid content:</h2>
      <ol>
        <li>Click the "Edit" button on your grid</li>
        <li>Enter your:
          <ul>
            <li>Subscription ID: ${subscriptionId}</li>
            <li>Purchase Email: ${email}</li>
          </ul>
        </li>
        <li>Make your desired changes</li>
        <li>Save to update your grid</li>
      </ol>

      <p>Your subscription will renew on ${renewalDate.toLocaleDateString()}.</p>

      <p>Need help? Contact support@yourdomain.com</p>
    `,
  });
}; 