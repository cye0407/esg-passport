// Local Storage Database
// Mirrors the Base44 API structure for easy migration later

import { generateId } from '../lib/utils';

const STORAGE_PREFIX = 'esg_passport_';

// Generic CRUD operations for any entity
function createEntityStore(entityName) {
  const storageKey = `${STORAGE_PREFIX}${entityName}`;

  const getAll = () => {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  };

  const saveAll = (items) => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  return {
    // Get all items
    list: () => {
      return Promise.resolve(getAll());
    },

    // Filter items by criteria
    filter: (criteria = {}) => {
      const items = getAll();
      const filtered = items.filter(item => {
        return Object.entries(criteria).every(([key, value]) => item[key] === value);
      });
      return Promise.resolve(filtered);
    },

    // Get single item by ID
    get: (id) => {
      const items = getAll();
      const item = items.find(i => i.id === id);
      return Promise.resolve(item || null);
    },

    // Create new item
    create: (data) => {
      const items = getAll();
      const newItem = {
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      items.push(newItem);
      saveAll(items);
      return Promise.resolve(newItem);
    },

    // Bulk create
    bulkCreate: (dataArray) => {
      const items = getAll();
      const newItems = dataArray.map(data => ({
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      }));
      items.push(...newItems);
      saveAll(items);
      return Promise.resolve(newItems);
    },

    // Update existing item
    update: (id, data) => {
      const items = getAll();
      const index = items.findIndex(i => i.id === id);
      if (index === -1) {
        return Promise.reject(new Error(`${entityName} not found`));
      }
      items[index] = {
        ...items[index],
        ...data,
        updated_date: new Date().toISOString(),
      };
      saveAll(items);
      return Promise.resolve(items[index]);
    },

    // Delete item
    delete: (id) => {
      const items = getAll();
      const filtered = items.filter(i => i.id !== id);
      saveAll(filtered);
      return Promise.resolve({ success: true });
    },
  };
}

// Entity stores
export const db = {
  Company: createEntityStore('companies'),
  MaterialTopic: createEntityStore('material_topics'),
  MaterialityAssessment: createEntityStore('materiality_assessments'),
  GapAnalysis: createEntityStore('gap_analyses'),
  ActionItem: createEntityStore('action_items'),
  Document: createEntityStore('documents'),
};

// Auth simulation (for now, just a hardcoded user)
const DEFAULT_USER = {
  id: 'user_1',
  email: 'demo@example.com',
  full_name: 'Demo User',
  company_id: null, // Will be set after company setup
};

export const auth = {
  me: () => {
    const userData = localStorage.getItem(`${STORAGE_PREFIX}current_user`);
    if (userData) {
      return Promise.resolve(JSON.parse(userData));
    }
    // Initialize with default user
    localStorage.setItem(`${STORAGE_PREFIX}current_user`, JSON.stringify(DEFAULT_USER));
    return Promise.resolve(DEFAULT_USER);
  },

  updateMe: (data) => {
    const currentUser = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}current_user`) || '{}');
    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem(`${STORAGE_PREFIX}current_user`, JSON.stringify(updatedUser));
    return Promise.resolve(updatedUser);
  },

  logout: () => {
    // For local dev, just reload the page
    window.location.reload();
  },
};

// File handling (stores as base64 in localStorage - limited but works for dev)
export const files = {
  upload: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result, // base64 encoded
          created_at: new Date().toISOString(),
        };
        
        // Store file data
        const filesData = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}files`) || '[]');
        filesData.push(fileData);
        localStorage.setItem(`${STORAGE_PREFIX}files`, JSON.stringify(filesData));
        
        resolve({ 
          file_url: `local://${fileData.id}`,
          file_id: fileData.id 
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  get: (fileId) => {
    const filesData = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}files`) || '[]');
    return filesData.find(f => f.id === fileId);
  },

  getUrl: (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('local://')) {
      const fileId = fileUrl.replace('local://', '');
      const file = files.get(fileId);
      return file?.data || null;
    }
    return fileUrl;
  }
};

// Utility to clear all data (useful for testing)
export const clearAllData = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};

// Export as a single object similar to base44 client
export default {
  entities: db,
  auth,
  files,
  clearAllData,
};
