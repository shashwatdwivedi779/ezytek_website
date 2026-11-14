const nodemailer = require("nodemailer");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOTP(email, otp) {

const companyName = "EZYTEK Pvt. Limited"

    await transporter.sendMail({
        from: `"${companyName}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Email Verification OTP",

        html: `
            <h2>Email Verification</h2>
            <p>Your verification OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP expires in 5 minutes.</p>
        `
    });
}
function generateOTP() {
    return crypto
        .randomInt(0, 1000000)
        .toString()
        .padStart(6, "0");
}

function hashOTP(otp) {
    const secret = process.env.OTP_SECRET || "ezytek_default_otp_secret_2026";
    return crypto
        .createHmac("sha256", secret)
        .update(String(otp))
        .digest("hex");
}

function verifyOTP(enteredOTP, storedHash) {

    const enteredHash = hashOTP(enteredOTP);

    const a = Buffer.from(enteredHash, "hex");
    const b = Buffer.from(storedHash, "hex");

    return a.length === b.length &&
        crypto.timingSafeEqual(a, b);

}


module.exports = {
    generateOTP,
    hashOTP,
    sendOTP,
    verifyOTP
};
