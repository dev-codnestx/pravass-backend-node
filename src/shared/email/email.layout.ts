/**
 * Wraps content in a premium HTML email layout
 * @param title - The title/heading of the email
 * @param content - The main HTML content
 * @returns {string} - Full HTML email
 */
export const baseEmailLayout = (title: string, content: string): string => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7f9;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          padding: 40px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px 30px;
          color: #334155;
          line-height: 1.6;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
          border-top: 1px solid #e2e8f0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 20px;
          transition: background-color 0.2s;
        }
        .message-box {
          background-color: #f1f5f9;
          border-left: 4px solid #007bff;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          font-style: italic;
          color: #475569;
        }
        .ticket-id {
          display: inline-block;
          background-color: #e0f2fe;
          color: #0369a1;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Pravass Journey. All rights reserved.</p>
          <p>Concierge Support Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
