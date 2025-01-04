import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaStar,
  FaStore,
  FaShareAlt,
  FaCalendarAlt,
  FaBox,
  FaSearch,
  FaRegStar,
} from "react-icons/fa";
import { Skeleton } from "../../components/loader";
import ProductCard from "../../components/product-card";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { CartItem } from "../../types/types.js";
import { Product } from "../../types/types.js";
import { addToCart } from "../../redux/reducer/cartReducer";
import "../../styles/seller/_storeView.scss";
import ShareModal from "../../components/shared/ShareModal";
import { useRating } from "6pp";


// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

interface Store {
  storeName: string;
  storeDescription: string;
  storeImage: string;
  storeBanner: string;
  sellerRating: number;
  totalProducts: number;
  storeCreatedAt?: string | Date;
  createdAt?: string | Date;
}

const StoreView = () => {
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return "Recently";
    }
  };

  const { id } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  // const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [showShareModal, setShowShareModal] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const { Ratings: RatingsEditable, rating } = useRating({
    IconFilled: <FaStar />,
    IconOutline: <FaRegStar />,
    value: 0,
    selectable: true,
    styles: {
      fontSize: "1.75rem",
      color: "coral",
      justifyContent: "flex-start",
    },
  });
  const isStoreOwner = user?._id === id;

  const dispatch = useDispatch();

  const addToCartHandler = (cartItem: CartItem) => {
    if (cartItem.stock < 1) return toast.error("Out of Stock");
    dispatch(addToCart(cartItem));
    toast.success("Added to cart");
  };

  useEffect(() => {
    console.log("StoreView Mounted");
    console.log("Store ID:", id);
  }, []);

  const fetchStoreDetails = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER}/api/v1/seller/store/${id}`
      );

      setStore(data.store);
      setProducts(data.store.products || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Error fetching store details"
        );
      } else {
        toast.error("Error fetching store details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStoreDetails();
  }, [id]);

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter(
      (p) =>
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: store?.storeName || "Store",
          text: store?.storeDescription || "",
          url: window.location.href,
        })
        .catch(() => {
          setShowShareModal(true);
        });
    } else {
      setShowShareModal(true);
    }
  };

  const handleRatingSubmit = async () => {
    if (!user) {
      toast.error("Please login to rate the store");
      return;
    }

    if (!rating) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setRatingSubmitting(true);
      await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/seller/rate/${id}`,
        { rating, userId: user._id }
      );
      
      await fetchStoreDetails();
      toast.success("Rating submitted successfully");
      setShowRatingModal(false);
    } catch (error) {
      toast.error("Failed to submit rating");
    } finally {
      setRatingSubmitting(false);
    }
  };


  const stats = [
    {
      icon: FaStar,
      text: `${store?.sellerRating?.toFixed(1) || "0.0"} Rating`,
      value: true, // Always show rating
    },
    {
      icon: FaBox,
      text: `${store?.totalProducts || 0} Products`,
      value: true, // Always show products count
    },
    {
      icon: FaCalendarAlt,
      text: `Joined ${formatDate(store?.storeCreatedAt || store?.createdAt)}`,
      value: true,
    },
  ];

  if (loading) return <Skeleton length={20} />;

  if (!store) return <div>Store not found</div>;

  return (
    <div className="store-view">
      {store?.storeBanner && (
        <motion.div
          className="store-banner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img src={store.storeBanner} alt="Store Banner" />
        </motion.div>
      )}

      <motion.div
        className="store-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="store-header">
          <motion.div
            className="store-avatar"
            whileHover={{ scale: 1.05 }}
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

            <div className="store-stats">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  // Remove whileHover animation that caused bouncing
                >
                  <stat.icon className="stat-icon" />
                  <span>{stat.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="store-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {store?.storeDescription}
            </motion.p>

            {!isStoreOwner && (
              <motion.button
                className="rate-store-btn"
                onClick={() => setShowRatingModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaStar /> Rate Store
              </motion.button>
            )}

            {isStoreOwner && (
              <motion.button
                className="share-btn"
                onClick={handleShare}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaShareAlt />
                Share Store
              </motion.button>
            )}
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
                className={activeCategory === category ? "active" : ""}
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
              <motion.div className="no-products" variants={itemVariants}>
                <FaBox />
                <h3>No products found</h3>
                <p>Try a different search or category</p>
              </motion.div>
            ) : (
              filteredProducts.map((product) => (
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
                    handler={addToCartHandler}
                    photos={product.photos.map((photo) => ({
                      url: photo.url,
                      public_id: photo.public_id,
                    }))}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.href}
        title={store?.storeName || "Store"}
        image={store?.storeImage}
      />

      {showRatingModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRatingModal(false)}
        >
          <motion.div
            className="rating-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2>Rate this Store</h2>
            <div className="rating-input">
              <RatingsEditable />
            </div>
            <div className="modal-actions">
              <button
                className="submit-btn"
                onClick={handleRatingSubmit}
                disabled={ratingSubmitting}
              >
                {ratingSubmitting ? "Submitting..." : "Submit Rating"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowRatingModal(false)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StoreView;
