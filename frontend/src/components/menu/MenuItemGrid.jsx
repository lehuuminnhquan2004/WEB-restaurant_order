/**
 * MenuItemGrid — shared grid với search + category filter
 *
 * Props:
 *   items      : MenuItem[]
 *   mode       : "admin" | "order"
 *   loading    : boolean
 *
 *   --- admin mode ---
 *   onEdit     : (item) => void
 *   onDelete   : (item) => void
 *   onToggle   : (item) => void
 *
 *   --- order mode ---
 *   cart       : { [itemId]: quantity }
 *   onAdd      : (item) => void
 *   onRemove   : (item) => void
 */

import { useState, useMemo } from "react";
import MenuItemCard from "./MenuItemCard";
import "./MenuItemGrid.css";

const ALL = "Tất cả";

export default function MenuItemGrid({
  items = [],
  mode = "admin",
  loading = false,
  // admin
  onEdit,
  onDelete,
  onToggle,
  // order
  cart = {},
  onAdd,
  onRemove,
}) {
  const [search, setSearch]   = useState("");
  const [category, setCategory] = useState(ALL);

  /* derive category list */
  const categories = useMemo(() => {
    const cats = [...new Set(items.map((i) => i.category_name || i.category).filter(Boolean))];
    return [ALL, ...cats];
  }, [items]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const itemCategory = i.category_name || i.category;
      const matchCat  = category === ALL || itemCategory === category;
      const matchQ    = !q || i.name.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [items, search, category]);

  if (loading) {
    return (
      <div className="mig__empty">
        <div className="mig__empty-icon">⏳</div>
        <p>Đang tải danh sách món…</p>
      </div>
    );
  }

  return (
    <div className="mig">
      {/* search + filter */}
      <div className="mig__bar">
        <input
          className="mig__search"
          placeholder="🔍 Tìm món…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mig__cats">
        {categories.map((c) => (
          <button
            key={c}
            className={`mig__cat ${category === c ? "mig__cat--active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <span className="mig__count">{filtered.length} món</span>

      {filtered.length === 0 ? (
        <div className="mig__empty">
          <div className="mig__empty-icon">🍽️</div>
          <p>Không tìm thấy món nào.</p>
        </div>
      ) : (
        <div className="mig__grid">
          {filtered.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              mode={mode}
              /* admin */
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              /* order */
              quantity={cart[item.id] ?? 0}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
