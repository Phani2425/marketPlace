import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import {useSelector} from 'react-redux';

interface SellerApplication {
  _id: string;
  name: string;
  email: string;
  storeName: string;
  storeDescription: string;
  storeStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const SellerApplications = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sellerId: string, status: 'approved' | 'rejected') => {
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_SERVER}/api/v1/admin/seller-status?id=${user?._id}`,
        { sellerId, status }
      );
      toast.success(data.message);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="seller-applications">
        <h1>Seller Applications</h1>
        
        <div className="applications-grid">
          {applications.map((application) => (
            <motion.div 
              key={application._id}
              className="application-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="store-info">
                <h2>{application.storeName}</h2>
                <p className="description">{application.storeDescription}</p>
              </div>

              <div className="seller-info">
                <p><strong>Seller Name:</strong> {application.name}</p>
                <p><strong>Email:</strong> {application.email}</p>
                <p><strong>Applied:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="actions">
                <button
                  className="approve-btn"
                  onClick={() => handleStatusUpdate(application._id, 'approved')}
                >
                  Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleStatusUpdate(application._id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            </motion.div>
          ))}

          {applications.length === 0 && !loading && (
            <p className="no-applications">No pending applications</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerApplications;