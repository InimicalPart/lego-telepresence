import crypto from "crypto"
export async function generateRandomHex(length: number): Promise<string> {
    if (length % 2 != 0) {
        throw new Error("Length must be divisible by 2")
    }
    return crypto.randomBytes(length).toString("hex")
}