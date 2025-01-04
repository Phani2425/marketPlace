import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaStore } from 'react-icons/fa';
import { userExist } from '../../redux/reducer/userReducer';
import { server } from '../../redux/store';

const SellerLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post(
        `${server}/api/v1/user/seller-login`,
        { email: email.trim(), pin: pin.trim() }
      );
  
      if (data.success) {
        
        const sellerData = {
          user: data.user,
          expiresAt: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours
        };
        localStorage.setItem("sellerData", JSON.stringify(sellerData));
        
        toast.success('Welcome back, Seller!');
        dispatch(userExist(data.user));
        navigate('/seller/dashboard');
      }
    }  catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Invalid credentials');
      } else {
        toast.error('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="seller-login">
      <motion.div 
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="login-header">
          <FaStore className="store-icon" />
          <h1>Seller Login</h1>
          <p>Access your seller dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pin">PIN</label>
            <div className="pin-input">
              <input
                type={showPin ? 'text' : 'password'}
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your seller PIN"
                required
              />
              <button
                type="button"
                className="toggle-pin"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <button onClick={() => navigate('/login')}>
            Back to main login
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SellerLogin;