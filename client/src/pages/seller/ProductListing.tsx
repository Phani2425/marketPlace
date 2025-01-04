import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaEdit, FaTrash, FaPlus, FaBox, FaTags } from "react-icons/fa";
import { RootState } from "../../redux/store";
import { Skeleton } from "../../components/loader";
import SellerSidebar from "../../components/seller/SellerSidebar";
import Modal from "../../components/Modal";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: "pending" | "approved" | "rejected";
  photos: { url: string }[];
}

const ProductListing = () => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER}/api/v1/seller/products?id=${user?._id}`
      );
      setProducts(data.products);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "something went wrong");
      } else {
        toast.error("Error fetching products");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProductId) return;

    try {
      await axios.delete(
        `${
          import.meta.env.VITE_SERVER
        }/api/v1/seller/product/${selectedProductId}?id=${user?._id}`
      );
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "something went wrong");
      } else {
        toast.error("Error deleting product:");
      }
    } finally {
      setIsModalOpen(false);
      setSelectedProductId(null);
    }
  };

  const openModal = (productId: string) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProductId(null);
  };

  return (
    <div className="admin-container">
      <SellerSidebar />
      <div className="seller-product-listing">
        <div className="header">
          <h2>My Products</h2>
          <Link to="/seller/product/new" className="add-product-btn">
            <FaPlus /> Add New Product
          </Link>
        </div>

        {loading ? (
          <div className="products-grid">
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <Skeleton key={index} className="product-card-skeleton" />
              ))}
          </div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <h3>No products available</h3>
            <p>Start selling by adding your first product</p>
            <Link to="/seller/product/new" className="add-first-product">
              <FaPlus /> Add Product
            </Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-image">
                  <img src={product.photos[0].url} alt={product.name} />
                  <div className={`status-badge ${product.status}`}>
                    {product.status}
                  </div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="price">₹{product.price}</p>
                  <div className="meta-info">
                    <span className="stock">
                      <FaBox /> {product.stock} in stock
                    </span>
                    <span className="category">
                      <FaTags /> {product.category}
                    </span>
                  </div>
                </div>
                <div className="actions">
                  <Link
                    to={`/seller/product/${product._id}`}
                    className="edit-btn"
                  >
                    <FaEdit /> Edit
                  </Link>
                  <button
                    onClick={() => openModal(product._id)}
                    className="delete-btn"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          onConfirm={handleDelete}
          title="Delete Product"
          message="Are you sure you want to delete this product?"
        >
          <div className="modal-actions">
            <button onClick={handleDelete} className="delete-btn">
              Delete
            </button>
            <button onClick={closeModal} className="cancel-btn">
              Cancel
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ProductListing;
