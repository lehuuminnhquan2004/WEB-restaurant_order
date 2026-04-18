import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Lưu thông tin bàn sau khi khách quét QR và verify token thành công.
 * Dùng persist để khách F5 không mất phiên.
 */
const useTableStore = create(
  persist(
    (set) => ({
      tableId: null,
      tableName: null,
      tableToken: null, // token từ URL QR code

      setTable: (tableId, tableName, tableToken) =>
        set({ tableId, tableName, tableToken }),

      clearTable: () =>
        set({ tableId: null, tableName: null, tableToken: null }),
    }),
    
    {
      name: 'table-storage', // key trong localStorage
    }
  )
)

export default useTableStore