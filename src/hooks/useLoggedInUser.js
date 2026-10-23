import { useState } from 'react'

function getStoredUser() {
  const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user')

  if (!storedUser) {
    return null
  }

  try {
    const user = JSON.parse(storedUser)

    if (user && typeof user.name === 'string' && user.name.trim()) {
      return user
    }

    console.error('Os dados do usuário armazenados são inválidos.')
  } catch (error) {
    console.error('Não foi possível ler os dados do usuário armazenados.', error)
  }

  return null
}

export default function useLoggedInUser() {
  const [user] = useState(getStoredUser)

  return user
}
