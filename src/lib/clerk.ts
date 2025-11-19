import { currentUser as clerkCurrentUser } from '@clerk/nextjs/server'

export async function getCurrentUser() {
  const user = await clerkCurrentUser()
  if (!user) return null
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || '',
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
  }
}

export { clerkCurrentUser as currentUser }
