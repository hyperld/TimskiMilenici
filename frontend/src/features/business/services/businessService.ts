import { Business, PetService, Product } from '../types';

const API_URL = 'http://localhost:8080/api';

const getAuthToken = () => {
  const userDataStr = localStorage.getItem('petpal_user');
  return userDataStr ? JSON.parse(userDataStr)?.token : null;
};

export const businessService = {
  // Fetch all businesses
  getAllBusinesses: async (): Promise<Business[]> => {
    try {
      const response = await fetch(`${API_URL}/businesses`);
      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }
      const data = await response.json();
      return data.map((business: any) => ({
        ...business,
        id: business.id,
        type: business.category,
        address: business.address || '',
        images: business.imageUrls || []
      }));
    } catch (error) {
      console.error("getAllBusinesses error:", error);
      throw error;
    }
  },

  // Fetch business by ID
  getBusinessById: async (id: string | number): Promise<Business> => {
    const response = await fetch(`${API_URL}/businesses/${id}`);
    if (!response.ok) {
      throw new Error('Business not found');
    }
    const business = await response.json();
    return {
      ...business,
      type: business.category,
      address: business.address || '',
      images: business.imageUrls || []
    };
  },

  // Fetch business by owner ID
  getBusinessByOwner: async (ownerId: number): Promise<Business[]> => {
    try {
      const response = await fetch(`${API_URL}/businesses/my-business/${ownerId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch business');
      }
      const data = await response.json();
      const businesses = Array.isArray(data) ? data : (data ? [data] : []);
      return businesses.map((business: any) => ({
        ...business,
        id: business.id,
        type: business.category,
        address: business.address || '',
        images: business.imageUrls || []
      }));
    } catch (error) {
      console.error("getBusinessByOwner error:", error);
      throw error;
    }
  },

  /**
   * Upload an image file. Returns the public URL of the uploaded file.
   * POST /api/uploads with multipart form "file"
   */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/uploads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload image');
    }
    const data = await response.json();
    return { url: data.url };
  },

  // Update business details
  updateBusiness: async (id: number, businessData: any): Promise<Business> => {
    try {
      const payload = {
        id: id,
        name: businessData.name,
        description: businessData.description,
        category: businessData.type || businessData.category,
        address: businessData.address,
        owner: businessData.owner,
        imageUrls: businessData.imageUrls ?? businessData.images,
        mainImageUrl: businessData.mainImageUrl,
        contactPhone: businessData.contactPhone,
        contactEmail: businessData.contactEmail
      };

      const response = await fetch(`${API_URL}/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update business');
      }
      const data = await response.json();
      return {
        ...data,
        id: data.id,
        type: data.category,
        address: data.address || '',
        images: data.imageUrls || []
      };
    } catch (error) {
      console.error("updateBusiness error:", error);
      throw error;
    }
  },

  // Create new business
  createBusiness: async (businessData: any): Promise<Business> => {
    try {
      const payload = {
        name: businessData.name,
        description: businessData.description,
        address: businessData.address,
        category: businessData.type,
        owner: { id: businessData.ownerId },
        imageUrls: businessData.imageUrls,
        mainImageUrl: businessData.mainImageUrl,
        contactPhone: businessData.contactPhone,
        contactEmail: businessData.contactEmail
      };

      const response = await fetch(`${API_URL}/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create business');
      }
      const data = await response.json();
      return {
        ...data,
        id: data.id,
        type: data.category,
        address: data.address || '',
        images: data.imageUrls || []
      };
    } catch (error) {
      console.error("createBusiness error:", error);
      throw error;
    }
  },

  deleteBusiness: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/businesses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete store');
    }
  },

  // Upload an image
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/uploads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload image');
    }

    return await response.json();
  },

  // Manage Services
  saveService: async (serviceData: any): Promise<PetService> => {
    const isUpdate = !!serviceData.id;
    const url = isUpdate ? `${API_URL}/services/${serviceData.id}` : `${API_URL}/services`;
    const method = isUpdate ? 'PUT' : 'POST';

    const payload = {
      name: serviceData.name,
      price: parseFloat(serviceData.price),
      description: serviceData.description || '',
      capacity: parseInt(serviceData.capacity || 10),
      durationMinutes: parseInt(serviceData.durationMinutes || 30),
      business: { id: serviceData.storeId }
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to ${isUpdate ? 'update' : 'create'} service`);
    }

    return await response.json();
  },

  deleteService: async (serviceId: number): Promise<boolean> => {
    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete service');
    }
    return true;
  },

  // Manage Products
  saveProduct: async (productData: any): Promise<Product> => {
    const isUpdate = !!productData.id;
    const url = isUpdate ? `${API_URL}/products/${productData.id}` : `${API_URL}/products`;
    const method = isUpdate ? 'PUT' : 'POST';

    const payload = {
      name: productData.name,
      price: parseFloat(productData.price),
      description: productData.description || '',
      stockQuantity: parseInt(productData.stockQuantity || 100),
      business: { id: productData.storeId }
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to ${isUpdate ? 'update' : 'create'} product`);
    }

    return await response.json();
  },

  deleteProduct: async (productId: number): Promise<boolean> => {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
    return true;
  }
};
