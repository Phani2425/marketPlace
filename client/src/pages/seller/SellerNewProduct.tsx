// src/pages/seller/SellerNewProduct.tsx
import { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaUpload } from 'react-icons/fa';
import axios from 'axios';
import { RootState } from '../../redux/store';
import SellerSidebar from '../../components/seller/SellerSidebar';

interface FormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: ''
};

const categories = [
  'Electronics',
  'Fashion',
  'Home & Living',
  'Books',
  'Sports',
  'Beauty',
  'Other'
];

const SellerNewProduct = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length + photos.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    setPhotos(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    if (photos.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value.toString());
    });

    photos.forEach(photo => {
      formDataToSend.append('photos', photo);
    });

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/seller/product/new?id=${user._id}`,
        formDataToSend
      );
      toast.success('Product added successfully');
      navigate('/seller/products');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Error adding product');
      } else {
        toast.error('Error adding product');
      }
     
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <SellerSidebar />
      <main className="new-product">
        <div className="form-container">
          <h1>Add New Product</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Product Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price</label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock</label>
                <input
                  type="number"
                  id="stock"
                  value={formData.stock}
                  onChange={e => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={6}
                placeholder="Enter product description"
              />
            </div>

            <div className="image-upload-section">
              <label>Product Images</label>
              <div 
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="file-input"
                />
                <div className="upload-prompt">
                  <FaUpload className="upload-icon" />
                  <p>Drag & drop images here or click to browse</p>
                  <span>Maximum 5 images</span>
                </div>
              </div>

              {previews.length > 0 && (
                <div className="preview-grid">
                  {previews.map((preview, index) => (
                    <div key={index} className="preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button 
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="remove-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SellerNewProduct;