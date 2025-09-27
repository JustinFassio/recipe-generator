import { useState } from 'react';
import { useGroceriesQuery } from '@/hooks/useGroceriesQuery';
import { useShoppingCartAI } from '@/hooks/useShoppingCartAI';
import { ShoppingCartChat } from '@/components/shopping-cart/ShoppingCartChat';
import { Check, ShoppingCart, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Shopping item component - commented out as unused
/*
interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggleCompleted: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<ShoppingItem>) => void;
}
*/

// Unused component - keeping for reference
/*
function ShoppingItemCard({
  item,
  onToggleCompleted,
  onRemove,
  onUpdate,
}: ShoppingItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');

  const handleSaveEdit = () => {
    onUpdate(item.id, {
      quantity: editQuantity || undefined,
      notes: editNotes || undefined,
    });
    setIsEditing(false);
  };

  const getSourceIcon = (source: ShoppingItem['source']) => {
    switch (source) {
      case 'recipe':
        return <Utensils className="w-4 h-4" />;
      case 'ai-chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'groceries-restock':
        return <Package className="w-4 h-4" />;
      default:
        return <Plus className="w-4 h-4" />;
    }
  };

  const getSourceBadgeColor = (source: ShoppingItem['source']) => {
    switch (source) {
      case 'recipe':
        return 'badge-primary';
      case 'ai-chat':
        return 'badge-secondary';
      case 'groceries-restock':
        return 'badge-accent';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div
      className={`card bg-base-100 shadow-sm border ${item.completed ? 'opacity-60' : ''}`}
    >
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <button
            className={`btn btn-circle btn-sm ${item.completed ? 'btn-success' : 'btn-outline'}`}
            onClick={() => onToggleCompleted(item.id)}
            title={item.source === 'groceries-restock' ? 'Mark as purchased - will add back to kitchen' : 'Mark as completed'}
          >
            {item.completed ? (
              <Check className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className={`font-semibold ${item.completed ? 'line-through' : ''}`}
              >
                {item.name}
              </h3>
              <div
                className={`badge badge-sm ${getSourceBadgeColor(item.source)}`}
              >
                <div className="flex items-center gap-1">
                  {getSourceIcon(item.source)}
                  <span className="capitalize">
                    {item.source.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {item.sourceTitle && (
              <p className="text-sm text-base-content/70 mb-2">
                From: {item.sourceTitle}
              </p>
            )}

            {!isEditing ? (
              <div className="space-y-1">
                {item.quantity && (
                  <p className="text-sm">
                    <span className="font-medium">Quantity:</span>{' '}
                    {item.quantity}
                  </p>
                )}
                {item.notes && (
                  <p className="text-sm">
                    <span className="font-medium">Notes:</span> {item.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Quantity (optional)"
                  className="input input-sm input-bordered w-full"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
                <textarea
                  placeholder="Notes (optional)"
                  className="textarea textarea-sm textarea-bordered w-full"
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              ⋮
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <button onClick={() => setIsEditing(true)}>Edit Details</button>
              </li>
              <li>
                <button
                  className="text-error"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
*/

// Main shopping cart page
export default function ShoppingCartPage() {
  const groceries = useGroceriesQuery();

  const { getChatResponse } = useShoppingCartAI();

  const [activeTab, setActiveTab] = useState<
    'incomplete' | 'completed' | 'all'
  >('incomplete');

  // Simple format shopping list items
  const shoppingListItems = Object.entries(groceries.shoppingList);
  const incompleteItems = shoppingListItems.filter(
    ([, status]) => status === 'pending'
  );
  const completedItems = shoppingListItems.filter(
    ([, status]) => status === 'purchased'
  );
  const allItems = shoppingListItems;

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('ShoppingCartPage data:', {
      shoppingList: groceries.shoppingList,
      shoppingListItems,
      incompleteItems,
      completedItems,
      allItems,
    });
  }

  const getDisplayItems = () => {
    switch (activeTab) {
      case 'incomplete':
        return incompleteItems;
      case 'completed':
        return completedItems;
      case 'all':
        return allItems;
      default:
        return incompleteItems;
    }
  };

  const handleClearCompleted = async () => {
    if (completedItems.length === 0) {
      toast({
        title: 'No Completed Items',
        description: 'There are no completed items to clear.',
        variant: 'default',
      });
      return;
    }

    // Remove completed items from shopping list
    const updatedShoppingList = { ...groceries.shoppingList } as Record<
      string,
      string
    >;
    completedItems.forEach(([ingredient]) => {
      delete updatedShoppingList[ingredient];
    });

    // React Query will handle the update automatically
    // No need to manually save

    if (activeTab === 'completed') {
      setActiveTab('incomplete');
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'Are you sure you want to clear all items from your shopping list?'
      )
    ) {
      // Clear all shopping list items

      // React Query will handle the update automatically
      // No need to manually save

      setActiveTab('incomplete');
    }
  };

  if (groceries.loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (groceries.error) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error">
          <span>Error loading shopping list: {groceries.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-base-content/70">
              {allItems.length} items • {incompleteItems.length} remaining
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={handleClearCompleted}
            disabled={completedItems.length === 0}
          >
            Clear Completed
          </button>
          <button
            className="btn btn-error btn-outline btn-sm"
            onClick={handleClearAll}
            disabled={allItems.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Main content - Two column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shopping list - Left column (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="tabs tabs-boxed mb-4">
            <button
              className={`tab ${activeTab === 'incomplete' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('incomplete')}
            >
              To Buy ({incompleteItems.length})
            </button>
            <button
              className={`tab ${activeTab === 'completed' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({completedItems.length})
            </button>
            <button
              className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Items ({allItems.length})
            </button>
          </div>

          {/* Shopping items */}
          <div className="space-y-3">
            {getDisplayItems().length === 0 ? (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {activeTab === 'completed'
                      ? 'No completed items'
                      : 'Your shopping list is empty'}
                  </h3>
                  <p className="text-base-content/70 mb-4">
                    {activeTab === 'completed'
                      ? 'Complete some items to see them here.'
                      : 'Mark ingredients as unavailable in your kitchen to add them to your shopping list.'}
                  </p>
                </div>
              </div>
            ) : (
              getDisplayItems().map(([ingredient, status]) => (
                <div
                  key={ingredient}
                  className="card bg-base-100 shadow-sm border"
                >
                  <div className="card-body p-4">
                    <div className="flex items-start gap-3">
                      <button
                        className={`btn btn-circle btn-sm ${status === 'purchased' ? 'btn-success' : 'btn-outline'}`}
                        onClick={() => {
                          // Find the category for this ingredient
                          const category =
                            Object.keys(groceries.groceries).find((cat) =>
                              (groceries.groceries as Record<string, string[]>)[
                                cat
                              ].includes(ingredient)
                            ) || 'pantry_staples'; // fallback category

                          // Toggle ingredient (React Query handles the database update)
                          groceries.toggleIngredient(category, ingredient);
                        }}
                      >
                        {status === 'purchased' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${status === 'purchased' ? 'line-through' : ''}`}
                        >
                          {ingredient}
                        </h3>
                        <div className="badge badge-primary badge-sm">
                          <ShoppingCart className="w-4 h-4" />
                          <span>Kitchen Restock</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Assistant - Right column (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm sticky top-6">
            <div className="card-body">
              {/* AI Assistant Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Your Cooking Assistant</h3>
                  <p className="text-sm text-base-content/70">
                    Ask me what ingredients you need for any cuisine!
                  </p>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="h-96">
                <ShoppingCartChat
                  placeholder="What do I need for authentic Mexican cooking?"
                  onChatResponse={getChatResponse}
                  className="h-full"
                />
              </div>

              {/* Quick suggestion buttons */}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-base-content/80">
                  Quick suggestions:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className="btn btn-sm btn-outline text-left justify-start"
                    onClick={() =>
                      getChatResponse(
                        'What do I need for authentic Mexican cooking?'
                      )
                    }
                  >
                    🌮 Mexican essentials
                  </button>
                  <button
                    className="btn btn-sm btn-outline text-left justify-start"
                    onClick={() =>
                      getChatResponse(
                        'What do I need for Italian pasta dishes?'
                      )
                    }
                  >
                    🍝 Italian basics
                  </button>
                  <button
                    className="btn btn-sm btn-outline text-left justify-start"
                    onClick={() =>
                      getChatResponse('What Asian ingredients should I stock?')
                    }
                  >
                    🥢 Asian staples
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
