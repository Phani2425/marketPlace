import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiShoppingBag, FiTruck, FiUserPlus } from "react-icons/fi";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useDispatch } from "react-redux";
import { userExist } from "../redux/reducer/userReducer";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { server } from "../redux/store";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [gender, setGender] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginHandler = async () => {
    try {
      setIsLoading(true);

      if (isAdminMode) {
        try {
          const { data } = await axios.post(
            `${server}/api/v1/user/admin-login`,
            { secretKey: adminKey.trim() }
            
          );

          if (data.success) {
            const adminData = {
              user: data.user,
              expiresAt: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours
            };
            localStorage.setItem("adminData", JSON.stringify(adminData));
            toast.success("Welcome Admin!");
            dispatch(userExist(data.user));
            setTimeout(() => {
              navigate("/admin/dashboard", { replace: true });
            }, 100);
            return;
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            toast.error(
              error.response?.data?.message || "Invalid admin credentials"
            );
          } else {
            toast.error("Login failed");
          }
        }
        return;
      }

      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      const res = await axios.post(
        `${server}/api/v1/user/new`,
        {
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          gender,
          dob: date,
          _id: user.uid,
        }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(userExist(res.data.user));
        navigate("/");
      }
    } catch (error) {
      toast.error("Sign In Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (mode: "user" | "admin") => {
    setIsAdminMode(mode === "admin");
    setAdminKey("");
  };

  return (
    <div className="login">
      <div className="info-section">
        <div className="content">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Welcome to DisposableMart
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Join our thriving marketplace where quality meets convenience.
          </motion.p>

          <div className="features">
            <motion.div
              className="feature-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FiShoppingBag />
              <span>Premium Shopping Experience</span>
            </motion.div>
            <motion.div
              className="feature-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FiTruck />
              <span>Fast & Secure Delivery</span>
            </motion.div>
            <motion.div
              className="feature-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <FiUserPlus />
              <span>Start Selling Today</span>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <main>
          <div className="login-type-toggle">
            <button
              className={!isAdminMode ? "active" : ""}
              onClick={() => toggleMode("user")}
            >
              User Login
            </button>
            <button
              className={isAdminMode ? "active" : ""}
              onClick={() => toggleMode("admin")}
            >
              Admin Login
            </button>
          </div>

          <motion.h2
            className="heading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isAdminMode
              ? "Admin Login"
              : isNewUser
              ? "Create Account"
              : "Sign In"}
          </motion.h2>

          {isAdminMode ? (
            <motion.div
              className="form-group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <label>Admin Secret Key</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin secret key"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <motion.p
                className="subheading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {isNewUser
                  ? "Please fill in your details to get started"
                  : "Welcome back! Continue with Google to access your account"}
              </motion.p>

              {isNewUser && (
                <>
                  <motion.div
                    className="form-group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label>Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required={isNewUser}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </motion.div>

                  <motion.div
                    className="form-group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required={isNewUser}
                    />
                  </motion.div>
                </>
              )}
            </>
          )}

          <motion.button
            className={`login-btn ${isAdminMode ? "admin" : ""}`}
            onClick={loginHandler}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isAdminMode ? (
              isLoading ? (
                "Logging in..."
              ) : (
                "Login as Admin"
              )
            ) : (
              <>
                <span className="google-icon">
                  <FcGoogle />
                </span>
                {isLoading ? "Signing In..." : "Continue with Google"}
              </>
            )}
          </motion.button>

          {!isAdminMode && (
            <motion.p
              className="toggle-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setIsNewUser(!isNewUser)}
            >
              {isNewUser
                ? "Already have an account? Sign In"
                : "New to DisposableMart? Create Account"}
            </motion.p>
          )}
          

          <Link to="/seller-login" className="seller-login-link">
            Login as Seller
          </Link>
        </main>
      </div>
    </div>
  );
};

export default Login;
