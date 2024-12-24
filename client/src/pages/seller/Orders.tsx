// client/src/pages/seller/Orders.tsx
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { RootState } from '../../redux/store';
import SellerSidebar from '../../components/seller/SellerSidebar';
import { Skeleton } from '../../components/loader';
import {  FaClock, FaShippingFast, FaCheckCircle } from 'react-icons/fa';

interface Order {
  _id: string;
  orderItems: {
    name: string;
    quantity: number;
    price: number;
    photo: string;
  }[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

const OrderStatus = {
  Processing: { icon: FaClock, color: '#f57c00' },
  Shipped: { icon: FaShippingFast, color: '#1976d2' },
  Delivered: { icon: FaCheckCircle, color: '#388e3c' }
};

const SellerOrders = () => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Processing' | 'Shipped' | 'Delivered'>('all');

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER}/api/v1/seller/orders?id=${user?._id}`
      );
      setOrders(data.orders);
    } catch (error) {
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  return (
    <div className="admin-container">
      <SellerSidebar />
      <main className="seller-orders">
        <div className="orders-header">
          <h1>Orders Management</h1>
          <div className="filter-buttons">
            {['all', 'Processing', 'Shipped', 'Delivered'].map((status) => (
              <motion.button
                key={status}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status as typeof filter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {loading ? (
          <Skeleton length={10} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              className="orders-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {filteredOrders.map((order) => {
                const StatusIcon = OrderStatus[order.status].icon;
                return (
                  <motion.div 
                    key={order._id}
                    className="order-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="order-header">
                      <h3>Order #{order._id.slice(0, 8)}</h3>
                      <span 
                        className={`status ${order.status.toLowerCase()}`}
                        style={{ color: OrderStatus[order.status].color }}
                      >
                        <StatusIcon />
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="order-items">
                      {order.orderItems.map((item, index) => (
                        <div key={index} className="item">
                          <img src={item.photo} alt={item.name} />
                          <div className="item-details">
                            <h4>{item.name}</h4>
                            <p>Quantity: {item.quantity}</p>
                            <p>₹{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-footer">
                      <div className="customer-info">
                        <h4>Customer Details</h4>
                        <p>{order.user.name}</p>
                        <p>{order.user.email}</p>
                      </div>
                      <div className="order-total">
                        <h4>Order Total</h4>
                        <p>₹{order.total}</p>
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default SellerOrders;