import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import AdminOtp from "@/models/AdminOtp";
import { sendMail } from "@/lib/mail";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digit
}

export async function POST(req: Request) {
  await connectDB();

  try {
    const { identifier } = await req.json();

    if (!identifier)
      return NextResponse.json({ ok: false, error: "identifier required" });

    const admin = await Admin.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!admin)
      return NextResponse.json({ ok: false, error: "Admin not found" });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // remove previous OTPs
    await AdminOtp.deleteMany({ admin: admin._id });
    await AdminOtp.create({ admin: admin._id, code, expiresAt });

    // Professional Email Template (Emerald Theme)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #10b981 0%, #0f766e 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
          .content { padding: 40px 32px; text-align: center; color: #334155; }
          .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
          .text { font-size: 16px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
          .otp-wrapper { margin: 32px 0; }
          .otp-code { 
            background-color: #ecfdf5; 
            color: #047857; 
            font-size: 32px; 
            font-weight: 800; 
            letter-spacing: 8px; 
            padding: 16px 32px; 
            border-radius: 12px; 
            border: 2px dashed #10b981; 
            display: inline-block;
            font-family: 'Courier New', monospace;
          }
          .expiry { font-size: 13px; color: #94a3b8; margin-top: 24px; }
          .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          .footer p { margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SBM Admin</h1>
          </div>
          <div class="content">
            <div class="title">Login Verification</div>
            <p class="text">Hello <b>${admin.name}</b>,<br/>Use the secure code below to sign in to your dashboard.</p>
            
            <div class="otp-wrapper">
              <div class="otp-code">${code}</div>
            </div>

            <p class="text">This code is valid for <strong>10 minutes</strong>.<br/>Do not share this code with anyone.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Shuttering Business Manager</p>
            <p>Secure Automated System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendMail(
      admin.email,
      "🔐 SBM Login Verification Code",
      html
    );

    return NextResponse.json({
      ok: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: (err as Error).message,
    });
  }
}