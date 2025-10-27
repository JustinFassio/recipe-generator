import { useState } from 'react';
import { useGroceriesQuery } from '@/hooks/useGroceriesQuery';
import { useShoppingCartAI } from '@/hooks/useShoppingCartAI';
import { useUserGroceryCart } from '@/hooks/useUserGroceryCart';
import { ShoppingCartChat } from '@/components/shopping-cart/ShoppingCartChat';
import { IngredientCard } from '@/components/groceries/IngredientCard';
import { Check, ShoppingCart, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { upsertSystemIngredient } from '@/lib/ingredients/upsertSystemIngredient';
import { extractIngredientsFromTranscript } from '@/lib/ingredients/extractFromTranscript';

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
  const {
    loading: cartLoading,
    removeFromCart,
    isInCart,
  } = useUserGroceryCart();

  const {
    getChatResponse,
    getAllMissingStaples,
    getCuisineStaples,
    getRecommendedAdditions,
  } = useShoppingCartAI();

  // Modal state management
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTab] = useState<
    'incomplete' | 'completed' | 'all'
  >('incomplete');

  // Session-only completion state (does not persist to backend)
  const [sessionCompleted, setSessionCompleted] = useState<Set<string>>(
    () => new Set()
  );

  // Assistant transcript and extracted ingredients (session only)
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>(
    []
  );

  // Kitchen inventory integration functions
  const handleAddToGroceriesAsUnavailable = async (
    category: string,
    name: string
  ) => {
    try {
      await upsertSystemIngredient(name, category);
      // Add to groceries in unavailable state
      groceries.toggleIngredient(category, name);
      toast({
        title: 'Added to Kitchen',
        description: `${name} added to kitchen inventory as unavailable (needs to be purchased)`,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to add ${name} to kitchen inventory`,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromGroceries = async (name: string) => {
    try {
      await removeFromCart(name);
      toast({
        title: 'Removed from Kitchen',
        description: `${name} removed from kitchen inventory`,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to remove ${name} from kitchen inventory`,
        variant: 'destructive',
      });
    }
  };

  // Add multiple staples to groceries as unavailable
  const addStaplesToGroceriesAsUnavailable = async (staples: string[]) => {
    try {
      for (const staple of staples) {
        const category = categorizeIngredient(staple);
        await upsertSystemIngredient(staple, category);
        groceries.toggleIngredient(category, staple);
      }

      toast({
        title: 'Added to Kitchen',
        description: `${staples.length} ingredients added to kitchen inventory as unavailable`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add some ingredients to kitchen inventory',
        variant: 'destructive',
      });
    }
  };

  // Simple ingredient categorization heuristic
  const categorizeIngredient = (ingredient: string): string => {
    const name = ingredient.toLowerCase();

    if (
      name.includes('oregano') ||
      name.includes('cumin') ||
      name.includes('paprika')
    ) {
      return 'flavor_builders';
    }
    if (
      name.includes('onion') ||
      name.includes('tomato') ||
      name.includes('pepper')
    ) {
      return 'fresh_produce';
    }
    if (
      name.includes('cheese') ||
      name.includes('milk') ||
      name.includes('butter')
    ) {
      return 'dairy_cold';
    }
    if (name.includes('oil') || name.includes('vinegar')) {
      return 'cooking_essentials';
    }
    if (
      name.includes('flour') ||
      name.includes('rice') ||
      name.includes('pasta')
    ) {
      return 'pantry_staples';
    }
    if (
      name.includes('chicken') ||
      name.includes('beef') ||
      name.includes('fish')
    ) {
      return 'proteins';
    }

    return 'fresh_produce';
  };

  // Simple format shopping list items with session overlay
  const rawShoppingListItems = Object.entries(groceries.shoppingList);
  const effectiveShoppingListItems = rawShoppingListItems.map(
    ([ingredient, status]) => {
      // Overlay session-only completion state; fall back to backend status when not overridden
      const isCompletedSession = sessionCompleted.has(ingredient);
      const effectiveStatus = isCompletedSession ? 'purchased' : status;
      return [ingredient, effectiveStatus] as const;
    }
  );

  const incompleteItems = effectiveShoppingListItems.filter(
    ([, status]) => status === 'pending'
  );
  const completedItems = effectiveShoppingListItems.filter(
    ([, status]) => status === 'purchased'
  );
  const allItems = effectiveShoppingListItems;

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('ShoppingCartPage data:', {
      shoppingList: groceries.shoppingList,
      rawShoppingListItems,
      effectiveShoppingListItems,
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
        description: 'There are no completed items to clear for this session.',
        variant: 'default',
      });
      return;
    }

    // Clear session-only completed markers
    setSessionCompleted(new Set());
    toast({
      title: 'Cleared Completed',
      description: 'Completed items cleared for this shopping session.',
    });

    if (activeTab === 'completed') {
      setActiveTab('incomplete');
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'Clear all session progress? This will reset your session completion marks.'
      )
    ) {
      // Reset session-only completion state
      setSessionCompleted(new Set());
      toast({
        title: 'Session Reset',
        description: 'All session completion marks have been cleared.',
      });
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
      <div className="mb-6">
        {/* Mobile-optimized header layout */}
        <div className="space-y-3 sm:space-y-0">
          {/* Top row: Title and icon (mobile: stacked, desktop: side by side) */}
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Shopping Cart</h1>
              <p className="text-sm sm:text-base text-base-content/70">
                {allItems.length} items • {incompleteItems.length} remaining
              </p>
            </div>
          </div>

          {/* Bottom row: Quick actions (mobile: full width, desktop: compact) */}
          <div className="flex flex-wrap gap-2 sm:gap-2">
            <button
              className="btn btn-outline btn-sm flex-1 sm:flex-none"
              onClick={handleClearCompleted}
              disabled={completedItems.length === 0}
            >
              Clear Completed
            </button>
            <button
              className="btn btn-error btn-outline btn-sm flex-1 sm:flex-none"
              onClick={handleClearAll}
              disabled={allItems.length === 0}
            >
              Clear All
            </button>
          </div>
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
                          // Session-only toggle: mark/unmark as completed in this session
                          setSessionCompleted((prev) => {
                            const next = new Set(prev);
                            if (next.has(ingredient)) {
                              next.delete(ingredient);
                            } else {
                              next.add(ingredient);
                            }
                            return next;
                          });
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

        {/* Right column placeholder container (reserved for future content) */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm sticky top-6">
            <div className="card-body">
              <h3 className="font-semibold">Reserved Panel</h3>
              {extractedIngredients.length === 0 ? (
                <p className="text-sm text-base-content/70">
                  No extracted ingredients yet.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-base-content/70">
                      {extractedIngredients.length} found
                    </span>
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={async () => {
                        const unique = Array.from(
                          new Set(extractedIngredients)
                        );
                        if (unique.length === 0) return;
                        await addStaplesToGroceriesAsUnavailable(unique);
                        toast({
                          title: 'Added to Kitchen',
                          description: `${unique.length} ingredients added as unavailable`,
                        });
                      }}
                    >
                      Add All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {extractedIngredients.map((name) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-2 rounded bg-base-200"
                      >
                        <span className="text-sm">{name}</span>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-xs"
                            onClick={() =>
                              handleAddToGroceriesAsUnavailable(
                                categorizeIngredient(name),
                                name
                              )
                            }
                          >
                            Add
                          </button>
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() =>
                              setExtractedIngredients((prev) =>
                                prev.filter((n) => n !== name)
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant - moved below the shopping list */}
      <div className="mt-6">
        <div className="card bg-base-100 shadow-sm">
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
                onAddAll={async () => {
                  const allMissing = getAllMissingStaples();
                  if (allMissing.length === 0) return;
                  const focus = allMissing[0];
                  const recs = getRecommendedAdditions(
                    focus.cuisine.toLowerCase(),
                    6
                  ).map((s) => s.ingredient);
                  await addStaplesToGroceriesAsUnavailable(recs);
                }}
                onTranscriptChange={(t) => setAssistantTranscript(t)}
                className="h-full"
              />
            </div>

            {/* Quick suggestion buttons */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-base-content/80">
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-sm btn-accent"
                  onClick={() => {
                    const list =
                      extractIngredientsFromTranscript(assistantTranscript);
                    setExtractedIngredients(list);
                    toast({
                      title: 'Ingredients listed',
                      description: `${list.length} found`,
                    });
                  }}
                >
                  List Ingredients
                </button>
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
                    getChatResponse('What do I need for Italian pasta dishes?')
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

      {/* Cuisine Staples Display - Bottom Section (Grouped by Region with Accordion) */}
      {(() => {
        const regionForCuisine = (name: string): string => {
          const n = name.toLowerCase();
          // Broad family groups
          if (
            [
              'asian',
              'thai',
              'chinese',
              'japanese',
              'korean',
              'vietnamese',
              'indian',
              'indonesian',
              'malaysian',
              'singaporean',
              'filipino',
              'isaan',
            ].some((k) => n.includes(k))
          )
            return 'Asian';
          if (
            [
              'europe',
              'italian',
              'french',
              'spanish',
              'greek',
              'german',
              'portuguese',
              'russian',
              'polish',
              'hungarian',
              'austrian',
              'swiss',
              'dutch',
              'belgian',
              'swedish',
            ].some((k) => n.includes(k))
          )
            return 'European';
          if (
            [
              'american',
              'cajun',
              'creole',
              'southern',
              'new england',
              'pacific northwest',
              'mid-atlantic',
              'southwest',
              'lowcountry',
              'hawaiian',
              'appalachian',
              'midwestern',
              'tex-mex',
              'texas',
              'kansas city',
              'california',
            ].some((k) => n.includes(k))
          )
            return 'American';
          if (
            [
              'latin',
              'mexican',
              'brazilian',
              'peruvian',
              'argentin',
              'chilean',
              'colombian',
              'venezuelan',
              'uruguayan',
              'paraguayan',
              'bolivian',
              'ecuadorian',
            ].some((k) => n.includes(k))
          )
            return 'Latin American';
          if (
            ['lebanese', 'turkish', 'middle eastern', 'persian'].some((k) =>
              n.includes(k)
            )
          )
            return 'Middle Eastern';
          if (['jamaican', 'caribbean'].some((k) => n.includes(k)))
            return 'Caribbean';
          if (['ethiopian', 'moroccan', 'african'].some((k) => n.includes(k)))
            return 'African';
          if (
            ['scandinavian', 'norwegian', 'danish'].some((k) => n.includes(k))
          )
            return 'Scandinavian';
          if (
            ['fusion', 'modern american', 'international'].some((k) =>
              n.includes(k)
            )
          )
            return 'Fusion & Modern';
          if (
            ['vegetarian', 'health', 'keto', 'vegan', 'paleo'].some((k) =>
              n.includes(k)
            )
          )
            return 'Diet & Health';
          if (
            ['specialty', 'technique', 'cooking method'].some((k) =>
              n.includes(k)
            )
          )
            return 'Specialty Methods';
          return 'Other';
        };

        const allMissingStaples = getAllMissingStaples();
        if (allMissingStaples.length === 0) return null;

        const grouped: Record<string, typeof allMissingStaples> = {};
        for (const item of allMissingStaples) {
          const group = regionForCuisine(item.cuisine);
          if (!grouped[group]) grouped[group] = [];
          grouped[group].push(item);
        }

        const regionOrder = [
          'American',
          'Latin American',
          'Asian',
          'European',
          'Middle Eastern',
          'Caribbean',
          'African',
          'Scandinavian',
          'Fusion & Modern',
          'Diet & Health',
          'Specialty Methods',
          'Other',
        ];

        return (
          <div className="mt-8">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-lg">
                  <span className="text-primary">🌍</span> Cuisine Staples
                </h3>
                <p className="text-sm text-base-content/70 mb-4">
                  Missing essential ingredients for authentic cooking, grouped
                  by region
                </p>

                <div className="join join-vertical w-full">
                  {regionOrder
                    .filter((r) => grouped[r] && grouped[r].length > 0)
                    .map((region) => (
                      <div
                        key={region}
                        className="collapse collapse-arrow join-item border border-base-300 bg-base-200"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={region === 'American'}
                        />
                        <div className="collapse-title text-md font-semibold">
                          {region}{' '}
                          <span className="badge badge-outline ml-2">
                            {grouped[region].length}
                          </span>
                        </div>
                        <div className="collapse-content">
                          <div className="space-y-3">
                            {grouped[region].map((cuisineData, index) => {
                              const allStaples = getCuisineStaples(
                                cuisineData.cuisine.toLowerCase()
                              );
                              const actuallyMissing = allStaples.filter(
                                (staple) => !isInCart(staple.ingredient)
                              );
                              const actualCoverage =
                                allStaples.length > 0
                                  ? Math.round(
                                      ((allStaples.length -
                                        actuallyMissing.length) /
                                        allStaples.length) *
                                        100
                                    )
                                  : 0;

                              return (
                                <div
                                  key={`${region}-${index}`}
                                  className="p-3 bg-base-100 rounded-lg border border-base-300"
                                >
                                  {/* Mobile-optimized cuisine card layout */}
                                  <div className="space-y-3 sm:space-y-0">
                                    {/* Top row: Cuisine name and badges */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <span className="font-semibold text-lg">
                                        {cuisineData.cuisine}
                                      </span>
                                      <div className="flex flex-wrap gap-1 sm:gap-2">
                                        <div className="badge badge-outline badge-sm">
                                          {actualCoverage}% coverage
                                        </div>
                                        <div className="badge badge-warning badge-sm">
                                          {actuallyMissing.length} missing
                                        </div>
                                        <div className="badge badge-info badge-sm">
                                          {allStaples.length} total staples
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle row: Missing ingredients */}
                                    <div className="text-sm text-base-content/60">
                                      <span className="font-medium">
                                        Missing:
                                      </span>{' '}
                                      <span className="break-words">
                                        {actuallyMissing
                                          .slice(0, 3)
                                          .map((s) => s.ingredient)
                                          .join(', ')}
                                        {actuallyMissing.length > 3 &&
                                          ` +${actuallyMissing.length - 3} more`}
                                      </span>
                                    </div>

                                    {/* Bottom row: Action buttons */}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                                      <button
                                        className="btn btn-sm btn-outline flex-1 sm:flex-none"
                                        onClick={() => {
                                          setSelectedCuisine(
                                            cuisineData.cuisine
                                          );
                                          setIsModalOpen(true);
                                        }}
                                      >
                                        View All ({allStaples.length})
                                      </button>
                                      <button
                                        className="btn btn-sm btn-primary flex-1 sm:flex-none"
                                        onClick={async () => {
                                          const recommendations =
                                            getRecommendedAdditions(
                                              cuisineData.cuisine.toLowerCase(),
                                              3
                                            );
                                          const ingredients =
                                            recommendations.map(
                                              (s) => s.ingredient
                                            );
                                          await addStaplesToGroceriesAsUnavailable(
                                            ingredients
                                          );
                                        }}
                                      >
                                        Add Essentials
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cuisine Staples Modal */}
      {isModalOpen && selectedCuisine && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedCuisine} Cuisine Staples
              {(() => {
                const allStaples = getCuisineStaples(
                  selectedCuisine.toLowerCase()
                );
                // Calculate actual missing ingredients by checking each staple against user's kitchen
                const actuallyMissing = allStaples.filter(
                  (staple) => !isInCart(staple.ingredient)
                );
                const actualCoverage =
                  allStaples.length > 0
                    ? Math.round(
                        ((allStaples.length - actuallyMissing.length) /
                          allStaples.length) *
                          100
                      )
                    : 0;
                return (
                  <div className="text-sm font-normal text-base-content/70 mt-1">
                    {actualCoverage}% coverage • {actuallyMissing.length}{' '}
                    missing • {allStaples.length} total staples
                  </div>
                );
              })()}
            </h3>

            {/* Search functionality */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search ingredients..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Grid layout for ingredients */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 max-h-96 overflow-y-auto">
              {getCuisineStaples(selectedCuisine.toLowerCase())
                .filter(
                  (staple) =>
                    !searchQuery.trim() ||
                    staple.ingredient
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    staple.reason
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                )
                .map((staple) => {
                  // Use the same logic as global ingredients page
                  const isInUserCart = isInCart(staple.ingredient); // Multi-category aware check
                  const isSystemAvailable = true; // All cuisine staples are system ingredients
                  const isHidden = false; // Cuisine staples are never hidden

                  return (
                    <IngredientCard
                      key={staple.ingredient}
                      ingredient={{
                        id: staple.ingredient,
                        name: staple.ingredient,
                        normalized_name: staple.ingredient.toLowerCase(),
                        category: staple.category,
                        synonyms: [],
                        is_system: true,
                        usage_count: 0,
                        is_verified: true,
                        first_seen_at: new Date().toISOString(),
                        last_seen_at: new Date().toISOString(),
                        created_by: 'system',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      }}
                      isInUserCart={isInUserCart}
                      isSystemAvailable={isSystemAvailable}
                      isHidden={isHidden}
                      onAddToGroceries={handleAddToGroceriesAsUnavailable}
                      onRemoveFromGroceries={handleRemoveFromGroceries}
                      onToggleHidden={async () => {}}
                      loading={groceries.loading || false}
                      cartLoading={cartLoading || false}
                    />
                  );
                })}
            </div>

            {/* Modal actions */}
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const recommendations = getRecommendedAdditions(
                    selectedCuisine.toLowerCase(),
                    5
                  );
                  const ingredients = recommendations.map((s) => s.ingredient);
                  await addStaplesToGroceriesAsUnavailable(ingredients);
                }}
              >
                Add Top 5 Essentials to Kitchen (Unavailable)
              </button>
              <button
                className="btn"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedCuisine(null);
                  setSearchQuery('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
