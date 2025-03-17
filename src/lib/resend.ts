import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPurchaseConfirmation = async ({
  email,
  gridId,
  subscriptionId,
  amount,
  renewalDate,
  gridLocation,
}: {
  email: string;
  gridId: string;
  subscriptionId: string;
  amount: number;
  renewalDate: Date;
  gridLocation: string;
}) => {
  const editPortalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/grid/${gridId}`;

  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: 'Your Grid Purchase Confirmation',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .details { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            .button { 
              display: inline-block;
              padding: 10px 20px;
              background-color: #4f46e5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank you for your purchase!</h1>
            </div>

            <div class="section">
              <h2>Grid Details</h2>
              <div class="details">
                <p><strong>Grid ID:</strong> ${gridId}</p>
                <p><strong>Location:</strong> ${gridLocation}</p>
                <p><strong>Monthly Price:</strong> $${(amount / 100).toFixed(2)}</p>
              </div>
            </div>

            <div class="section">
              <h2>Subscription Details</h2>
              <div class="details">
                <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                <p><strong>Renewal Date:</strong> ${renewalDate.toLocaleDateString()}</p>
              </div>
            </div>

            <div class="section">
              <h2>Edit Your Grid Content</h2>
              <div class="details">
                <p>To edit your grid content:</p>
                <ol>
                  <li>Visit your grid page</li>
                  <li>Click the "Edit" button on your grid</li>
                  <li>You'll need:
                    <ul>
                      <li>Subscription ID: ${subscriptionId}</li>
                      <li>Purchase Email: ${email}</li>
                    </ul>
                  </li>
                </ol>
                <a href="${editPortalUrl}" class="button">Edit Your Grid</a>
              </div>
            </div>

            <div class="section">
              <p>Need help? Contact our support team at support@yourdomain.com</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}; 