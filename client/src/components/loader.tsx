const Loader = () => {
  return (
    <section className="loader">
      <div></div>
    </section>
  );
};

export const LoaderLayout = () => {
  return (
    <section
      style={{
        height: "calc(100vh - 4rem)",
      }}
      className="loader"
    >
      <div></div>
    </section>
  );
};

export default Loader;

interface SkeletonProps {
  className?: string;
  width?: string;
  length?: number;
  height?: string | number;
  count?: number; 
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return <div className={`skeleton ${className}`} {...props} />;
};
