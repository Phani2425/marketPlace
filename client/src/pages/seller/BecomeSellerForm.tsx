import { useState, FormEvent } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { RootState, server } from '../../redux/store';

const BecomeSellerForm = () => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post(
        `${server}/api/v1/seller/register?id=${user?._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      toast.success(data.message);
      navigate('/seller/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="become-seller-container">
      <div className="become-seller-content">
        <h1>Become a Seller</h1>
        <p>Join our marketplace and start selling your products</p>
        
        <form onSubmit={handleSubmit} className="seller-form">
          <div className="form-group">
            <label htmlFor="storeName">Store Name</label>
            <input
              type="text"
              id="storeName"
              value={formData.storeName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                storeName: e.target.value
              }))}
              placeholder="Enter your store name"
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="storeDescription">Store Description</label>
            <textarea
              id="storeDescription"
              value={formData.storeDescription}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                storeDescription: e.target.value
              }))}
              placeholder="Describe your store"
              required
              maxLength={500}
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BecomeSellerForm;