// src/components/ShareModal.tsx

import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaWhatsapp, 
  FaTelegram, 
  FaLink,
  FaTimes,
  FaInstagram 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  image?: string;
}

const ShareModal = ({ isOpen, onClose, url, title, image }: ShareModalProps) => {


    const copyToClipboard = async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!');
        } catch (err) {
          toast.error('Failed to copy link');
        }
      };

      
  const shareOptions = [
    {
      name: 'Facebook',
      icon: <FaFacebookF />,
      color: '#1877f2',
      handler: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank'
        );
      }
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp />,
      color: '#25D366',
      handler: () => {
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`,
          '_blank'
        );
      }
    },
    {
      name: 'Telegram',
      icon: <FaTelegram />,
      color: '#0088cc',
      handler: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank'
        );
      }
    },
    {
      name: 'Twitter',
      icon: <FaTwitter />,
      color: '#1da1f2',
      handler: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank'
        );
      }
    },
    {
      name: 'Instagram',
      icon: <FaInstagram />,
      color: '#e4405f',
      handler: () => {
        // Instagram doesn't support direct sharing, so we'll copy the link
        copyToClipboard();
        toast.success('Link copied! Share on Instagram');
      }
    },
    {
      name: 'Copy Link',
      icon: <FaLink />,
      color: '#6c757d',
      handler: copyToClipboard
    }
  ];



  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="share-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="share-modal-content"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>

            <div className="share-header">
              <h2>Share {title}</h2>
              {image && (
                <div className="share-preview">
                  <img src={image} alt={title} />
                </div>
              )}
            </div>

            <div className="share-options">
              {shareOptions.map(option => (
                <motion.button
                  key={option.name}
                  className="share-option"
                  onClick={option.handler}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ 
                    '--accent-color': option.color 
                  } as React.CSSProperties}
                >
                  <span className="icon">{option.icon}</span>
                  <span className="name">{option.name}</span>
                </motion.button>
              ))}
            </div>

            <div className="share-footer">
              <p className="share-url">{url}</p>
              <button className="copy-btn" onClick={copyToClipboard}>
                <FaLink /> Copy
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;