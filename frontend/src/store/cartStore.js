import { create } from 'zustand'

function createCartItem(product) {
  return {
    cart_item_id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_id: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    quantity: 1,
    note: '',
  }
}

const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product) => {
    set({
      items: [...get().items, createCartItem(product)],
    })
  },

  removeItem: (product_id) => {
    const items = get().items
    const lastIndex = items.map((item) => item.product_id).lastIndexOf(product_id)

    if (lastIndex === -1) return

    set({
      items: items.filter((_, index) => index !== lastIndex),
    })
  },

  deleteItem: (cart_item_id) => {
    set({
      items: get().items.filter((item) => item.cart_item_id !== cart_item_id),
    })
  },

  updateNote: (cart_item_id, note) => {
    set({
      items: get().items.map((item) =>
        item.cart_item_id === cart_item_id ? { ...item, note } : item
      ),
    })
  },

  updateNode: (cart_item_id, note) => {
    get().updateNote(cart_item_id, note)
  },

  clearCart: () => set({ items: [] }),

  totalItems: () => get().items.length,
  totalPrice: () => get().items.reduce((sum, item) => sum + Number(item.price || 0), 0),
}))

export default useCartStore
