import { motion } from 'framer-motion';
import { FaBox, FaTags } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ProductForCard } from '../../types/types';

interface ProductCardProps {
  product: ProductForCard;
  variant: 'seller' | 'admin';
  onClick?: () => void;
}

const ProductCard = ({ product, variant, onClick }: ProductCardProps) => {
  return (
    <motion.div
      className={`product-card ${variant}`}
      whileHover={{ y: -5 }}
      onClick={onClick}
    >
      <div className="image-container">
        <img src={product.photos[0]?.url} alt={product.name} />
        <div className={`status-badge ${product.status.toLowerCase()}`}>
          {product.status}
        </div>
      </div>
      
      <div className="content">
        <h3>{product.name}</h3>
        <p className="price">₹{product.price.toLocaleString()}</p>
        
        <div className="meta-info">
          <span className="stock">
            <FaBox /> {product.stock} in stock
          </span>
          <span className="category">
            <FaTags /> {product.category}
          </span>
        </div>

        {variant === 'seller' && (
          <div className="actions">
            <Link to={`/seller/product/edit/${product._id}`} className="edit-btn">
              Edit
            </Link>
            <button className="delete-btn">Delete</button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;