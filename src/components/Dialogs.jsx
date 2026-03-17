import { useState, useEffect, useCallback } from 'react';

/**
 * ConfirmDialog — Pretty replacement for window.confirm / window.alert.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={true}
 *     title="删除商品"
 *     message="确定要删除这个商品吗？"
 *     confirmText="删除"
 *     cancelText="取消"
 *     danger={true}
 *     onConfirm={() => ...}
 *     onCancel={() => ...}
 *   />
 */
export function ConfirmDialog({ open, title, message, confirmText = '确定', cancelText = '取消', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog modal-dialog--sm" onClick={e => e.stopPropagation()}>
        {title && <h3 className="modal-dialog__title">{title}</h3>}
        {message && <p className="modal-dialog__message">{message}</p>}
        <div className="modal-dialog__actions">
          <button className="btn btn--ghost" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * ProductEditModal — Edit / delete custom products.
 *
 * Usage:
 *   <ProductEditModal
 *     open={true}
 *     product={{ id, name, emoji }}
 *     onSave={(name, emoji) => ...}
 *     onDelete={() => ...}
 *     onClose={() => ...}
 *   />
 */
export function ProductEditModal({ open, product, onSave, onDelete, onClose }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setEmoji(product.emoji || '🛒');
      setConfirmDelete(false);
    }
  }, [product]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || !product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="modal-dialog__title">编辑商品</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>图标</label>
            <input
              type="text"
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              style={{
                width: '60px', textAlign: 'center', fontSize: '1.5rem',
                padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)', background: 'var(--bg-input)',
                color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              style={{
                width: '100%', padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)', background: 'var(--bg-input)',
                color: 'var(--text-primary)', fontSize: 'var(--font-size-base)',
                outline: 'none', fontFamily: 'var(--font-family)',
              }}
            />
          </div>
        </div>

        <div className="modal-dialog__actions" style={{ marginTop: 'var(--space-lg)' }}>
          {!confirmDelete ? (
            <>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => setConfirmDelete(true)}
                style={{ marginRight: 'auto' }}
              >🗑️ 删除</button>
              <button className="btn btn--ghost" onClick={onClose}>取消</button>
              <button
                className="btn btn--primary"
                onClick={() => { if (name.trim()) onSave(name.trim(), emoji.trim() || '🛒'); }}
                disabled={!name.trim()}
              >保存</button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>确定删除吗？</span>
              <button className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(false)}>取消</button>
              <button className="btn btn--danger btn--sm" onClick={onDelete}>确认删除</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * useConfirm — hook providing a promise-based confirm dialog
 * Returns [ConfirmDialogNode, confirm(opts) => Promise<boolean>]
 */
export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((opts) => {
    return new Promise(resolve => {
      setState({
        ...opts,
        onConfirm: () => { setState(null); resolve(true); },
        onCancel: () => { setState(null); resolve(false); },
      });
    });
  }, []);

  const node = state ? <ConfirmDialog open={true} {...state} /> : null;
  return [node, confirm];
}
