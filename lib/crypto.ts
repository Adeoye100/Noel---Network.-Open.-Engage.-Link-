// End-to-end encryption utilities using Web Crypto API
export class CryptoService {
  private static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    )
  }

  static async generateKeys(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await this.generateKeyPair()

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)

    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey),
    }
  }

  static async encryptMessage(message: string, publicKeyBase64: string): Promise<string> {
    const publicKey = await this.importPublicKey(publicKeyBase64)
    const encoded = new TextEncoder().encode(message)

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      encoded,
    )

    return this.arrayBufferToBase64(encrypted)
  }

  static async decryptMessage(encryptedMessage: string, privateKeyBase64: string): Promise<string> {
    const privateKey = await this.importPrivateKey(privateKeyBase64)
    const encrypted = this.base64ToArrayBuffer(encryptedMessage)

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encrypted,
    )

    return new TextDecoder().decode(decrypted)
  }

  private static async importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64)
    return await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    )
  }

  private static async importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
    const privateKeyBuffer = this.base64ToArrayBuffer(privateKeyBase64)
    return await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"],
    )
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}
