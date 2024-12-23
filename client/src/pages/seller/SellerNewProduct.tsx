import { useFileHandler } from "6pp";
import { FormEvent, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from 'axios';
import { RootState } from "../../redux/store";
import SellerSidebar from "../../components/seller/SellerSidebar";

const SellerNewProduct = () => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: ""
  });

  const photos = useFileHandler("multiple", 10, 5);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productFormData = new FormData();
      
      // Validate form data
      if (!formData.name || !formData.price || formData.stock < 0 || !formData.category) {
        return toast.error("Please fill all required fields");
      }

      if (!photos.file || photos.file.length === 0) {
        return toast.error("Please add at least one photo");
      }

      // Append form data
      Object.keys(formData).forEach(key => {
        productFormData.append(key, formData[key as keyof typeof formData].toString());
      });

      // Append photos
      photos.file.forEach(file => {
        productFormData.append("photos", file);
      });

      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/seller/product/new?id=${user?._id}`,
        productFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success(data.message);
      navigate('/seller/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <SellerSidebar />
      <main className="product-management">
        <article>
          <form onSubmit={submitHandler}>
            <h2>Add New Product</h2>
            
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
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Enter product category"
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
              {isLoading ? "Adding..." : "Add Product"}
            </button>
          </form>
        </article>
      </main>
    </div>
  );
};

export default SellerNewProduct;