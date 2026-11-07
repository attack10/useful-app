'use client';

import { useState, useMemo, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { GripVertical } from 'lucide-react';
import {
  getShoppingItems,
  addShoppingItem,
  updateItemCounts,
  updateShoppingItem,
  deleteShoppingItem,
} from '@/app/actions/shopping';

type ShoppingItem = {
  id: string;
  name: string;
  requiredCount: number;
  currentCount: number;
  amazonUrl: string | null;
};

const STORAGE_KEY = 'shopping_item_order_v1';

let listeners: Array<() => void> = [];
function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

const orderStore = {
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    window.addEventListener('storage', listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
      window.removeEventListener('storage', listener);
    };
  },
  getSnapshot: () => {
    return localStorage.getItem(STORAGE_KEY) || '';
  },
  getServerSnapshot: () => '',
};

const getSavedOrder = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveOrder = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    emitChange();
  } catch (err) {
    console.error('Failed to save order to localStorage:', err);
  }
};

type ShoppingClientProps = {
  initialItems: ShoppingItem[];
};

export default function ShoppingClient({ initialItems }: ShoppingClientProps) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [requiredCount, setRequiredCount] = useState(1);
  const [currentCount, setCurrentCount] = useState(1);
  const [amazonUrl, setAmazonUrl] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ドラッグ＆ドロップ用の状態管理
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const draggingIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  // 画面端ドラッグ時の自動スクロール管理
  const autoScrollRef = useRef<{
    animationFrameId: number | null;
    clientY: number | null;
    clientX: number | null;
  }>({
    animationFrameId: null,
    clientY: null,
    clientX: null,
  });

  const autoScrollLoopRef = useRef<() => void>(() => {});

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current.animationFrameId !== null) {
      cancelAnimationFrame(autoScrollRef.current.animationFrameId);
      autoScrollRef.current.animationFrameId = null;
    }
    autoScrollRef.current.clientY = null;
    autoScrollRef.current.clientX = null;
  }, []);

  useEffect(() => {
    autoScrollLoopRef.current = () => {
      const { clientY, clientX } = autoScrollRef.current;
      if (clientY === null || draggingIndexRef.current === null) {
        stopAutoScroll();
        return;
      }

      const SCROLL_ZONE = 100; // 画面端から100px以内をスクロール検知エリアに設定
      const MAX_SPEED = 14; // 最大スクロール速度(px/frame)
      const viewportHeight = window.innerHeight;
      let scrollSpeed = 0;

      if (clientY < SCROLL_ZONE) {
        // 画面上部: 端に近づくほど速く上にスクロール
        const ratio = (SCROLL_ZONE - Math.max(0, clientY)) / SCROLL_ZONE;
        scrollSpeed = -Math.max(2, Math.round(ratio * MAX_SPEED));
      } else if (clientY > viewportHeight - SCROLL_ZONE) {
        // 画面下部: 端に近づくほど速く下にスクロール
        const ratio = (clientY - (viewportHeight - SCROLL_ZONE)) / SCROLL_ZONE;
        scrollSpeed = Math.max(2, Math.round(ratio * MAX_SPEED));
      }

      if (scrollSpeed !== 0) {
        window.scrollBy(0, scrollSpeed);

        // スクロール中、指またはカーソルの下にある要素の位置をリアルタイムに再計算
        if (clientX !== null) {
          const element = document.elementFromPoint(clientX, clientY);
          const cardElement = element?.closest<HTMLElement>('[data-item-index]');
          if (cardElement) {
            const targetIndex = Number(cardElement.getAttribute('data-item-index'));
            if (!isNaN(targetIndex) && targetIndex !== dragOverIndexRef.current) {
              dragOverIndexRef.current = targetIndex;
              setDragOverIndex(targetIndex);
            }
          }
        }
      }

      autoScrollRef.current.animationFrameId = requestAnimationFrame(() => {
        autoScrollLoopRef.current();
      });
    };
  }, [stopAutoScroll]);

  const updateAutoScroll = useCallback((clientX: number, clientY: number) => {
    autoScrollRef.current.clientX = clientX;
    autoScrollRef.current.clientY = clientY;

    if (autoScrollRef.current.animationFrameId === null) {
      autoScrollRef.current.animationFrameId = requestAnimationFrame(() => {
        autoScrollLoopRef.current();
      });
    }
  }, []);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (draggingIndexRef.current !== null) {
        updateAutoScroll(e.clientX, e.clientY);
      }
    };

    const handleDragEnd = () => {
      stopAutoScroll();
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drop', handleDragEnd);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDragEnd);
      stopAutoScroll();
    };
  }, [updateAutoScroll, stopAutoScroll]);

  const savedOrderRaw = useSyncExternalStore(
    orderStore.subscribe,
    orderStore.getSnapshot,
    orderStore.getServerSnapshot
  );

  const savedOrder = useMemo(() => {
    if (!savedOrderRaw) return [];
    try {
      const parsed = JSON.parse(savedOrderRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [savedOrderRaw]);

  const displayItems = useMemo(() => {
    if (savedOrder.length === 0) return items;
    const orderMap = new Map<string, number>();
    savedOrder.forEach((id, index) => {
      orderMap.set(id, index);
    });

    return [...items].sort((a, b) => {
      const hasA = orderMap.has(a.id);
      const hasB = orderMap.has(b.id);

      if (!hasA && !hasB) return 0;
      if (!hasA) return -1;
      if (!hasB) return 1;
      return orderMap.get(a.id)! - orderMap.get(b.id)!;
    });
  }, [items, savedOrder]);

  const reorderItems = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (
      fromIndex < 0 ||
      fromIndex >= displayItems.length ||
      toIndex < 0 ||
      toIndex >= displayItems.length
    ) {
      return;
    }
    const updated = [...displayItems];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    const newIds = updated.map((item) => item.id);
    saveOrder(newIds);
    setItems(updated);
    showFeedback('並び順を変更しました。');
  };

  const resetForm = () => {
    setName('');
    setRequiredCount(1);
    setCurrentCount(1);
    setAmazonUrl('');
    setEditingItemId(null);
  };

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    window.setTimeout(() => setFeedbackMessage(null), 2000);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setName(item.name);
    setRequiredCount(item.requiredCount);
    setCurrentCount(item.currentCount);
    setAmazonUrl(item.amazonUrl ?? '');
    setIsFormOpen(true);
  };

  const loadItems = async () => {
    setIsProcessing(true);
    try {
      const data = await getShoppingItems();
      setItems(data);
      const existingIdSet = new Set(data.map((item) => item.id));
      const currentOrder = getSavedOrder();
      const prunedOrder = currentOrder.filter((id) => existingIdSet.has(id));
      if (prunedOrder.length !== currentOrder.length) {
        saveOrder(prunedOrder);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsProcessing(true);
    try {
      if (editingItemId) {
        await updateShoppingItem(editingItemId, {
          name: name.trim(),
          requiredCount: Number(requiredCount),
          currentCount: Number(currentCount),
          amazonUrl: amazonUrl.trim() || undefined,
        });
      } else {
        await addShoppingItem({
          name: name.trim(),
          requiredCount: Number(requiredCount),
          currentCount: Number(currentCount),
          amazonUrl: amazonUrl.trim() || undefined,
        });
      }

      resetForm();
      setIsFormOpen(false);
      await loadItems();
      showFeedback(editingItemId ? '更新しました' : '追加しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCount = async (id: string, delta: number) => {
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    const newCount = Math.max(0, targetItem.currentCount + delta);

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, currentCount: newCount } : item
      )
    );

    setIsProcessing(true);
    try {
      await updateItemCounts(id, targetItem.requiredCount, newCount);
      await loadItems();
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const handleDeleteItem = async () => {
    if (!deleteTargetId) return;

    setItems((prev) => prev.filter((item) => item.id !== deleteTargetId));

    setIsProcessing(true);
    try {
      await deleteShoppingItem(deleteTargetId);
      await loadItems();
      showFeedback('削除しました');
    } finally {
      setIsProcessing(false);
      setDeleteTargetId(null);
    }
  };

  const itemCount = displayItems.length;
  const draggedItem = draggingIndex !== null ? displayItems[draggingIndex] : null;

  const renderPlaceholder = (placeholderItem: ShoppingItem) => {
    const isTargetShortage = placeholderItem.currentCount < placeholderItem.requiredCount;
    const shortageDiff = placeholderItem.requiredCount - placeholderItem.currentCount;

    return (
      <div className="my-2 p-4 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/70 opacity-75 shadow-sm pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="p-2 -ml-2 -mt-1 text-blue-400 shrink-0">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-blue-900 text-base leading-snug break-words">
                  {placeholderItem.name}
                </h2>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                  移動先
                </span>
              </div>
              {isTargetShortage && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-400/80 text-white shadow-xs">
                  <span>⚠️ 要買い足し (あと {shortageDiff} 個)</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-blue-200/60 mt-2 text-xs text-blue-600/80">
          <div>
            現在: <span className="text-lg font-extrabold text-blue-950 mx-0.5">{placeholderItem.currentCount}</span>
            <span className="text-blue-400">/ 最低 {placeholderItem.requiredCount}</span>
          </div>
          {placeholderItem.amazonUrl && (
            <span className="h-9 px-2.5 bg-amber-300/70 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1">
              <span>📦 Amazon</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-32 pt-safe">

      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 pt-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <h1 className="text-lg font-bold text-slate-800">買い物＆在庫リスト</h1>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
            全 {itemCount} 件
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {deleteTargetId && (
          <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">本当に削除しますか？</p>
            <p className="mt-1 text-xs text-slate-500">削除すると、商品情報は元に戻せません。</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
              >
                削除する
              </button>
            </div>
          </div>
        )}

        {isProcessing && displayItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium">
            データを読み込み中...
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-slate-500 font-medium">登録されている商品がありません</p>
            <p className="text-xs text-slate-400 mt-1">下の＋ボタンから追加してください</p>
          </div>
        ) : (
          displayItems.map((item, index) => {
            const isShortage = item.currentCount < item.requiredCount;
            const shortageDiff = item.requiredCount - item.currentCount;
            const isDragging = draggingIndex === index;
            const isDragOver =
              dragOverIndex === index &&
              draggingIndex !== null &&
              draggingIndex !== index;
            const isDropBefore = isDragOver && draggingIndex > index;
            const isDropAfter = isDragOver && draggingIndex < index;

            return (
              <div
                key={item.id}
                data-item-card
                data-item-index={index}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverIndexRef.current !== index) {
                    dragOverIndexRef.current = index;
                    setDragOverIndex(index);
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverIndexRef.current === index) {
                    dragOverIndexRef.current = null;
                    setDragOverIndex(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  stopAutoScroll();
                  const from = draggingIndexRef.current;
                  if (from !== null && from !== index) {
                    reorderItems(from, index);
                  }
                  draggingIndexRef.current = null;
                  dragOverIndexRef.current = null;
                  setDraggingIndex(null);
                  setDragOverIndex(null);
                }}
                className="relative"
              >
                {isDropBefore && draggedItem && renderPlaceholder(draggedItem)}

                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isDragging
                      ? 'opacity-30 border-dashed border-blue-300 bg-blue-50/20 scale-[0.98]'
                      : isShortage
                      ? 'bg-red-50/90 border-red-300 shadow-sm'
                      : 'bg-white border-slate-200/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(index));
                          draggingIndexRef.current = index;
                          setDraggingIndex(index);
                          const card = (e.currentTarget as HTMLElement).closest<HTMLElement>(
                            '[data-item-card]'
                          );
                          if (card && e.dataTransfer.setDragImage) {
                            e.dataTransfer.setDragImage(card, 20, 20);
                          }
                        }}
                        onDragEnd={() => {
                          stopAutoScroll();
                          draggingIndexRef.current = null;
                          dragOverIndexRef.current = null;
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        onTouchStart={() => {
                          draggingIndexRef.current = index;
                          dragOverIndexRef.current = index;
                          setDraggingIndex(index);
                          setDragOverIndex(index);
                        }}
                        onTouchMove={(e) => {
                          if (draggingIndexRef.current === null) return;
                          const touch = e.touches[0];
                          updateAutoScroll(touch.clientX, touch.clientY);

                          const element = document.elementFromPoint(
                            touch.clientX,
                            touch.clientY
                          );
                          const cardElement = element?.closest<HTMLElement>(
                            '[data-item-index]'
                          );
                          if (cardElement) {
                            const targetIndex = Number(
                              cardElement.getAttribute('data-item-index')
                            );
                            if (
                              !isNaN(targetIndex) &&
                              targetIndex !== dragOverIndexRef.current
                            ) {
                              dragOverIndexRef.current = targetIndex;
                              setDragOverIndex(targetIndex);
                            }
                          }
                        }}
                        onTouchEnd={() => {
                          stopAutoScroll();
                          const from = draggingIndexRef.current;
                          const to = dragOverIndexRef.current;
                          if (from !== null && to !== null && from !== to) {
                            reorderItems(from, to);
                          }
                          draggingIndexRef.current = null;
                          dragOverIndexRef.current = null;
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        onTouchCancel={() => {
                          stopAutoScroll();
                          draggingIndexRef.current = null;
                          dragOverIndexRef.current = null;
                          setDraggingIndex(null);
                          setDragOverIndex(null);
                        }}
                        className="touch-none cursor-grab active:cursor-grabbing p-2 -ml-2 -mt-1 text-slate-400 hover:text-slate-600 active:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0 select-none"
                        title="長押し/ドラッグして並び替え"
                        aria-label="長押し/ドラッグして並び替え"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1 pt-0.5">
                        <h2 className="font-bold text-slate-900 text-base leading-snug break-words">
                          {item.name}
                        </h2>
                        {isShortage && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-xs">
                            <span>⚠️ 要買い足し (あと {shortageDiff} 個)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                        disabled={isProcessing}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => confirmDelete(item.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 active:text-red-600 transition-colors"
                        aria-label="削除"
                        disabled={isProcessing}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 mt-2">
                    <div className="text-xs text-slate-500">
                      現在: <span className="text-lg font-extrabold text-slate-900 mx-0.5">{item.currentCount}</span>
                      <span className="text-slate-400">/ 最低 {item.requiredCount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.amazonUrl && (
                        <a
                          href={item.amazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 px-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <span>📦 Amazon</span>
                          <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}

                      <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateCount(item.id, -1)}
                          className="w-10 h-10 bg-white active:bg-slate-200 rounded-lg shadow-xs flex items-center justify-center text-slate-800 font-bold text-lg transition-colors"
                          disabled={isProcessing}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateCount(item.id, 1)}
                          className="w-10 h-10 bg-blue-600 active:bg-blue-700 text-white rounded-lg shadow-xs flex items-center justify-center font-bold text-lg transition-colors"
                          disabled={isProcessing}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isDropAfter && draggedItem && renderPlaceholder(draggedItem)}
              </div>
            );
          })
        )}
      </main>

      <div className="fixed bottom-20 sm:bottom-6 right-5 z-30">
        <button
          onClick={() => (isFormOpen ? (resetForm(), setIsFormOpen(false)) : openCreateForm())}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-light transition-transform active:scale-95"
          aria-label="追加"
          disabled={isProcessing}
        >
          {isFormOpen ? '✕' : '＋'}
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-end">
          <div
            className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                {editingItemId ? '商品を編集' : '新しい商品を登録'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                キャンセル
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">商品名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: トイレットペーパー"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Amazon商品URL (任意)</label>
                <input
                  type="url"
                  placeholder="https://www.amazon.co.jp/dp/..."
                  value={amazonUrl}
                  onChange={(e) => setAmazonUrl(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">最低ストック数</label>
                  <input
                    type="number"
                    min="1"
                    value={requiredCount}
                    onChange={(e) => setRequiredCount(Number(e.target.value))}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">現在の在庫数</label>
                  <input
                    type="number"
                    min="0"
                    value={currentCount}
                    onChange={(e) => setCurrentCount(Number(e.target.value))}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-base shadow-md transition-colors mt-2"
                disabled={isProcessing}
              >
                {editingItemId ? '更新する' : 'リストに追加する'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* 操作完了時のトーストポップアップ */}
      {feedbackMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
