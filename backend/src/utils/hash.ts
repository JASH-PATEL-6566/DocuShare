import bcrypt from "bcryptjs"

const SALT_ROUNDS = 10

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hash = await bcrypt.hash(password, salt)
    return hash
  } catch (error) {
    console.error("Error hashing password:", error)
    throw error
  }
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error("Error comparing password:", error)
    throw error
  }
}
