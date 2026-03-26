import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { verifyTable } from '../../api/tableApi'
import useTableStore from '../../store/tableStore'
import useCartStore from '../../store/cartStore'

function TableVerifyPage(){
    const {token} =useParams()
    const navigate=useNavigate()
    const {setTable}=useTableStore()
    const {clearCart}=useCartStore()

    useEffect(()=>{
        async function verify() {
            try{
                const res = await verifyTable(token)
                const {id,name}=res.data

                const currentToken=useTableStore.getState().tableToken
                if(currentToken&&currentToken!==token){
                    clearCart()
                }

                setTable(id, name, token)
                navigate('/menu',{replace: true})
            }catch(err){
                navigate('/invalid-table', { replace: true })
            }
        }

        verify()

    },[token])

    return (
        <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-sm">Đang xác thực bàn...</p>
        </div>
    )
}

export default TableVerifyPage