export function otpTemplate(otp: string) {
  return {
    text: `Hello from Fugal Labs!\n\nYour One-Time Password (OTP) is: ${otp}\n\nThis code is valid for 5 minutes. Please do not share this code with anyone.\n\nIf you did not request this, please ignore this email.\n\nThank you,\nThe Fugal Labs Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Fugal Labs Verification</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <p style="font-size: 1.5em; font-weight: bold; color: #3182ce; letter-spacing: 2px;">${otp}</p>
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p style="color: #e53e3e;">Do not share this code with anyone.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
        <p style="font-size: 0.95em; color: #718096;">If you did not request this OTP, you can safely ignore this email.</p>
        <p style="margin-top: 24px;">Thank you,<br/>The Fugal Labs Team</p>
      </div>
    `,
  };
}
