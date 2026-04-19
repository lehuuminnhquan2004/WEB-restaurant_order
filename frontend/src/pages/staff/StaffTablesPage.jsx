import { useCallback, useEffect, useState } from 'react'
import OrdersViewerModal from '../../components/orders/OrdersViewerModal'
import orderApi from '../../api/orderApi'
import productApi from '../../api/productApi'
import tableApi from '../../api/tableApi'
import StaffAddItemsModal from '../../components/staff/StaffAddItemsModal'
import TableCard from '../../components/tables/TableCard'
import '../../pages/admin/AdminMenuPage.css'
import '../../pages/admin/AdminTablesPage.css'
import './StaffBase.css'
import './StaffTablesPage.css'

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Khong the xu ly yeu cau.'
  )
}

export default function StaffTablesPage() {
  const [tables, setTables] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedTable, setSelectedTable] = useState(null)
  const [modalMode, setModalMode] = useState('')
  const [activeOrders, setActiveOrders] = useState([])
  const [cart, setCart] = useState({})
  const [modalLoading, setModalLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [removingItemKey, setRemovingItemKey] = useState('')

  const fetchTables = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [tablesRes, productsRes] = await Promise.all([
        tableApi.getAll(),
        productApi.getAll({ status: 'available' }),
      ])

      setTables(tablesRes.data)
      setProducts(productsRes.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  async function openTableModal(table, nextMode) {
    setSelectedTable(table)
    setModalMode(nextMode)
    setCart({})
    setModalLoading(true)
    setError('')

    try {
      const response = await orderApi.getByTable(table.id)
      setActiveOrders(response.data)
    } catch (modalError) {
      setError(getErrorMessage(modalError))
      setActiveOrders([])
    } finally {
      setModalLoading(false)
    }
  }

  async function refreshSelectedTableOrders(table = selectedTable) {
    if (!table) return

    const response = await orderApi.getByTable(table.id)
    setActiveOrders(response.data)
  }

  function handleAdd(product) {
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }))
  }

  function handleRemove(product) {
    setCart((prev) => {
      const nextQty = (prev[product.id] || 0) - 1
      if (nextQty <= 0) {
        const { [product.id]: _removed, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        [product.id]: nextQty,
      }
    })
  }

  async function handleSubmitExtraOrder() {
    if (!selectedTable) return

    const items = Object.entries(cart).map(([productId, quantity]) => ({
      product_id: Number(productId),
      quantity,
      note: '',
    }))

    if (items.length === 0) return

    setSubmitting(true)
    setError('')

    try {
      await orderApi.create({
        table_id: selectedTable.id,
        items,
      })

      setSuccess(`Da them mon cho ${selectedTable.name}.`)
      setSelectedTable(null)
      setModalMode('')
      setCart({})
      setActiveOrders([])
      await fetchTables()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveOrderItem(item) {
    if (!selectedTable) return

    const confirmed = window.confirm(
      `Xac nhan xoa mon "${item.product_name}" khoi ${selectedTable.name}?`
    )

    if (!confirmed) return

    const itemKey = `${item.order_id}-${item.id}`
    setRemovingItemKey(itemKey)
    setError('')

    try {
      await orderApi.removeItem(item.order_id, item.id)
      setSuccess(`Da xoa mon "${item.product_name}" khoi ${selectedTable.name}.`)
      await refreshSelectedTableOrders(selectedTable)
      await fetchTables()
    } catch (removeError) {
      setError(getErrorMessage(removeError))
    } finally {
      setRemovingItemKey('')
    }
  }

  async function handleConfirmPaid(orders) {
    if (!selectedTable || !orders.length) return

    const confirmed = window.confirm(
      `Xac nhan da thanh toan toan bo cac don chua tra tien cua ${selectedTable.name}?`
    )

    if (!confirmed) return

    setSubmitting(true)
    setError('')

    try {
      for (const order of orders) {
        await orderApi.updateStatus(order.id, 'paid')
      }

      setSuccess(`Da xac nhan thanh toan cho ${selectedTable.name}.`)
      await refreshSelectedTableOrders(selectedTable)
      await fetchTables()
    } catch (paymentError) {
      setError(getErrorMessage(paymentError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Quan ly ban</h1>
          <p className="sp-subtitle">Xem QR, reset ban va tao them order moi cho ban dang phuc vu.</p>
        </div>

        <button className="btn btn-ghost" onClick={fetchTables} disabled={loading}>
          {loading ? 'Dang tai...' : 'Lam moi'}
        </button>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {success && <div className="amp-feedback amp-feedback--success">{success}</div>}

      {loading ? (
        <div className="sp-empty">Dang tai danh sach ban...</div>
      ) : tables.length === 0 ? (
        <div className="sp-empty">Chua co ban nao trong he thong.</div>
      ) : (
        <div className="sp-table-grid">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onRefresh={async (message) => {
                if (message) {
                  setSuccess(message)
                }
                await fetchTables()
              }}
              allowRename={false}
              allowDelete={false}
              allowReset
              allowShowQr
              extraActions={
                <>
                  <button
                    className="table-card__btn table-card__btn--primary"
                    onClick={() => openTableModal(table, 'add')}
                  >
                    Them mon
                  </button>
                  <button
                    className="table-card__btn table-card__btn--ghost"
                    onClick={() => openTableModal(table, 'orders')}
                  >
                    Xem don
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      {selectedTable && (
        modalLoading ? (
          <div className="amp-modal-backdrop">
            <div className="amp-modal sp-modal">
              <div className="sp-empty">Dang tai du lieu cua ban...</div>
            </div>
          </div>
        ) : modalMode === 'orders' ? (
          <OrdersViewerModal
            title={`Don cua ${selectedTable.name}`}
            subtitle="Theo doi cac don dang mo va mon da goi tai ban nay."
            tableName={selectedTable.name}
            orders={activeOrders}
            actionLabel="Xac nhan da thanh toan"
            onAction={handleConfirmPaid}
            isActionDisabled={(orders) =>
              submitting ||
              orders.length === 0 ||
              orders.some((order) =>
                (order.items || []).some((item) => item.status !== 'served')
              )
            }
            onRemoveItem={handleRemoveOrderItem}
            isRemoveDisabled={(item) =>
              submitting ||
              ['preparing', 'done', 'paid'].includes(item.order_status) ||
              removingItemKey === `${item.order_id}-${item.id}`
            }
            removingItemKey={removingItemKey}
            onClose={() => {
              setSelectedTable(null)
              setModalMode('')
              setCart({})
              setActiveOrders([])
            }}
          />
        ) : (
          <StaffAddItemsModal
            table={selectedTable}
            products={products}
            activeOrders={activeOrders}
            cart={cart}
            busy={submitting}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onSubmit={handleSubmitExtraOrder}
            onClose={() => {
              setSelectedTable(null)
              setModalMode('')
              setCart({})
              setActiveOrders([])
            }}
          />
        )
      )}
    </div>
  )
}
