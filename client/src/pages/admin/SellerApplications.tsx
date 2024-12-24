
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStore, FaUser, FaEnvelope, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { Skeleton } from '../../components/loader';

interface SellerApplication {
  _id: string;
  name: string;
  email: string;
  storeName: string;
  storeDescription: string;
  storeStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  storeImage?: string;
  storeCreatedAt?: string;
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Date unavailable';
  }
};

const SellerApplications = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const { user } = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER}/api/v1/admin/seller-applications?id=${user?._id}`
      );
      setApplications(data.applications);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Error fetching applications');
      } else {
        toast.error('Error fetching applications');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sellerId: string, status: 'approved' | 'rejected') => {
    setActionLoading(prev => ({ ...prev, [sellerId]: true }));
    
    try {
      await axios.put(
        `${import.meta.env.VITE_SERVER}/api/v1/admin/seller-status?id=${user?._id}`,
        { sellerId, status }
      );
      toast.success(`Seller ${status} successfully`);
      fetchApplications();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Error fetching applications');
      } else {
        toast.error('Error fetching applications');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [sellerId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminSidebar />
        <main className="seller-applications">
          <h1>Seller Applications</h1>
          <div className="applications-grid">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="application-card-skeleton" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="seller-applications">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Seller Applications
        </motion.h1>
        
        <AnimatePresence>
          <motion.div 
            className="applications-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {applications.map((application) => (
              <motion.div 
                key={application._id}
                className="application-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ y: -5 }}
              >
                <div className="store-info">
                  <div className="store-header">
                    {application.storeImage ? (
                      <img src={application.storeImage} alt={application.storeName} />
                    ) : (
                      <FaStore className="store-icon" />
                    )}
                    <h2>{application.storeName}</h2>
                  </div>
                  <p className="description">{application.storeDescription}</p>
                </div>

                <div className="seller-info">
                  <div className="info-item">
                    <FaUser />
                    <p><strong>Name:</strong> {application.name}</p>
                  </div>
                  <div className="info-item">
                    <FaEnvelope />
                    <p><strong>Email:</strong> {application.email}</p>
                  </div>
                  <div className="info-item">
                    <FaClock />
                    <p><strong>Applied:</strong> {formatDate(application.storeCreatedAt || application.createdAt)}</p>
                  </div>
                </div>

                <div className="actions">
                  <motion.button
                    className={`approve-btn ${actionLoading[application._id] ? 'loading' : ''}`}
                    onClick={() => handleStatusUpdate(application._id, 'approved')}
                    disabled={actionLoading[application._id]}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaCheck /> Approve
                  </motion.button>
                  <motion.button
                    className={`reject-btn ${actionLoading[application._id] ? 'loading' : ''}`}
                    onClick={() => handleStatusUpdate(application._id, 'rejected')}
                    disabled={actionLoading[application._id]}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaTimes /> Reject
                  </motion.button>
                </div>
              </motion.div>
            ))}

            {applications.length === 0 && (
              <motion.div 
                className="no-applications"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FaStore className="empty-icon" />
                <p>No pending applications</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SellerApplications;