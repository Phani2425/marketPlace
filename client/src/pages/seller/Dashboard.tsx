import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { BarChart, DoughnutChart } from '../../components/admin/Charts';
import { Skeleton } from '../../components/loader';
import { RootState, server } from '../../redux/store';
import axios from 'axios';
import SellerSidebar from '../../components/seller/SellerSidebar';
import { FaBox, FaMoneyBillWave, FaShoppingCart } from 'react-icons/fa';
import { getLastMonths } from '../../utils/features';
import toast from 'react-hot-toast'

const { last6Months: months } = getLastMonths();

interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number[];
  monthlySales: number[];
  productCategories: Record<string, number>;
  recentOrders: any[];
}

const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: [],
    monthlySales: [],
    productCategories: {},
    recentOrders: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user?._id) return;
        const { data } = await axios.get(
          `${server}/api/v1/seller/stats/${user._id}?id=${user._id}`
        );
        setStats(data.stats);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || 'Error fetching dashboard stats');
        } else {
          toast.error('Error fetching dashboard stats');
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchStats();
  }, [user]);

  return (
    <div className="admin-container">
      <SellerSidebar />
      <main className="seller-dashboard">
        {loading ? (
          <Skeleton length={20} />
        ) : (
          <>
            <section className="widget-container">
              <WidgetItem
                icon={<FaBox />}
                title="Total Products"
                value={stats.totalProducts}
                color="rgb(0, 115, 255)"
              />
              <WidgetItem
                icon={<FaShoppingCart />}
                title="Total Orders"
                value={stats.totalOrders}
                color="rgb(0 198 202)"
              />
              <WidgetItem
                icon={<FaMoneyBillWave />}
                title="Total Revenue"
                value={stats.totalRevenue}
                color="rgb(76 0 255)"
                isMoney
              />
            </section>

            <section className="charts-container">
              <div className="chart-card">
                <h2>Revenue & Sales Analytics</h2>
                <BarChart
                  data_1={stats.monthlyRevenue}
                  data_2={stats.monthlySales}
                  title_1="Revenue"
                  title_2="Sales"
                  bgColor_1="rgb(0, 115, 255)"
                  bgColor_2="rgba(53, 162, 235, 0.8)"
                  labels={months}
                />
              </div>

              <div className="chart-card">
                <h2>Product Categories</h2>
                <DoughnutChart
                  labels={Object.keys(stats.productCategories)}
                  data={Object.values(stats.productCategories)}
                  backgroundColor={[
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 206, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)'
                  ]}
                />
              </div>
            </section>

            <section className="recent-orders">
              <h2>Recent Orders</h2>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(0, 8)}</td>
                      <td>{order.orderItems[0].name}</td>
                      <td>₹{order.total}</td>
                      <td className={`status ${order.status.toLowerCase()}`}>
                        {order.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

interface WidgetItemProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
  isMoney?: boolean;
}

const WidgetItem = ({ icon, title, value, isMoney = false }: WidgetItemProps) => (
  <article className="widget">
    <div className="widget-info">
      {icon}
      <div>
        <p>{title}</p>
        <h4>{isMoney ? `₹${value}` : value}</h4>
      </div>
    </div>

  </article>
);

export default Dashboard;