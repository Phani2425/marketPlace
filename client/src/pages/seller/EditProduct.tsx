import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useFileHandler } from "6pp";
import { RootState } from '../../redux/store';
import SellerSidebar from '../../components/seller/SellerSidebar';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: ''
  });

  const photos = useFileHandler("multiple", 10, 5);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_SERVER}/api/v1/seller/product/${id}?id=${user?._id}`
        );
        setProduct(data.product);
        setFormData({
          name: data.product.name,
          description: data.product.description,
          price: data.product.price,
          stock: data.product.stock,
          category: data.product.category
        });
      } catch (error) {
        toast.error('Error fetching product');
        navigate('/seller/products');
      }
    };

    if (id && user?._id) fetchProduct();
  }, [id, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productFormData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof typeof formData] !== product[key]) {
          productFormData.append(key, formData[key as keyof typeof formData].toString());
        }
      });

      if (photos.file && photos.file.length > 0) {
        photos.file.forEach(file => {
          productFormData.append("photos", file);
        });
      }

      const { data } = await axios.put(
        `${import.meta.env.VITE_SERVER}/api/v1/seller/product/${id}?id=${user?._id}`,
        productFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success(data.message);
      navigate('/seller/products');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'something went wrong');
      } else {
        toast.error('Error fetching analytics');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  return (
    <div className="admin-container">
      <SellerSidebar />
      <main className="product-management">
        <article>
          <form onSubmit={handleSubmit}>
            <h2>Edit Product</h2>
            
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="stock">Stock</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="Enter stock quantity"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Product Photos</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={photos.changeHandler}
                required
              />
              {photos.error && <p className="error">{photos.error}</p>}
              
              {photos.preview && (
                <div className="preview-images">
                  {photos.preview.map((img, i) => (
                    <img key={i} src={img} alt="Preview" />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Product"}
            </button>
          </form>
        </article>
      </main>
    </div>
  );
};

export default EditProduct;