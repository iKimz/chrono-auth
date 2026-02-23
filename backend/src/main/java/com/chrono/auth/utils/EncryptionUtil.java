package com.chrono.auth.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES";

    // Spring injects the value but to use it statically in the JPA converter
    // we need a bridge or provide access.
    private static String key;

    @Value("${app.encryption.key}")
    public void setKey(String encryptionKey) {
        // Pad or truncate key to exactly 32 bytes (256-bit) if needed
        if (encryptionKey.length() < 32) {
            encryptionKey = String.format("%1$-32s", encryptionKey).replace(' ', '0');
        } else if (encryptionKey.length() > 32) {
            encryptionKey = encryptionKey.substring(0, 32);
        }
        EncryptionUtil.key = encryptionKey;
    }

    public static String encrypt(String value) {
        if (value == null)
            return null;
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            byte[] encryptedBytes = cipher.doFinal(value.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting string", e);
        }
    }

    public static String decrypt(String encryptedValue) {
        if (encryptedValue == null)
            return null;
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedValue));
            return new String(decryptedBytes);
        } catch (Exception e) {
            // Fallback for unencrypted legacy rows if migrating existing DB
            return encryptedValue;
        }
    }
}
