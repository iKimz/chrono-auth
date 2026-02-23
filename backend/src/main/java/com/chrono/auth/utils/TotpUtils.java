package com.chrono.auth.utils;

import org.apache.commons.codec.binary.Base32;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

public class TotpUtils {

    private static final int[] DIGITS_POWER = { 1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000 };

    public static String generateTOTP(String key, String time, String returnDigits) {
        int codeDigits = Integer.parseInt(returnDigits);
        String result = null;

        while (time.length() < 16) {
            time = "0" + time;
        }

        byte[] msg = hexStr2Bytes(time);
        byte[] k = new Base32().decode(key);

        byte[] hash = hmac_sha("HmacSHA1", k, msg);

        int offset = hash[hash.length - 1] & 0xf;
        int binary = ((hash[offset] & 0x7f) << 24) |
                ((hash[offset + 1] & 0xff) << 16) |
                ((hash[offset + 2] & 0xff) << 8) |
                (hash[offset + 3] & 0xff);

        int otp = binary % DIGITS_POWER[codeDigits];

        result = Integer.toString(otp);
        while (result.length() < codeDigits) {
            result = "0" + result;
        }
        return result;
    }

    public static String getTOTPCode(String secretKey) {
        long timeWindow = System.currentTimeMillis() / 30000L;
        String timeStr = Long.toHexString(timeWindow).toUpperCase();
        return generateTOTP(secretKey, timeStr, "6");
    }

    private static byte[] hmac_sha(String crypto, byte[] keyBytes, byte[] text) {
        try {
            Mac hmac = Mac.getInstance(crypto);
            SecretKeySpec macKey = new SecretKeySpec(keyBytes, "RAW");
            hmac.init(macKey);
            return hmac.doFinal(text);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException(e);
        }
    }

    private static byte[] hexStr2Bytes(String hex) {
        byte[] bArray = new byte[hex.length() / 2];
        for (int i = 0; i < bArray.length; i++) {
            bArray[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        return bArray;
    }

    public static boolean isValidSecret(String secret) {
        try {
            new Base32().decode(secret);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
