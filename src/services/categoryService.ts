import { getDB } from '../database/db';
import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#F59E0B', type: 'expense', isDefault: true },
  { id: 'moradia', name: 'Moradia', icon: 'Home', color: '#3B82F6', type: 'expense', isDefault: true },
  { id: 'transporte', name: 'Transporte', icon: 'Car', color: '#6366F1', type: 'expense', isDefault: true },
  { id: 'saude', name: 'Saúde', icon: 'HeartPulse', color: '#EC4899', type: 'expense', isDefault: true },
  { id: 'educacao', name: 'Educação', icon: 'GraduationCap', color: '#10B981', type: 'expense', isDefault: true },
  { id: 'lazer', name: 'Lazer', icon: 'Gamepad2', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'compras', name: 'Compras', icon: 'ShoppingBag', color: '#F43F5E', type: 'expense', isDefault: true },
  { id: 'assinaturas', name: 'Assinaturas', icon: 'Tv', color: '#06B6D4', type: 'expense', isDefault: true },
  { id: 'viagens', name: 'Viagens', icon: 'Plane', color: '#EAB308', type: 'expense', isDefault: true },
  { id: 'financas', name: 'Finanças', icon: 'TrendingUp', color: '#35D07F', type: 'both', isDefault: true },
  { id: 'salario', name: 'Salário', icon: 'Wallet', color: '#35D07F', type: 'income', isDefault: true },
  { id: 'investimentos', name: 'Investimentos', icon: 'LineChart', color: '#10B981', type: 'both', isDefault: true },
  { id: 'outros', name: 'Outros', icon: 'MoreHorizontal', color: '#8A8F98', type: 'both', isDefault: true },
];

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const db = await getDB();
    const categories = await db.getAll('categories');
    if (categories.length === 0) {
      await this.initDefaultCategories();
      return DEFAULT_CATEGORIES;
    }
    return categories;
  },

  async initDefaultCategories(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('categories', 'readwrite');
    for (const cat of DEFAULT_CATEGORIES) {
      await tx.store.put(cat);
    }
    await tx.done;
  },

  async initDefaults(): Promise<void> {
    return this.initDefaultCategories();
  },

  async getById(id: string): Promise<Category | undefined> {
    const db = await getDB();
    return db.get('categories', id);
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const db = await getDB();
    const newCategory: Category = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isDefault: false
    };
    await db.put('categories', newCategory);
    return newCategory;
  },

  async update(category: Category): Promise<Category> {
    const db = await getDB();
    await db.put('categories', category);
    return category;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('categories', id);
  }
};
