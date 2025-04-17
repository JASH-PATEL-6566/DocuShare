export interface User {
  userId: string
  email: string
  passwordHash: string
  subscriptionId: string
  subscriptionExpiry?: string
  createdAt: string
  updatedAt: string
}

export interface UserCreateInput {
  email: string
  password: string
}

export interface UserUpdateInput {
  email?: string
  password?: string
  subscriptionId?: string
  subscriptionExpiry?: string
}

export interface UserResponse {
  userId: string
  email: string
  subscriptionId: string
  subscriptionExpiry?: string
  createdAt: string
  updatedAt: string
}
