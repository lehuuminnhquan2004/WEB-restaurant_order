import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import tableApi from '../../api/tableApi'
import useTableStore from '../../store/tableStore'
import useCartStore from '../../store/cartStore'

function TableVerifyPage(){
    const {token} =useParams()
    const navigate=useNavigate()
    const {setTable}=useTableStore()
    const {clearCart}=useCartStore()
    const [hasError, setHasError] = useState(false)

    useEffect(()=>{
        if (!token) {
            return
        }

        async function verify() {
            try{
                const res = await tableApi.verify(token)
                const { table } = res.data

                const currentToken=useTableStore.getState().tableToken
                if(currentToken&&currentToken!==token){
                    clearCart()
                }

                setTable(table.id, table.name, table.token ?? token)
                navigate('/home',{replace: true})
            }catch{
                setHasError(true)
            }
        }

        verify()

    },[clearCart, navigate, setTable, token])

    if (!token || hasError) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
                    <h1 className="mb-2 text-lg font-semibold text-red-600">Khong the xac thuc ban</h1>
                    <p className="text-sm text-gray-600">
                        Ma QR khong hop le hoac da het han. Vui long lien he nhan vien de duoc ho tro.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-sm">Đang xác thực bàn...</p>
        </div>
    )
}

export default TableVerifyPage
