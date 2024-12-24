import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, DoughnutChart, BarChart } from '../../components/admin/Charts';
import { RootState } from '../../redux/store';
import SellerSidebar from '../../components/seller/SellerSidebar';
import { Skeleton } from '../../components/loader';
import axios from 'axios';
import { getLastMonths } from '../../utils/features';
import { FaChartLine, FaChartPie, FaChartBar } from 'react-icons/fa';
import toast from 'react-hot-toast'

const { last6Months: months } = getLastMonths();

interface AnalyticsData {
  dailyRevenue: number[];
  dailySales: number[];
  monthlyRevenue: number[];
  monthlySales: number[];
  categoryDistribution: Record<string, number>;
  stockStatus: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    photo: string; // Include the photo property
  }>;
  performanceMetrics: {
    conversionRate: number;
    averageOrderValue: number;
    returnRate: number;
  };
}

const Analytics = () => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'revenue' | 'products' | 'insights'>('revenue');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_SERVER}/api/v1/seller/analytics/${user?._id}?id=${user?._id}`
        );
        if (data.success) {
          setAnalytics(data.analytics);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || 'Error fetching analytics');
        } else {
          toast.error('Error fetching analytics');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) fetchAnalytics();
  }, [user]);

  if (loading) {
    return <Skeleton length={20} />;
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="admin-container">
      <SellerSidebar />
      <main className="seller-analytics">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
          <div className="tab-buttons">
            {[
              { id: 'revenue', icon: <FaChartLine />, label: 'Revenue' },
              { id: 'products', icon: <FaChartPie />, label: 'Products' },
              { id: 'insights', icon: <FaChartBar />, label: 'Insights' }
            ].map(tab => (
              <motion.button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.icon} {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="analytics-content"
          >
            {activeTab === 'revenue' && (
              <div className="revenue-analytics">
                <section className="chart-section">
                  <h2>Revenue Trends</h2>
                  <LineChart
                    data={analytics.monthlyRevenue}
                    label="Monthly Revenue"
                    backgroundColor="rgba(53, 162, 235, 0.5)"
                    borderColor="rgb(53, 162, 235)"
                    labels={months}
                  />
                </section>

                <section className="chart-section">
                  <h2>Sales Performance</h2>
                  <BarChart
                    data_1={analytics.monthlySales}
                    data_2={analytics.monthlyRevenue}
                    title_1="Sales"
                    title_2="Revenue"
                    bgColor_1="rgb(75, 192, 192)"
                    bgColor_2="rgb(53, 162, 235)"
                    labels={months}
                  />
                </section>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="product-analytics">
                <section className="chart-section">
                  <h2>Category Distribution</h2>
                  <DoughnutChart
                    labels={Object.keys(analytics.categoryDistribution)}
                    data={Object.values(analytics.categoryDistribution)}
                    backgroundColor={[
                      'rgb(255, 99, 132)',
                      'rgb(54, 162, 235)',
                      'rgb(255, 206, 86)',
                      'rgb(75, 192, 192)',
                      'rgb(153, 102, 255)'
                    ]}
                  />
                </section>

                <section className="chart-section">
                  <h2>Stock Status</h2>
                  <DoughnutChart
                    labels={['In Stock', 'Low Stock', 'Out of Stock']}
                    data={[
                      analytics.stockStatus.inStock,
                      analytics.stockStatus.lowStock,
                      analytics.stockStatus.outOfStock
                    ]}
                    backgroundColor={[
                      'rgb(75, 192, 192)',
                      'rgb(255, 206, 86)',
                      'rgb(255, 99, 132)'
                    ]}
                  />
                </section>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="performance-insights">
                <div className="metrics-grid">
                  {Object.entries(analytics.performanceMetrics).map(([key, value]) => (
                    <motion.div
                      key={key}
                      className="metric-card"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3>{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                      <p>{typeof value === 'number' ? `${value.toFixed(2)}%` : value}</p>
                    </motion.div>
                  ))}
                </div>

                <section className="top-products">
                  <h2>Top Performing Products</h2>
                  <div className="products-grid">
                    {analytics.topProducts.map((product, index) => (
                      <motion.div
                        key={product.name}
                        className="product-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <img src={product.photo} alt={product.name} className="product-photo" />
                        <div className="product-info">
                          <h3>{product.name}</h3>
                          <p>Sales: {product.sales}</p>
                          <p>Revenue: ₹{product.revenue}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Analytics;