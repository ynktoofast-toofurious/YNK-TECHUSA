import { createContext, useContext, useState } from 'react'

const AccessContext = createContext(null)

export function AccessProvider({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem('ynk_access') === '1'
  )

  const unlock = () => {
    sessionStorage.setItem('ynk_access', '1')
    setIsUnlocked(true)
  }

  const lock = () => {
    sessionStorage.removeItem('ynk_access')
    setIsUnlocked(false)
  }

  return (
    <AccessContext.Provider value={{ isUnlocked, unlock, lock }}>
      {children}
    </AccessContext.Provider>
  )
}

export function useAccess() {
  return useContext(AccessContext)
}
