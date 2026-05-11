/**
 * MenuItemCard — shared component
 *
 * Props:
 *   item          : { id, name, price, category_name, status }
 *   mode          : "admin" | "order"   (default: "admin")
 *
 *   --- admin mode ---
 *   onEdit        : (item) => void
 *   onDelete      : (item) => void
 *   onToggle      : (item) => void      toggleAvailable
 *
 *   --- order mode ---
 *   quantity      : number              số lượng đang trong cart (0 = chưa có)
 *   onAdd         : (item) => void      tăng 1
 *   onRemove      : (item) => void      giảm 1
 */

import "./MenuItemCard.css";
import { useState } from "react";

const CATEGORY_EMOJI = {
  "Khai vị":   "🥗",
  "Món chính": "🍲",
  "Tráng miệng": "🍮",
  "Đồ uống":   "🧋",
  "Bia & Rượu":"🍺",
};

function formatPrice(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default function MenuItemCard({
  item,
  mode = "admin",
  // admin
  onEdit,
  onDelete,
  onToggle,
  // order
  quantity = 0,
  onAdd,
  onRemove,
}) {
  const [imgError, setImgError] = useState(false);
  const categoryName = item.category_name || item.category;
  const inCart     = quantity > 0;
  const available  = item.status !== "unavailable";

  const emoji = CATEGORY_EMOJI[categoryName] || "🍽️";

  const cardClass = [
    "mic",
    !available         ? "mic--unavailable" : "",
    mode === "order" && inCart ? "mic--in-cart"      : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cardClass}>
      {/* image / placeholder */}
      <div className="mic__img-wrap">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            className="mic__img"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="mic__img-fallback">{emoji}</span>
        )}
      </div>

      {/* body */}
      <div className="mic__body">
        <p className="mic__category">{categoryName || "Chưa phân loại"}</p>
        <h3 className="mic__name">{item.name}</h3>
        <div className="mic__price">{formatPrice(item.price)}</div>
      </div>

      {/* footer */}
      <div className="mic__footer">
        {mode === "admin" && (
          <>
            <button
              className={`mic-btn ${available ? "mic-btn--toggle-on" : "mic-btn--toggle-off"}`}
              onClick={() => onToggle?.(item)}
              title={available ? "Đang có — nhấn để ẩn" : "Đang ẩn — nhấn để hiện"}
            >
              {available ? "✅ Có sẵn" : "❌ Hết món"}
            </button>
            <button className="mic-btn mic-btn--ghost" onClick={() => onEdit?.(item)}>
              ✏️ Sửa
            </button>
            <button className="mic-btn mic-btn--danger" onClick={() => onDelete?.(item)}>
              🗑️
            </button>
          </>
        )}

        {mode === "order" && (
          <>
            {inCart ? (
              <div className="mic__qty">
                <button
                  className="mic__qty-btn"
                  onClick={() => onRemove?.(item)}
                  aria-label="Giảm"
                >−</button>
                <span className="mic__qty-num">{quantity}</span>
                <button
                  className="mic__qty-btn"
                  onClick={() => onAdd?.(item)}
                  disabled={!available}
                  aria-label="Tăng"
                >+</button>
                <span className="mic__qty-label">đã chọn</span>
              </div>
            ) : (
              <button
                className="mic-btn mic-btn--ghost"
                style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
                onClick={() => onAdd?.(item)}
                disabled={!available}
              >
                {available ? "+ Thêm vào order" : "Hết món"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
