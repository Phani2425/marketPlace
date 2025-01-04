// src/pages/admin/SellerDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaStar,
  FaBox,
  FaChartLine,
  FaUsers,
  FaShoppingCart,
  FaBan,
  FaEnvelope,
  FaTags,
} from "react-icons/fa";
import { LineChart, DoughnutChart } from "../../components/admin/Charts";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Skeleton } from "../../components/loader";
import { getLastMonths } from "../../utils/features";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";

const { last6Months: months } = getLastMonths();

interface SellerDetail {
  _id: string;
  name: string;
  email: string;
  storeName: string;
  storeDescription: string;
  storeImage: string;
  storeBanner: string;
  sellerRating: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  storeCreatedAt: string;
  status: "active" | "blocked" | "deregistered";
  monthlyRevenue: number[];
  monthlySales: number[];
  categoryDistribution: {
    [key: string]: number;
  };
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    photo: string;
  }>;
  performanceMetrics: {
    conversionRate: string;
    averageOrderValue: number;
    returnRate: number;
  };
  recentOrders: Array<{
    _id: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  products: Array<{
    _id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    photo: string;
    status: string;
  }>;
}

interface ProductDetail {
  name: string;
  photo: string;
  price?: number;
  revenue?: number;
  stock?: number;
  category?: string;
  status?: string;
  sales?: number;
}

const SellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "orders"
  >("overview");
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"block" | "deregister" | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null
  );

  useEffect(() => {
    const fetchSellerDetails = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_SERVER}/api/v1/admin/seller/${id}?id=${
            user?._id
          }`
        );
        setSeller(data.seller);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.message || "Error fetching seller details"
          );
        } else {
          toast.error("Error fetching seller details");
        }
        navigate("/admin/sellers");
      } finally {
        setLoading(false);
      }
    };

    if (id && user?._id) fetchSellerDetails();
  }, [id, user?._id, navigate]);

  const handleAction = async () => {
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_SERVER}/api/v1/admin/seller-status?id=${
          user?._id
        }`,
        {
          sellerId: seller?._id,
          status: actionType === "block" ? "blocked" : "deregistered",
        }
      );
      toast.success(data.message);
      navigate("/admin/sellers");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Action failed");
      } else {
        toast.error("Action failed");
      }
    }
    setShowActionModal(false);
  };

  if (loading) return <Skeleton length={20} />;
  if (!seller) return <div>Seller not found</div>;

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="seller-detail">
        <motion.div
          className="seller-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="seller-info">
            <img
              src={seller.storeImage}
              alt={seller.storeName}
              className="store-image"
            />
            <div className="info-content">
              <h1>{seller.storeName}</h1>
              <div className="meta-info">
                <span className="rating">
                  <FaStar /> {seller.sellerRating.toFixed(1)}
                </span>
                <span className="products">
                  <FaBox /> {seller.totalProducts} Products
                </span>
                <span className="joined">
                  Joined {new Date(seller.storeCreatedAt).toLocaleDateString()}
                </span>
                <span className={`status ${seller.status}`}>
                  {seller.status}
                </span>
              </div>
              <p className="description">{seller.storeDescription}</p>
              <div className="contact-info">
                <FaEnvelope /> {seller.email}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="block-btn"
              onClick={() => {
                setActionType("block");
                setShowActionModal(true);
              }}
            >
              <FaBan /> {seller.status === "blocked" ? "Unblock" : "Block"}{" "}
              Seller
            </button>
            <button
              className="deregister-btn"
              onClick={() => {
                setActionType("deregister");
                setShowActionModal(true);
              }}
            >
              <FaBox /> Deregister Store
            </button>
          </div>
        </motion.div>

        <div className="metrics-grid">
          <motion.div
            className="metric-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <FaChartLine className="icon revenue" />
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <p>₹{seller.totalRevenue.toLocaleString()}</p>
            </div>
          </motion.div>

          <motion.div
            className="metric-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FaBox className="icon products" />
            <div className="metric-content">
              <h3>Total Products</h3>
              <p>{seller.totalProducts}</p>
            </div>
          </motion.div>

          <motion.div
            className="metric-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FaShoppingCart className="icon orders" />
            <div className="metric-content">
              <h3>Total Orders</h3>
              <p>{seller.totalOrders}</p>
            </div>
          </motion.div>

          <motion.div
            className="metric-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <FaUsers className="icon conversion" />
            <div className="metric-content">
              <h3>Conversion Rate</h3>
              <p>{seller.performanceMetrics.conversionRate}%</p>
            </div>
          </motion.div>
        </div>

        <div className="tab-navigation">
          {["overview", "products", "orders"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === "overview" && (
            <div className="overview-tab">
              <div className="charts-grid">
                <div className="chart-section">
                  <h2>Revenue Trends</h2>
                  {seller.monthlyRevenue && seller.monthlyRevenue.length > 0 ? (
                    <LineChart
                      data={seller.monthlyRevenue}
                      label="Monthly Revenue"
                      labels={months}
                      backgroundColor="rgba(53, 162, 235, 0.5)"
                      borderColor="rgb(53, 162, 235)"
                    />
                  ) : (
                    <p className="no-data">No revenue data available</p>
                  )}
                </div>
                <div className="chart-section">
                  <h2>Category Distribution</h2>
                  {Object.keys(seller.categoryDistribution || {}).length > 0 ? (
                    <DoughnutChart
                      labels={Object.keys(seller.categoryDistribution)}
                      data={Object.values(seller.categoryDistribution)}
                      backgroundColor={[
                        "rgb(255, 99, 132)",
                        "rgb(54, 162, 235)",
                        "rgb(255, 206, 86)",
                        "rgb(75, 192, 192)",
                        "rgb(153, 102, 255)",
                      ]}
                    />
                  ) : (
                    <p className="no-data">No category data available</p>
                  )}
                </div>
              </div>

              {seller.topProducts && seller.topProducts.length > 0 && (
                <div className="performance-section">
                  <h2>Top Performing Products</h2>
                  <div className="products-grid">
                    {seller.topProducts.map((product) => (
                      <motion.div
                        key={product.name}
                        className="product-card"
                        whileHover={{ y: -5 }}
                        onClick={() => setSelectedProduct(product)}
                      >
                        {product.photo && (
                          <img src={product.photo} alt={product.name} />
                        )}
                        <div className="product-info">
                          <h3>{product.name}</h3>
                          <div className="stats">
                            <span>Sales: {product.sales}</span>
                            <span>
                              Revenue: ₹{product.revenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div className="products-tab">
              <div className="products-grid">
                {seller.products &&
                  seller.products.map((product) => (
                    <motion.div
                      key={product._id}
                      className="product-card"
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img src={product.photo} alt={product.name} />
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="price">
                          ₹{product.price.toLocaleString()}
                        </p>
                        <p className="stock">
                          <FaBox /> {product.stock} in stock
                        </p>
                        <span
                          className={`status ${product.status.toLowerCase()}`}
                        >
                          {product.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="orders-tab">
              <div className="orders-grid">
                {seller.recentOrders &&
                  seller.recentOrders.map((order) => (
                    <motion.div
                      key={order._id}
                      className="order-card"
                      whileHover={{ y: -5 }}
                    >
                      <div className="order-header">
                        <span className="order-id">#{order._id.slice(-8)}</span>
                        <span
                          className={`status ${order.status.toLowerCase()}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="order-details">
                        <p className="total">₹{order.total.toLocaleString()}</p>
                        <p className="date">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {showActionModal && (
          <div className="modal-overlay">
            <motion.div
              className="confirmation-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2>{actionType === "block" ? "Block" : "Deregister"} Seller</h2>
              <p>
                {actionType === "block"
                  ? "This will prevent the seller from accessing their store and listing new products. All their products will be hidden from the marketplace."
                  : "This will permanently remove the seller's store and all their products from the marketplace. This action cannot be undone."}
              </p>
              <div className="modal-actions">
                <button className="confirm-btn" onClick={handleAction}>
                  Confirm
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedProduct && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              className="product-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedProduct(null)}
              >
                ×
              </button>
              <img src={selectedProduct.photo} alt={selectedProduct.name} />
              <div className="product-details">
                <h2>{selectedProduct.name}</h2>
                <p className="price">
                  ₹
                  {typeof selectedProduct.price === "number"
                    ? selectedProduct.price.toLocaleString()
                    : selectedProduct.revenue?.toLocaleString()}
                </p>
                {selectedProduct.stock && (
                  <p className="stock">
                    <FaBox /> Stock: {selectedProduct.stock}
                  </p>
                )}
                {selectedProduct.category && (
                  <p className="category">
                    <FaTags /> {selectedProduct.category}
                  </p>
                )}
                {selectedProduct.status && (
                  <p
                    className={`status ${selectedProduct.status.toLowerCase()}`}
                  >
                    Status: {selectedProduct.status}
                  </p>
                )}
                {selectedProduct.sales && (
                  <p className="sales">
                    <FaChartLine /> Total Sales: {selectedProduct.sales}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerDetail;
