import  { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Skeleton } from "../components/loader";
import ProductCard from "../components/product-card";
import { useLatestProductsQuery } from "../redux/api/productAPI";
import { addToCart } from "../redux/reducer/cartReducer";
import { CartItem } from "../types/types";
import videoCover from "../assets/videos/cover.mp4";
import { FaAnglesDown, FaHeadset  } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "6pp";
import { TbTruckDelivery } from "react-icons/tb";
import { LuShieldCheck } from "react-icons/lu";
import '../styles/_home.scss';

const clients = [
  {
    src: "https://www.vectorlogo.zone/logos/reactjs/reactjs-ar21.svg",
    alt: "react",
  },
  {
    src: "https://www.vectorlogo.zone/logos/nodejs/nodejs-ar21.svg",
    alt: "node",
  },
  {
    src: "https://www.vectorlogo.zone/logos/mongodb/mongodb-ar21.svg",
    alt: "mongodb",
  },
  {
    src: "https://www.vectorlogo.zone/logos/expressjs/expressjs-ar21.svg",
    alt: "express",
  },
  {
    src: "https://www.vectorlogo.zone/logos/js_redux/js_redux-ar21.svg",
    alt: "redux",
  },
  {
    src: "https://www.vectorlogo.zone/logos/typescriptlang/typescriptlang-ar21.svg",
    alt: "typescript",
  },
  {
    src: "https://www.vectorlogo.zone/logos/sass-lang/sass-lang-ar21.svg",
    alt: "sass",
  },
  {
    src: "https://www.vectorlogo.zone/logos/firebase/firebase-ar21.svg",
    alt: "firebase",
  },
  {
    src: "https://www.vectorlogo.zone/logos/figma/figma-ar21.svg",
    alt: "figma",
  },
  {
    src: "https://www.vectorlogo.zone/logos/github/github-ar21.svg",
    alt: "github",
  },
  {
    src: "https://www.vectorlogo.zone/logos/docker/docker-ar21.svg",
    alt: "Docker",
  },
  {
    src: "https://www.vectorlogo.zone/logos/kubernetes/kubernetes-ar21.svg",
    alt: "Kubernetes",
  },
  {
    src: "https://www.vectorlogo.zone/logos/nestjs/nestjs-ar21.svg",
    alt: "Nest.js",
  },
  {
    src: "https://www.vectorlogo.zone/logos/graphql/graphql-ar21.svg",
    alt: "GraphQL",
  },
  {
    src: "https://www.vectorlogo.zone/logos/jestjsio/jestjsio-ar21.svg",
    alt: "Jest",
  },
  {
    src: "https://www.vectorlogo.zone/logos/redis/redis-ar21.svg",
    alt: "Redis",
  },
  {
    src: "https://www.vectorlogo.zone/logos/postgresql/postgresql-ar21.svg",
    alt: "PostgreSQL",
  },
  {
    src: "https://www.vectorlogo.zone/logos/jenkins/jenkins-ar21.svg",
    alt: "Jenkins",
  },
];

const banners = [
  "https://res.cloudinary.com/dj5q966nb/image/upload/v1719253445/rmbjpuzctjdbtt8hewaz.png",
  "https://res.cloudinary.com/dj5q966nb/image/upload/v1719253433/ticeufjqvf6napjhdiee.png",
  "https://t4.ftcdn.net/jpg/02/49/50/15/360_F_249501541_XmWdfAfUbWAvGxBwAM0ba2aYT36ntlpH.jpg",
  "https://www.zilliondesigns.com/blog/wp-content/uploads/Ecommerce-Sales-Banner-9.jpg",
];

const categories = [
  "Electronics",
  "Mobiles",
  "Laptops",
  "Books",
  "Fashion",
  "Appliances",
  "Furniture",
  "Home Decor",
  "Grocery",
  "Beauty",
  "Toys",
  "Fitness",
];

const services = [
  {
    icon: <TbTruckDelivery />,
    title: "FREE AND FAST DELIVERY",
    description: "Free delivery for all orders over $200",
  },
  {
    icon: <LuShieldCheck />,
    title: "SECURE PAYMENT",
    description: "100% secure payment",
  },
  {
    icon: <FaHeadset />,
    title: "24/7 SUPPORT",
    description: "Get support 24/7",
  },
];

const Home = () => {
  const { data, isError, isLoading } = useLatestProductsQuery("");
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addToCartHandler = (cartItem: CartItem) => {
    if (cartItem.stock < 1) return toast.error("Out of Stock");
    dispatch(addToCart(cartItem));
    toast.success("Added to cart");
  };

  if (isError) toast.error("Cannot Fetch the Products");

  const coverMessage =
    "Fashion isn't just clothes; it's a vibrant language. Silhouettes and textures speak volumes, a conversation starter with every bold print. It's a way to tell our story, a confidence booster, or a playful exploration. From elegance to rebellion, fashion lets us navigate the world in style.".split(
      " "
    );

  return (
    <div className="home">

      <main className="main-content">
        {
          !isMobile && (
            <motion.aside 
          className={`categories ${isMobile ? 'mobile' : ''}`}
          initial={isMobile ? { x: "-100%" } : { opacity: 0 }}
          animate={isMobile ? { x: 0 } : { opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2>Categories</h2>
          <ul>
            {categories.map((category, index) => (
              <motion.li
                key={category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={`/search?category=${category.toLowerCase()}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.aside>
          )
        }

        <section className="content">
          <motion.div 
            className="banner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Slider
              autoplay
              autoplayDuration={3000}
              showNav={false}
              images={banners}
            />
          </motion.div>

          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Latest Products
            <Link to="/search" className="view-more">View More</Link>
          </motion.h2>

          <div className="products-grid">
            <AnimatePresence>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="product-skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Skeleton width="100%" height="200px" />
                      <Skeleton width="70%" height="20px" />
                      <Skeleton width="50%" height="20px" />
                    </motion.div>
                  ))
                : data?.products
                    .filter(
                      (product) =>
                        selectedCategory === "All" ||
                        product.category === selectedCategory
                    )
                    .map((product) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ProductCard
                          productId={product._id}
                          name={product.name}
                          price={product.price}
                          stock={product.stock}
                          handler={addToCartHandler}
                          photos={product.photos}
                        />
                      </motion.div>
                    ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <motion.section 
        className="video-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="video-overlay"></div>
        <video autoPlay loop muted src={videoCover} />
        <div className="video-content">
          <motion.h2
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Fashion Redefined
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {coverMessage.join(" ")}
          </motion.p>
        </div>
        <motion.span
          className="scroll-indicator"
          animate={{
            y: [0, 10, 0],
            transition: { duration: 1, repeat: Infinity },
          }}
        >
          <FaAnglesDown />
        </motion.span>
      </motion.section>

      <section className="services-section">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Our Services
        </motion.h2>
        <div className="services-grid">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="service-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="our-clients">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Our Clients
        </motion.h2>
        <div className="clients-grid">
            {clients.map((client, i) => (
              <motion.img
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                  transition: {
                    delay: i / 20,
                    ease: "circIn",
                  },
                }}
                src={client.src}
                alt={client.alt}
                key={i}
              />
            ))}
          </div>
          <motion.p
          className="clients-trust"
            initial={{ opacity: 0, y: -100 }}
            whileInView={{
              opacity: 1,
              y: 0,
              transition: {
                delay: clients.length / 20,
              },
            }}
          >
            Trusted By 100+ Companies in 30+ countries
          </motion.p>
      </section>
    </div>
  );
};

export default Home;

