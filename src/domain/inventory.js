export function getStockStatus({ currentStock, minStock }) {
  if (currentStock < 0) {
    return { key: 'minus', label: 'Minus', tone: 'danger' };
  }

  if (currentStock <= 0) {
    return { key: 'empty', label: 'Habis', tone: 'danger' };
  }

  if (currentStock <= minStock) {
    return { key: 'low', label: 'Menipis', tone: 'warning' };
  }

  return { key: 'safe', label: 'Aman', tone: 'success' };
}

export function calculateRestockAverage({
  currentStock,
  avgCostPerUnit,
  qtyIn,
  purchaseTotalPrice,
}) {
  if (qtyIn <= 0) {
    throw new Error('qtyIn must be greater than 0');
  }

  const costPerUnitIn = purchaseTotalPrice / qtyIn;
  const combinedStock = currentStock + qtyIn;
  const newAvgCost =
    combinedStock > 0
      ? (currentStock * avgCostPerUnit + qtyIn * costPerUnitIn) / combinedStock
      : costPerUnitIn;

  return { costPerUnitIn, combinedStock, newAvgCost };
}

export function calculateMenuHpp({ recipes, ingredients }) {
  return recipes.reduce((total, recipe) => {
    const ingredient = ingredients.find((item) => item.id === recipe.ingredientId);
    return total + recipe.qty * (ingredient?.avgCostPerUnit ?? 0);
  }, 0);
}

export function calculateSaleDraft({ cart, menus, recipes, ingredients }) {
  const ingredientUsageMap = new Map();

  const items = cart.map((cartItem) => {
    const menu = menus.find((item) => item.id === cartItem.menuId);
    if (!menu) {
      throw new Error(`Menu not found: ${cartItem.menuId}`);
    }

    const menuRecipes = recipes.filter((recipe) => recipe.menuId === menu.id);
    const hppAtSale = calculateMenuHpp({ recipes: menuRecipes, ingredients });

    for (const recipe of menuRecipes) {
      const ingredient = ingredients.find((item) => item.id === recipe.ingredientId);
      if (!ingredient) continue;

      const qtyUsed = recipe.qty * cartItem.qty;
      const existing = ingredientUsageMap.get(ingredient.id);

      if (existing) {
        existing.qtyUsed += qtyUsed;
        existing.totalCost += qtyUsed * ingredient.avgCostPerUnit;
        existing.stockAfter = ingredient.currentStock - existing.qtyUsed;
      } else {
        ingredientUsageMap.set(ingredient.id, {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          qtyUsed,
          unit: recipe.unit ?? ingredient.unit,
          costPerUnitAtSale: ingredient.avgCostPerUnit,
          totalCost: qtyUsed * ingredient.avgCostPerUnit,
          stockBefore: ingredient.currentStock,
          stockAfter: ingredient.currentStock - qtyUsed,
        });
      }
    }

    const subtotal = menu.sellingPrice * cartItem.qty;
    const totalHpp = hppAtSale * cartItem.qty;

    return {
      menuId: menu.id,
      menuName: menu.name,
      qty: cartItem.qty,
      priceAtSale: menu.sellingPrice,
      subtotal,
      hppAtSale,
      profitAtSale: subtotal - totalHpp,
    };
  });

  const ingredientUsages = Array.from(ingredientUsageMap.values());
  const stockWarnings = ingredientUsages
    .filter((usage) => usage.stockAfter < 0)
    .map((usage) => ({
      ingredientId: usage.ingredientId,
      ingredientName: usage.ingredientName,
      shortage: Math.abs(usage.stockAfter),
      unit: usage.unit,
    }));

  const totalAmount = items.reduce((total, item) => total + item.subtotal, 0);
  const totalHpp = ingredientUsages.reduce((total, usage) => total + usage.totalCost, 0);

  return {
    items,
    ingredientUsages,
    stockWarnings,
    totalAmount,
    totalHpp,
    grossProfit: totalAmount - totalHpp,
  };
}

export function calculateMenuWasteDraft({ menuId, qty, menus, recipes, ingredients }) {
  const menu = menus.find((item) => item.id === Number(menuId));
  if (!menu) {
    throw new Error(`Menu not found: ${menuId}`);
  }

  const menuRecipes = recipes.filter((recipe) => recipe.menuId === menu.id);
  const ingredientUsages = menuRecipes
    .map((recipe) => {
      const ingredient = ingredients.find((item) => item.id === recipe.ingredientId);
      if (!ingredient) return null;

      const qtyUsed = recipe.qty * qty;
      const totalCost = qtyUsed * ingredient.avgCostPerUnit;

      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        qtyUsed,
        unit: recipe.unit ?? ingredient.unit,
        costPerUnitAtWaste: ingredient.avgCostPerUnit,
        totalCost,
        stockBefore: ingredient.currentStock,
        stockAfter: ingredient.currentStock - qtyUsed,
      };
    })
    .filter(Boolean);

  return {
    menuId: menu.id,
    menuName: menu.name,
    qty,
    estimatedLoss: ingredientUsages.reduce((total, usage) => total + usage.totalCost, 0),
    ingredientUsages,
  };
}

export function calculateIngredientWasteDraft({ ingredient, qty }) {
  const qtyUsed = Number(qty);
  const totalCost = qtyUsed * ingredient.avgCostPerUnit;

  return {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    qtyUsed,
    unit: ingredient.unit,
    costPerUnitAtWaste: ingredient.avgCostPerUnit,
    totalCost,
    stockBefore: ingredient.currentStock,
    stockAfter: ingredient.currentStock - qtyUsed,
    estimatedLoss: totalCost,
  };
}

export function calculateStockCountDraft({ ingredient, actualStock }) {
  const actual = Number(actualStock);

  return {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    systemStock: ingredient.currentStock,
    actualStock: actual,
    difference: actual - ingredient.currentStock,
    unit: ingredient.unit,
    stockBefore: ingredient.currentStock,
    stockAfter: actual,
  };
}
