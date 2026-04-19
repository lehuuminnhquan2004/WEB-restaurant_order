import {create} from 'zustand'
import {persist} from 'zustand/middleware'
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function isTokenExpired(token){
    if(!token) return true
    try{
        const payload=parseJwt(token)
        if(!payload||!payload.exp) return true

        return payload.exp *1000 <= Date.now()
    }catch{
        return true
    }
}

const useAuthStore = create(
    persist(
        (set)=>({
            token: null,
            user: null,

            setAuth:(token,user)=>set({token,user}),

            logout: () =>set({token: null, user: null}),

            isLoggedIn:()=>{
                const state=useAuthStore.getState()
                return !!state.token && !isTokenExpired(state.token)
            },
        }),
        {
            name: 'auth-storage',
        }
    )
)

export default useAuthStore