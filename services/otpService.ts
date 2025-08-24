
const OTP_STORE_KEY = 'nids_xai_otp_store';
const OTP_EXPIRATION_MINUTES = 5;

// Simulate a backend OTP store using localStorage
const getOtpStore = (): Record<string, { otp: string; expires: number }> => {
    const storeJSON = localStorage.getItem(OTP_STORE_KEY);
    return storeJSON ? JSON.parse(storeJSON) : {};
};

const saveOtpStore = (store: Record<string, { otp: string; expires: number }>) => {
    localStorage.setItem(OTP_STORE_KEY, JSON.stringify(store));
};

export const otpService = {
    async generateOtp(email: string): Promise<void> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000;
        const store = getOtpStore();
        store[email] = { otp, expires };
        saveOtpStore(store);
        // In a real app, this would trigger an email or SMS.
    },

    async verifyOtp(email: string, otp: string): Promise<boolean> {
        const store = getOtpStore();
        const record = store[email];

        if (!record) {
            return false; // No OTP requested for this email
        }

        if (Date.now() > record.expires) {
            delete store[email]; // Clean up expired OTP
            saveOtpStore(store);
            return false; // OTP has expired
        }

        if (record.otp === otp) {
            delete store[email]; // OTP is single-use, delete after verification
            saveOtpStore(store);
            return true; // Success
        }

        return false; // Invalid OTP
    },

    // This function is for development/demo purposes only to display the OTP.
    // It would NOT exist in a production environment.
    async getOtpForEmail(email: string): Promise<string | null> {
        const store = getOtpStore();
        const record = store[email];
        if (record && Date.now() < record.expires) {
            return record.otp;
        }
        return null;
    }
};
