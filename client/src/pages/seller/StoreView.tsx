import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaStar, FaStore, FaShareAlt, FaMapMarkerAlt, 
  FaCalendarAlt, FaBox, FaTag, FaSearch 
} from 'react-icons/fa';
import { Skeleton } from '../../components/loader';
import ProductCard from '../../components/product-card';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

interface Store {
  _id: string;
  storeName: string;
  storeDescription: string;
  storeImage: string;
  sellerRating: number;
  totalProducts: number;
  joinedDate: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  photos: { url: string }[];
}

const StoreView = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_SERVER}/api/v1/seller/store/${storeId}`
        );
        setStore(data.seller);
        setProducts(data.products);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error fetching store details');
      } finally {
        setLoading(false);
      }
    };

    if (storeId) fetchStoreDetails();
  }, [storeId]);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => 
      searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
    toast.success('Store link copied!');
  };

  if (loading) return <Skeleton length={20} />;

  return (
    <div className="store-view">
      <motion.div 
        className="store-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="store-header">
          <motion.div 
            className="store-avatar"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {store?.storeImage ? (
              <img src={store.storeImage} alt={store.storeName} />
            ) : (
              <FaStore />
            )}
          </motion.div>

          <div className="store-info">
            <motion.h1
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {store?.storeName}
            </motion.h1>

            <motion.div 
              className="store-stats"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { icon: FaStar, text: `${store?.sellerRating?.toFixed(1)} Rating` },
                { icon: FaBox, text: `${store?.totalProducts} Products` },
                { icon: FaCalendarAlt, text: `Joined ${new Date(store?.joinedDate || '').toLocaleDateString()}` },
                { icon: FaMapMarkerAlt, text: 'India' }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  className="stat"
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.05 }}
                >
                  <stat.icon />
                  <span>{stat.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.p 
              className="store-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {store?.storeDescription}
            </motion.p>

            <motion.button
              className="share-btn"
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaShareAlt />
              Share Store
              <AnimatePresence>
                {showShareTooltip && (
                  <motion.span 
                    className="tooltip"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Link copied!
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="store-content">
        <motion.div 
          className="filters-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="categories">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                onClick={() => setActiveCategory(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeCategory + searchQuery}
            className="products-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {filteredProducts.length === 0 ? (
              <motion.div 
                className="no-products"
                variants={itemVariants}
              >
                <FaBox />
                <h3>No products found</h3>
                <p>Try a different search or category</p>
              </motion.div>
            ) : (
              filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                >
                  <ProductCard
                    productId={product._id}
                    name={product.name}
                    price={product.price}
                    stock={product.stock}
                    photos={product.photos}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StoreView;