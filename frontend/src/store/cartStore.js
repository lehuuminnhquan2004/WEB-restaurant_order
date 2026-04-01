import {create} from 'zustand'

const useCartStore=create((set,get)=>({
    items:[],

    addItem: (product)=>{
        const items=get().items
        const existing=items.find((i)=>i.product_id===product.id)

        if(existing){
            set({
                items: items.map((i)=>
                i.product_id===product.id
                ? {...i,quantity: i.quantity+1}
                :i
                ),
            })
        }else{
            set({
                items: [
                    ...items,
                    {
                        product_id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        note:'',
                    },
                ],
            })
        }
    },

    removeItem: (product_id)=>{
        const items=get().items
        const existing = items.find((i)=>i.product_id===product_id)

        if(!existing) return

        if(existing.quantity===1){
            set({items: items.filter((i)=>i.product_id!==product_id) })
        }else{
            set({
                items: items.map((i)=>
                i.product_id===product_id ? {...i,quantity: i.quantity-1}:i
                ),
            })
        }
    },

    deleteItem: (product_id)=>{
        set({items:get().items.filter((i)=>i.product_id!==product_id)})
    },

    updateNote: (product_id,note)=>{
        set({
            items:get().items.map((i)=>
            i.product_id===product_id ? {...i,note}:i),
        })
    },

    updateNode: (product_id,note)=>{
        get().updateNote(product_id, note)
    },

    clearCart: () => set({ items: [] }),

    totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}))

export default useCartStore
